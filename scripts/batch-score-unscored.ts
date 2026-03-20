/**
 * Batch score sites that have quality_score = 1 and no scoring dimensions.
 * These are arena-imported sites that were never run through the AI pipeline.
 *
 * Usage: npx tsx scripts/batch-score-unscored.ts [--limit 50] [--dry-run]
 *
 * This calls the /api/pipeline/score endpoint for each site,
 * which internally runs the scorer, tagger, router, and edge generator.
 *
 * Rate limiting: ~4s between calls to stay within Claude API limits.
 * Estimated time: ~25 min per 50 sites.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PIPELINE_API_KEY = process.env.PIPELINE_API_KEY!;
const APP_URL = process.env.SCORE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 50;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Step A: Auto-approve pending sites with real scores >= 70
  if (!dryRun) {
    const { data: autoApproved, error: approveErr } = await supabase
      .from('sites')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('status', 'pending')
      .gte('quality_score', 70)
      .select('id, url, quality_score');

    if (approveErr) {
      console.error('Auto-approve failed:', approveErr.message);
    } else {
      console.log(`\n--- Auto-Approved ${autoApproved?.length ?? 0} sites with score >= 70 ---`);
      autoApproved?.forEach(s => {
        const shortUrl = s.url.length > 50 ? s.url.substring(0, 47) + '...' : s.url;
        console.log(`  ✓ ${shortUrl} (score: ${s.quality_score})`);
      });
    }
  } else {
    const { data: wouldApprove } = await supabase
      .from('sites')
      .select('id, url, quality_score')
      .eq('status', 'pending')
      .gte('quality_score', 70);

    console.log(`\n--- [DRY RUN] Would auto-approve ${wouldApprove?.length ?? 0} sites with score >= 70 ---`);
    wouldApprove?.forEach(s => {
      const shortUrl = s.url.length > 50 ? s.url.substring(0, 47) + '...' : s.url;
      console.log(`  → ${shortUrl} (score: ${s.quality_score})`);
    });
  }

  // Step B: Find unscored sites (quality_score = 1, no scoring dimensions)
  const { data: unscored, error } = await supabase
    .from('sites')
    .select('id, url, title')
    .eq('status', 'pending')
    .eq('quality_score', 1)
    .is('scoring_dimensions', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch unscored sites:', error.message);
    process.exit(1);
  }

  console.log(`\nFound ${unscored?.length ?? 0} unscored sites (limit: ${limit})`);

  if (!unscored || unscored.length === 0) {
    console.log('Nothing to score.');
    return;
  }

  if (dryRun) {
    console.log('\n--- [DRY RUN] Would score these sites ---');
    unscored.forEach((s, i) => {
      const shortUrl = s.url.length > 60 ? s.url.substring(0, 57) + '...' : s.url;
      console.log(`  ${i + 1}. ${shortUrl}`);
    });
    console.log(`\nRun without --dry-run to score them.`);
    return;
  }

  console.log(`Scoring against: ${APP_URL}\n`);

  let scored = 0;
  let approved = 0;
  let pending = 0;
  let rejected = 0;
  let errors = 0;

  for (let i = 0; i < unscored.length; i++) {
    const site = unscored[i];
    const shortUrl = site.url.length > 60 ? site.url.substring(0, 57) + '...' : site.url;
    process.stdout.write(`[${i + 1}/${unscored.length}] ${shortUrl} ... `);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);

      const res = await fetch(`${APP_URL}/api/pipeline/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pipeline-api-key': PIPELINE_API_KEY,
        },
        body: JSON.stringify({ siteId: site.id }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 500 && typeof body.details === 'string' && body.details.includes('rate_limit')) {
          console.log(`RATE LIMITED — waiting 60s then retrying...`);
          await new Promise(r => setTimeout(r, 60_000));
          i--; // Retry this same site
          continue;
        }
        console.log(`FAIL (${res.status}: ${body.details ?? body.error ?? 'unknown'})`);
        errors++;
        continue;
      }

      const result = await res.json();
      const icon = result.decision === 'auto_approve' ? '✓' : result.decision === 'auto_reject' ? '✗' : '◎';
      console.log(`${icon} score=${result.score} decision=${result.decision}`);

      scored++;
      if (result.decision === 'auto_approve') approved++;
      else if (result.decision === 'auto_reject') rejected++;
      else pending++;

      // Pause between scoring calls to respect Claude API rate limits
      await new Promise(r => setTimeout(r, 4000));
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('TIMEOUT (>120s)');
        } else {
          console.log(`ERROR: ${err.message}`);
        }
      } else {
        console.log('ERROR: unknown');
      }
      errors++;
    }
  }

  console.log(`\n--- Batch Score Results ---`);
  console.log(`Scored:         ${scored}`);
  console.log(`Auto-approved:  ${approved}`);
  console.log(`Pending review: ${pending}`);
  console.log(`Auto-rejected:  ${rejected}`);
  console.log(`Errors:         ${errors}`);

  // Print overall DB stats
  const { count: totalCount } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true });
  const { count: approvedCount } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');
  const { count: pendingCount } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`\n--- Pipeline Stats ---`);
  console.log(`Total:    ${totalCount}`);
  console.log(`Approved: ${approvedCount}`);
  console.log(`Pending:  ${pendingCount}`);
}

main().catch(console.error);
