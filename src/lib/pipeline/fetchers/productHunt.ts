import type { RawSite } from '@/types';

const PH_URL = 'https://www.producthunt.com';

interface PHPost {
  name: string;
  tagline: string;
  url: string;
  slug: string;
  websiteUrl?: string;
}

/**
 * Fetch trending products from Product Hunt.
 *
 * Uses the publicly-available __NEXT_DATA__ JSON embedded in the
 * Product Hunt homepage, which does not require OAuth credentials.
 * Falls back to basic HTML scraping if the JSON payload shape changes.
 */
export async function fetchProductHunt(): Promise<RawSite[]> {
  const res = await fetch(PH_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Product Hunt: ${res.status}`);
  }

  const html = await res.text();
  const now = new Date().toISOString();
  const sites: RawSite[] = [];

  // Strategy 1: Extract from __NEXT_DATA__ script tag
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );

  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      const posts = extractPostsFromNextData(data);
      for (const post of posts) {
        if (post.websiteUrl) {
          sites.push({
            url: post.websiteUrl,
            title: post.name,
            description: post.tagline,
            source: 'product_hunt',
            sourceUrl: `${PH_URL}/posts/${post.slug}`,
            fetchedAt: now,
          });
        }
      }
    } catch {
      // Fall through to HTML scraping
    }
  }

  // Strategy 2: HTML scraping fallback
  if (sites.length === 0) {
    const postPattern =
      /<a[^>]*href="\/posts\/([^"]+)"[^>]*>[\s\S]*?<\/a>/g;
    const titlePattern =
      /data-test="post-name"[^>]*>([^<]+)</g;

    const slugs: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = postPattern.exec(html)) !== null) {
      const slug = match[1];
      if (!slugs.includes(slug)) {
        slugs.push(slug);
      }
    }

    const titles: string[] = [];
    while ((match = titlePattern.exec(html)) !== null) {
      titles.push(match[1].trim());
    }

    for (let i = 0; i < Math.min(slugs.length, 20); i++) {
      sites.push({
        url: `${PH_URL}/posts/${slugs[i]}`,
        title: titles[i] ?? slugs[i].replace(/-/g, ' '),
        description: undefined,
        source: 'product_hunt',
        sourceUrl: `${PH_URL}/posts/${slugs[i]}`,
        fetchedAt: now,
      });
    }
  }

  return sites;
}

function extractPostsFromNextData(data: Record<string, unknown>): PHPost[] {
  const posts: PHPost[] = [];

  function walk(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) walk(item);
      return;
    }

    const record = obj as Record<string, unknown>;

    // Identify a post node: has name, tagline, and slug
    if (
      typeof record.name === 'string' &&
      typeof record.tagline === 'string' &&
      typeof record.slug === 'string'
    ) {
      posts.push({
        name: record.name,
        tagline: record.tagline,
        url: typeof record.url === 'string' ? record.url : '',
        slug: record.slug,
        websiteUrl:
          typeof record.website === 'string'
            ? record.website
            : typeof record.websiteUrl === 'string'
              ? record.websiteUrl
              : typeof record.productLinks === 'object' &&
                  record.productLinks !== null &&
                  Array.isArray(record.productLinks) &&
                  record.productLinks.length > 0 &&
                  typeof record.productLinks[0].url === 'string'
                ? record.productLinks[0].url
                : undefined,
      });
      return;
    }

    for (const value of Object.values(record)) {
      walk(value);
    }
  }

  walk(data);
  return posts;
}
