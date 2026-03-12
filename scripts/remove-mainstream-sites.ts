/**
 * Removes mainstream/well-known brand sites from the approved pool.
 * These are sites that tech-inclined users would already know about —
 * Unearth should surface indie, obscure, hard-to-find gems.
 *
 * Run with: npx tsx scripts/remove-mainstream-sites.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sites that are too well-known / mainstream for our target demo
const MAINSTREAM_URLS = [
  'https://huggingface.co',            // Massive well-known AI platform
  'https://dribbble.com',              // Every designer knows Dribbble
  'https://www.awwwards.com',          // Well-known design awards
  'https://www.khanacademy.org/kids',  // Khan Academy is a household name
  'https://brilliant.org',             // Heavy SEO/advertising presence
  'https://www.theverge.com/features', // Major media brand
  'https://www.theringer.com',         // Major media brand (Bill Simmons)
  'https://fivethirtyeight.com',       // Major media brand (Nate Silver)
  'https://www.outsideonline.com',     // Major media brand
  'https://www.nationalgeographic.com/animals', // National Geographic
  'https://www.thedodo.com',           // Major media brand
  'https://www.scarymommy.com',        // Major media brand
  'https://www.electrek.co',           // Major media brand
  'https://www.thedrive.com',          // Major media brand
  'https://www.notion.so/templates',   // Notion is everywhere
  'https://css-tricks.com',            // Every developer knows CSS-Tricks
  'https://www.levels.fyi',            // Well-known in tech
  'https://www.levels.fyi/blog',       // Duplicate brand
  'https://lexfridman.com/podcast',    // Celebrity podcaster
  'https://itch.io',                   // Well-known gaming platform
  'https://www.seriouseats.com',       // Major media brand
  'https://www.atlasobscura.com',      // Well-known, heavily SEO'd
  'https://remoteok.com',              // Well-known job board
  'https://tldr.tech',                 // Very well-known tech newsletter
];

async function main() {
  console.log('=== Removing Mainstream Sites ===\n');

  for (const url of MAINSTREAM_URLS) {
    const { data, error } = await supabase
      .from('sites')
      .update({ status: 'rejected' })
      .eq('url', url)
      .select('title')
      .single();

    if (error) {
      console.log(`  Skip: ${url} (${error.message})`);
    } else {
      console.log(`  Rejected: ${data?.title} (${url})`);
    }
  }

  // Count remaining approved sites
  const { count } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  console.log(`\n${MAINSTREAM_URLS.length} sites marked as rejected.`);
  console.log(`${count} approved sites remaining.`);
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
