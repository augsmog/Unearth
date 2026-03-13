import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('Running migration 007: pages model + embeddability...\n');

  // 1. Add domain column
  console.log('1. Adding domain column...');
  const { error: e1 } = await supabase.rpc('exec_sql' as string, {
    sql: `ALTER TABLE sites ADD COLUMN IF NOT EXISTS domain TEXT`
  });
  // rpc may not exist, try raw query approach via postgrest
  if (e1) {
    console.log('  rpc not available, using direct approach...');
  }

  // Since we can't run raw SQL via the JS client easily,
  // let's use the Supabase Management API approach or just
  // add columns that postgrest can detect.

  // Test if columns exist by selecting them
  const { error: testErr } = await supabase.from('sites').select('domain').limit(1);
  if (testErr && testErr.message.includes('domain')) {
    console.log('  domain column does not exist yet.');
    console.log('  ⚠ Please run the SQL migration manually via Supabase Dashboard SQL Editor:');
    console.log('  File: supabase/migrations/007_pages_model_embeddability.sql');
    return;
  }
  console.log('  ✓ domain column exists');

  // Test iframe_compatible
  const { error: testErr2 } = await supabase.from('sites').select('iframe_compatible').limit(1);
  if (testErr2 && testErr2.message.includes('iframe_compatible')) {
    console.log('  iframe_compatible column does not exist yet.');
    console.log('  ⚠ Please run the SQL migration manually via Supabase Dashboard SQL Editor');
    return;
  }
  console.log('  ✓ iframe_compatible column exists');

  // 2. Backfill domain from URLs
  console.log('\n2. Backfilling domain from URLs...');
  const { data: sites } = await supabase
    .from('sites')
    .select('id, url')
    .is('domain', null);

  if (sites && sites.length > 0) {
    let updated = 0;
    for (const site of sites) {
      try {
        const url = new URL(site.url);
        const domain = url.hostname.replace(/^www\./, '');
        const { error } = await supabase
          .from('sites')
          .update({ domain })
          .eq('id', site.id);
        if (!error) updated++;
      } catch {
        // skip invalid URLs
      }
    }
    console.log(`  ✓ Backfilled domain for ${updated}/${sites.length} sites`);
  } else {
    console.log('  ✓ All sites already have domains');
  }

  // 3. Check user_page_views table
  const { error: viewsErr } = await supabase.from('user_page_views').select('id').limit(1);
  if (viewsErr) {
    console.log('\n3. user_page_views table does not exist yet.');
    console.log('  ⚠ Please run the full SQL migration via Supabase Dashboard SQL Editor');
  } else {
    console.log('\n3. ✓ user_page_views table exists');
  }

  // 4. Stats
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

  const { data: domainStats } = await supabase
    .from('sites')
    .select('domain')
    .eq('status', 'approved')
    .not('domain', 'is', null);

  const uniqueDomains = new Set(domainStats?.map(s => s.domain)).size;

  console.log(`\n--- Pipeline Stats ---`);
  console.log(`Total pages:    ${totalCount}`);
  console.log(`Approved:       ${approvedCount}`);
  console.log(`Pending:        ${pendingCount}`);
  console.log(`Unique domains: ${uniqueDomains}`);
  console.log(`Rejected:       ${(totalCount ?? 0) - (approvedCount ?? 0) - (pendingCount ?? 0)}`);
}

run().catch(console.error);
