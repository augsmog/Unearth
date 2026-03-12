/**
 * Batch screenshot capture for all approved sites.
 *
 * Captures a 1280x720 JPEG screenshot of each site using Playwright,
 * uploads to Supabase Storage (screenshots bucket), and updates
 * the thumbnail_url column.
 *
 * Run with: npx tsx scripts/capture-screenshots.ts
 * Requires: Playwright installed, .env.local configured, screenshots bucket created in Supabase.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 720;
const SCREENSHOT_BUCKET = 'Screenshots';

async function main() {
  console.log('=== Unearth Screenshot Capture ===\n');

  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, url, title, thumbnail_url')
    .eq('status', 'approved')
    .order('created_at');

  if (error) {
    console.error('Failed to fetch sites:', error.message);
    process.exit(1);
  }

  // Only capture for sites missing thumbnails
  const needsScreenshot = sites?.filter(s => !s.thumbnail_url) ?? [];
  console.log(`${needsScreenshot.length} of ${sites?.length} sites need screenshots.\n`);

  if (needsScreenshot.length === 0) {
    console.log('All sites already have thumbnails. Done!');
    process.exit(0);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let captured = 0;
  let failed = 0;

  for (const site of needsScreenshot) {
    console.log(`[${captured + failed + 1}/${needsScreenshot.length}] ${site.title}`);

    try {
      const context = await browser.newContext({
        viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(1500);

      const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80 });
      await context.close();

      // Upload to Supabase Storage
      const filePath = `sites/${site.id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(SCREENSHOT_BUCKET)
        .upload(filePath, screenshotBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error(`  Upload failed: ${uploadError.message}`);
        failed++;
        continue;
      }

      // Get public URL and update DB
      const { data: urlData } = supabase.storage
        .from(SCREENSHOT_BUCKET)
        .getPublicUrl(filePath);

      await supabase
        .from('sites')
        .update({ thumbnail_url: urlData.publicUrl })
        .eq('id', site.id);

      captured++;
      console.log(`  Captured: ${urlData.publicUrl}`);
    } catch (err) {
      console.error(`  Failed: ${(err as Error).message}`);
      failed++;
    }
  }

  await browser.close();

  console.log(`\n=== Summary ===`);
  console.log(`Captured: ${captured}`);
  console.log(`Failed: ${failed}`);
  console.log('Done!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
