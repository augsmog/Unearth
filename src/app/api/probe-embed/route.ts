import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

/**
 * Probes a URL to check if it can be embedded in an iframe.
 * Checks X-Frame-Options and Content-Security-Policy headers.
 *
 * Also used by SiteViewer to report back embeddability after load.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { siteId, url, result } = body as {
    siteId?: string;
    url?: string;
    result?: 'embeddable' | 'blocked';
  };

  // Mode 1: SiteViewer reporting back a result
  if (siteId && result) {
    const iframe_compatible = result === 'embeddable';
    await adminClient
      .from('sites')
      .update({
        iframe_compatible,
        iframe_tested_at: new Date().toISOString(),
      })
      .eq('id', siteId);

    return NextResponse.json({ updated: true, iframe_compatible });
  }

  // Mode 2: Probe a URL by checking headers
  const targetUrl = url;
  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Unearth/1.0)',
      },
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    });

    const xFrameOptions = response.headers.get('x-frame-options')?.toLowerCase();
    const csp = response.headers.get('content-security-policy')?.toLowerCase();

    let embeddable = true;

    // X-Frame-Options: DENY or SAMEORIGIN blocks iframe
    if (xFrameOptions === 'deny' || xFrameOptions === 'sameorigin') {
      embeddable = false;
    }

    // CSP frame-ancestors: 'none' or 'self' blocks iframe
    if (csp) {
      const frameAncestors = csp.match(/frame-ancestors\s+([^;]+)/);
      if (frameAncestors) {
        const value = frameAncestors[1].trim();
        if (value === "'none'" || value === "'self'") {
          embeddable = false;
        }
      }
    }

    // Update the site record if siteId provided
    if (siteId) {
      await adminClient
        .from('sites')
        .update({
          iframe_compatible: embeddable,
          iframe_tested_at: new Date().toISOString(),
        })
        .eq('id', siteId);
    }

    return NextResponse.json({
      url: targetUrl,
      embeddable,
      xFrameOptions: xFrameOptions ?? null,
      csp: csp ? (csp.length > 200 ? csp.substring(0, 200) + '...' : csp) : null,
    });
  } catch (err) {
    return NextResponse.json({
      url: targetUrl,
      embeddable: false,
      error: err instanceof Error ? err.message : 'Probe failed',
    });
  }
}
