import { adminClient } from '@/lib/supabase/admin';

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 720;
const SCREENSHOT_BUCKET = 'Screenshots';

/**
 * Capture a screenshot of a URL using Playwright, upload to Supabase Storage,
 * and return the public URL.
 *
 * Playwright is imported dynamically to avoid bundling issues in serverless
 * environments and to keep it as a dev/optional dependency.
 */
export async function captureScreenshot(
  url: string,
  siteId: string
): Promise<string | null> {
  // Dynamic import to avoid bundling playwright in the client
  let chromium: Awaited<typeof import('playwright')>['chromium'];
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    console.warn('Playwright not available — screenshot capture disabled');
    return null;
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    // Brief pause for lazy-loaded content
    await page.waitForTimeout(1500);

    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 80,
    });

    await context.close();

    // Upload to Supabase Storage
    const fileName = `${siteId}.jpg`;
    const filePath = `sites/${fileName}`;

    const { error: uploadError } = await adminClient.storage
      .from(SCREENSHOT_BUCKET)
      .upload(filePath, screenshotBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Screenshot upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from(SCREENSHOT_BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
