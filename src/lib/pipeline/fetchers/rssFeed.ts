import type { RawSite } from '@/types';

/**
 * Default curated feed list spanning tech, design, indie makers, and culture.
 */
export const DEFAULT_FEEDS: string[] = [
  // ── Discovery & Cross-category ──────────────────────────────────────
  'https://hnrss.org/best',                          // Hacker News best
  'https://blog.acolyer.org/feed/',                   // CS paper reviews
  'https://feeds.feedburner.com/brainpickings/rss',   // Culture & creativity

  // ── Creative & Design ───────────────────────────────────────────────
  'https://alistapart.com/main/feed/',                // Web standards & design
  'https://feeds.feedburner.com/codrops',             // UI/UX inspiration
  'https://tympanus.net/codrops/feed/',               // Creative dev
  'https://www.itsnicethat.com/rss',                  // Creative culture
  'https://www.thisiscolossal.com/feed/',             // Art & visual culture
  'https://www.typewolf.com/feed',                    // Typography & design

  // ── Tech & Development ──────────────────────────────────────────────
  'https://www.indiehackers.com/feed.xml',            // Indie hackers
  'https://nesslabs.com/feed',                        // Mindful productivity
  'https://lobste.rs/rss',                            // Lobste.rs (high signal)
  'https://console.dev/rss.xml',                      // New dev tools

  // ── Science & Nature ────────────────────────────────────────────────
  'https://nautil.us/feed/',                          // Nautilus — science essays
  'https://www.quantamagazine.org/feed/',             // Quanta — math & science
  'https://aeon.co/feed.rss',                         // Aeon — ideas & culture

  // ── Music & Audio ───────────────────────────────────────────────────
  'https://daily.bandcamp.com/feed',                  // Bandcamp Daily
  'https://musicforprogramming.net/rss.xml',          // Music for Programming

  // ── Nature & Outdoors ───────────────────────────────────────────────
  'https://www.biographic.com/feed/',                 // bioGraphic — nature stories
  'https://hakaimagazine.com/feed/',                  // Hakai — coastal science

  // ── Gaming ──────────────────────────────────────────────────────────
  'https://www.freeindiegam.es/feed/',                // Free Indie Games

  // ── Lifestyle & Culture ─────────────────────────────────────────────
  'https://thepudding.cool/feed/index.xml',           // The Pudding — visual essays
  'https://restofworld.org/feed/',                    // Rest of World — global tech
];

interface FeedItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
}

/**
 * Parse RSS/Atom feeds and return items as RawSite[].
 *
 * @param feedUrls - List of RSS feed URLs. Defaults to DEFAULT_FEEDS.
 */
export async function fetchRssFeeds(
  feedUrls: string[] = DEFAULT_FEEDS
): Promise<RawSite[]> {
  const results = await Promise.allSettled(
    feedUrls.map((url) => parseFeed(url))
  );

  const now = new Date().toISOString();
  const sites: RawSite[] = [];
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;

    for (const item of result.value) {
      const normalizedUrl = normalizeUrl(item.link);
      if (!normalizedUrl || seenUrls.has(normalizedUrl)) continue;
      seenUrls.add(normalizedUrl);

      sites.push({
        url: normalizedUrl,
        title: item.title,
        description: item.description
          ? stripHtml(item.description).slice(0, 500)
          : undefined,
        source: 'rss_feed',
        sourceUrl: item.link,
        fetchedAt: now,
      });
    }
  }

  return sites;
}

async function parseFeed(feedUrl: string): Promise<FeedItem[]> {
  const res = await fetch(feedUrl, {
    headers: {
      'User-Agent': 'Unearth/1.0 RSS Reader',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Feed fetch failed: ${feedUrl} (${res.status})`);
  }

  const xml = await res.text();
  return parseXmlItems(xml);
}

/**
 * Lightweight XML parser for RSS 2.0 and Atom feeds.
 * Avoids external dependencies by using regex extraction.
 */
function parseXmlItems(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  // Detect format
  const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"');

  if (isAtom) {
    const entryPattern = /<entry>([\s\S]*?)<\/entry>/g;
    let match: RegExpExecArray | null;

    while ((match = entryPattern.exec(xml)) !== null) {
      const entry = match[1];
      const title = extractTag(entry, 'title');
      const link =
        extractAtomLink(entry) ?? extractTag(entry, 'id');
      const summary =
        extractTag(entry, 'summary') ?? extractTag(entry, 'content');

      if (title && link) {
        items.push({
          title,
          link,
          description: summary ?? undefined,
        });
      }
    }
  } else {
    // RSS 2.0
    const itemPattern = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemPattern.exec(xml)) !== null) {
      const item = match[1];
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      const description = extractTag(item, 'description');

      if (title && link) {
        items.push({
          title,
          link,
          description: description ?? undefined,
        });
      }
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  // Handle CDATA sections
  const cdataPattern = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();

  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].trim() : null;
}

function extractAtomLink(entry: string): string | null {
  // Prefer alternate links
  const altMatch = entry.match(
    /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/
  );
  if (altMatch) return altMatch[1];

  // Fallback to any link with href
  const hrefMatch = entry.match(/<link[^>]*href=["']([^"']+)["']/);
  return hrefMatch ? hrefMatch[1] : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // Skip non-http links
    if (!u.protocol.startsWith('http')) return null;
    return u.href;
  } catch {
    return null;
  }
}
