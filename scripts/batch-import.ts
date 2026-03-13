/**
 * Batch import sites from a text file or stdin (one URL per line).
 *
 * Usage:
 *   npx tsx scripts/batch-import.ts urls.txt
 *   echo "https://example.com" | npx tsx scripts/batch-import.ts
 *
 * Each URL is inserted into the sites table with status 'pending'
 * and source 'manual', ready for the scoring pipeline.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const args = process.argv.slice(2);

  let input: string;
  if (args[0]) {
    input = readFileSync(args[0], 'utf-8');
  } else {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    input = Buffer.concat(chunks).toString('utf-8');
  }

  const urls = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('http'));

  if (urls.length === 0) {
    console.log('No URLs provided. Pass a file or pipe URLs to stdin.');
    process.exit(0);
  }

  console.log(`=== Batch Import: ${urls.length} URLs ===\n`);

  // Check for existing URLs
  const { data: existing } = await supabase
    .from('sites')
    .select('url')
    .in('url', urls);

  const existingSet = new Set((existing ?? []).map((r) => r.url));
  const newUrls = urls.filter((u) => !existingSet.has(u));

  console.log(`${existingSet.size} already in database, ${newUrls.length} new.\n`);

  let imported = 0;
  let failed = 0;

  for (const url of newUrls) {
    try {
      // Fetch basic metadata
      let title = 'Untitled';
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(10_000),
          redirect: 'follow',
        });

        if (res.ok) {
          const html = await res.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) {
            title = titleMatch[1].trim().slice(0, 200);
          }
        }
      } catch {
        // Continue with 'Untitled'
      }

      const { error } = await supabase.from('sites').insert({
        url,
        title,
        status: 'pending',
        source: 'manual',
        categories: [],
        tags: [],
        quality_score: 1,
        ai_content_likelihood: 'low',
        content_type: 'other',
      });

      if (error) {
        console.log(`  FAIL: ${url} — ${error.message}`);
        failed++;
      } else {
        console.log(`  OK: ${title} (${url})`);
        imported++;
      }
    } catch (err) {
      console.log(`  FAIL: ${url} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (existing): ${existingSet.size}`);
  console.log(`Failed: ${failed}`);
  console.log('Done!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
