/**
 * Category coverage report — shows approved site count per category
 * and flags gaps that need filling.
 *
 * Run with: npx tsx scripts/category-coverage-report.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MIN_TARGET = 5;

async function main() {
  console.log('=== Unearth Category Coverage Report ===\n');

  // Fetch all interests (categories)
  const { data: interests, error: intError } = await supabase
    .from('interests')
    .select('id, name, slug, parent_id')
    .order('position');

  if (intError) {
    console.error('Failed to fetch interests:', intError.message);
    process.exit(1);
  }

  // Get parent categories only
  const parents = (interests ?? []).filter((i) => !i.parent_id);

  // Fetch all approved sites with their categories
  const { data: sites, error: siteError } = await supabase
    .from('sites')
    .select('id, categories, title')
    .eq('status', 'approved');

  if (siteError) {
    console.error('Failed to fetch sites:', siteError.message);
    process.exit(1);
  }

  // Count sites per category slug
  const categoryCounts: Record<string, number> = {};
  for (const site of sites ?? []) {
    const cats: string[] = site.categories ?? [];
    for (const cat of cats) {
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    }
  }

  // Build report
  const rows: { name: string; slug: string; count: number; status: string }[] = [];
  let totalGaps = 0;

  for (const parent of parents) {
    // Count for this parent category
    const count = categoryCounts[parent.slug] ?? 0;

    // Also count subcategories
    const subs = (interests ?? []).filter((i) => i.parent_id === parent.id);
    let subTotal = count;
    for (const sub of subs) {
      subTotal += categoryCounts[sub.slug] ?? 0;
    }

    const status =
      subTotal >= MIN_TARGET
        ? '\u2713'
        : `\u26A0 NEEDS ${MIN_TARGET - subTotal}`;

    if (subTotal < MIN_TARGET) totalGaps += MIN_TARGET - subTotal;

    rows.push({
      name: parent.name,
      slug: parent.slug,
      count: subTotal,
      status,
    });
  }

  // Sort by count ascending (gaps first)
  rows.sort((a, b) => a.count - b.count);

  // Print table
  const nameWidth = Math.max(...rows.map((r) => r.name.length), 20);
  const header = `${'Category'.padEnd(nameWidth)} | Approved | Target | Status`;
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const row of rows) {
    console.log(
      `${row.name.padEnd(nameWidth)} | ${String(row.count).padStart(8)} | ${String(MIN_TARGET).padStart(6)} | ${row.status}`
    );
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total approved sites: ${(sites ?? []).length}`);
  console.log(`Categories below target: ${rows.filter((r) => r.count < MIN_TARGET).length}`);
  console.log(`Total gap: ${totalGaps} sites needed`);
  console.log(`\nDone!`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
