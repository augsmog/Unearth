import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';

async function main() {
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Read the full SQL migration
  const sql = fs.readFileSync('supabase/migrations/007_pages_model_embeddability.sql', 'utf8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 10);

  console.log(`Running ${statements.length} SQL statements against ${projectRef}...\n`);

  // Use the Supabase SQL endpoint (available via service role)
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    const res = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ query: stmt }),
    });

    if (!res.ok) {
      // Try the pg_net approach or direct SQL
      const res2 = await fetch(`https://${projectRef}.supabase.co/pg/query`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: stmt + ';' }),
      });

      if (!res2.ok) {
        console.log(`  ⚠ Could not run via API (${res2.status})`);
      } else {
        console.log('  ✓ OK');
      }
    } else {
      console.log('  ✓ OK');
    }
  }

  // Verify by selecting the new columns
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);

  const { data, error } = await supabase.from('sites').select('id, domain, iframe_compatible').limit(2);
  if (error) {
    console.log('\n⚠ Verification failed:', error.message);
    console.log('\nThe SQL needs to be run manually. Please:');
    console.log('1. Go to https://supabase.com/dashboard/project/' + projectRef + '/sql');
    console.log('2. Paste the contents of: supabase/migrations/007_pages_model_embeddability.sql');
    console.log('3. Click "Run"');
  } else {
    console.log('\n✓ Migration verified! Columns exist.');
    console.log('Sample:', JSON.stringify(data));
  }
}

main().catch(console.error);
