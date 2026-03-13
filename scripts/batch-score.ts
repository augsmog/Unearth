/**
 * Batch score pending pages through the pipeline.
 * Processes pages one at a time to respect API rate limits.
 *
 * Usage: npx tsx scripts/batch-score.ts [--limit N]
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PIPELINE_API_KEY = process.env.PIPELINE_API_KEY!;
const APP_URL = process.env.SCORE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit'));
  const limit = limitArg ? parseInt(process.argv[process.argv.indexOf(limitArg) + 1]) : 20;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get pending sites
  const { data: pending, error } = await supabase
    .from('sites')
    .select('id, url, title')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch pending sites:', error.message);
    process.exit(1);
  }

  console.log(`Found ${pending?.length ?? 0} pending pages (limit: ${limit})`);
  console.log(`Scoring against: ${APP_URL}\n`);

  if (!pending || pending.length === 0) {
    console.log('Nothing to score.');
    return;
  }

  let scored = 0;
  let approved = 0;
  let rejected = 0;
  let errors = 0;

  for (let i = 0; i < pending.length; i++) {
    const site = pending[i];
    const shortUrl = site.url.length > 60 ? site.url.substring(0, 57) + '...' : site.url;
    process.stdout.write(`[${i + 1}/${pending.length}] ${shortUrl} ... `);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

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
          i--; // Retry this same page
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
      if (result.decision === 'auto_reject') rejected++;

      // Pause between scoring calls to respect Claude API rate limits (30k input tokens/min)
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
  console.log(`Scored:   ${scored}`);
  console.log(`Approved: ${approved}`);
  console.log(`Rejected: ${rejected}`);
  console.log(`Errors:   ${errors}`);

  // Print overall stats
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
