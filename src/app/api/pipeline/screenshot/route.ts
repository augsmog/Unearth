import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { captureScreenshot } from '@/lib/pipeline/screenshot';

function validateApiKey(request: NextRequest): boolean {
  const key = request.headers.get('x-pipeline-api-key');
  return key === process.env.PIPELINE_API_KEY;
}

export async function POST(request: NextRequest) {
  // Playwright requires Chromium (~280MB) which exceeds Vercel's 50MB serverless limit
  if (process.env.VERCEL) {
    return Response.json(
      { error: 'Screenshot capture unavailable in serverless environment. Use n8n pipeline or local script instead.' },
      { status: 503 }
    );
  }

  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { siteId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { siteId } = body;

  if (!siteId || typeof siteId !== 'string') {
    return NextResponse.json(
      { error: 'siteId is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch site URL from DB
    const { data: site, error: fetchError } = await adminClient
      .from('sites')
      .select('url')
      .eq('id', siteId)
      .single();

    if (fetchError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Capture screenshot and upload
    const thumbnailUrl = await captureScreenshot(site.url, siteId);

    // Update site record with thumbnail URL
    const { error: updateError } = await adminClient
      .from('sites')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', siteId);

    if (updateError) {
      throw new Error(`Failed to update thumbnail: ${updateError.message}`);
    }

    return NextResponse.json({
      siteId,
      thumbnail_url: thumbnailUrl,
    });
  } catch (err) {
    console.error(`Pipeline screenshot error (${siteId}):`, err);
    return NextResponse.json(
      {
        error: 'Screenshot capture failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
