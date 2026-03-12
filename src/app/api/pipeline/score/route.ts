import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { scoreSite } from '@/lib/pipeline/scorer';
import { processScoredSite } from '@/lib/pipeline/router';

function validateApiKey(request: NextRequest): boolean {
  const key = request.headers.get('x-pipeline-api-key');
  return key === process.env.PIPELINE_API_KEY;
}

export async function POST(request: NextRequest) {
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
    // Fetch site from DB
    const { data: site, error: fetchError } = await adminClient
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (fetchError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Mark as scoring
    await adminClient
      .from('sites')
      .update({ status: 'scoring' })
      .eq('id', siteId);

    // Fetch the site's text content for scoring
    let textContent = site.description ?? '';

    try {
      const pageRes = await fetch(site.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; Unearth/1.0; +https://unearth.app)',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        // Strip HTML tags for basic text extraction
        textContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch {
      // Proceed with description only if page fetch fails
    }

    // Run the scorer
    const scoringResult = await scoreSite(site.url, textContent, site.title);

    // Process the result through the router
    const { decision, tagged } = await processScoredSite(siteId, scoringResult);

    return NextResponse.json({
      siteId,
      score: scoringResult.overall_score,
      decision,
      tagged,
      ai_content_likelihood: scoringResult.ai_content_likelihood,
      dimensions: scoringResult.dimensions,
    });
  } catch (err) {
    // Revert status on failure
    await adminClient
      .from('sites')
      .update({ status: 'pending' })
      .eq('id', siteId);

    console.error(`Pipeline score error (${siteId}):`, err);
    return NextResponse.json(
      {
        error: 'Scoring failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
