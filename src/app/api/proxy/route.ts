import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route that fetches external pages and serves them with relaxed
 * framing headers so they can load inside Unearth's iframe viewer.
 *
 * Injects a <base> tag so relative URLs (CSS, JS, images) resolve correctly
 * against the original domain.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Unearth/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') ?? 'text/html';

    // For non-HTML content (images, CSS, JS), pass through directly
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      const body = await response.arrayBuffer();
      return new NextResponse(body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    let html = await response.text();

    // Inject <base> tag so relative URLs resolve against the original domain
    const baseTag = `<base href="${parsed.origin}${parsed.pathname.replace(/\/[^/]*$/, '/')}">`;

    // Navigation tracking script: reports when user navigates within the proxied page
    // This enables automatic page discovery — if a user navigates from a page to
    // another page on the same site and engages with it, we can add it to our pipeline
    const navTracker = `<script data-unearth-tracker>
(function() {
  var origin = ${JSON.stringify(parsed.origin)};
  var initialPath = location.pathname;
  var lastReported = initialPath;

  // Report navigation to parent
  function reportNav(url, title) {
    try {
      window.parent.postMessage({
        type: 'unearth:navigation',
        url: url,
        title: title || document.title,
        origin: origin
      }, '*');
    } catch(e) {}
  }

  // Intercept link clicks on same-origin links
  document.addEventListener('click', function(e) {
    var a = e.target;
    while (a && a.tagName !== 'A') a = a.parentElement;
    if (!a || !a.href) return;
    try {
      var linkUrl = new URL(a.href, origin);
      if (linkUrl.origin === origin && linkUrl.pathname !== initialPath) {
        reportNav(linkUrl.href, a.textContent);
      }
    } catch(e) {}
  }, true);

  // Detect pushState/replaceState navigation (SPAs)
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  history.pushState = function() {
    origPush.apply(this, arguments);
    checkNav();
  };
  history.replaceState = function() {
    origReplace.apply(this, arguments);
    checkNav();
  };
  window.addEventListener('popstate', checkNav);

  function checkNav() {
    if (location.pathname !== lastReported) {
      lastReported = location.pathname;
      reportNav(origin + location.pathname + location.search, document.title);
    }
  }
})();
</script>`;

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}${navTracker}`);
    } else if (html.includes('<HEAD>')) {
      html = html.replace('<HEAD>', `<HEAD>${baseTag}${navTracker}`);
    } else {
      html = baseTag + navTracker + html;
    }

    return new NextResponse(html, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        // Explicitly do NOT set X-Frame-Options or restrictive CSP
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
