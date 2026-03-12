import { adminClient } from '@/lib/supabase/admin';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';
import type { RawSite } from '@/types';

/**
 * Fetch links from curated indie web directories.
 *
 * These directories already do the work of finding obscure, interesting sites.
 * We scrape them lightly (weekly) to find new content.
 */

async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();

  const { data } = await adminClient
    .from('sites')
    .select('url')
    .in('url', urls);

  return new Set((data ?? []).map((row) => row.url));
}

/**
 * Fetch from ooh.directory — a human-curated blog directory.
 * Uses their categories page to find blogs organized by topic.
 */
async function fetchOohDirectory(): Promise<RawSite[]> {
  const categories = [
    'technology', 'art', 'science', 'music', 'food',
    'games', 'nature', 'crafts', 'writing',
  ];

  const sites: RawSite[] = [];
  const now = new Date().toISOString();

  for (const category of categories) {
    try {
      const res = await fetch(`https://ooh.directory/categories/${category}/`, {
        headers: { 'User-Agent': 'Unearth/1.0' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Extract blog URLs from the directory listing
      const linkPattern = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*class="[^"]*blog-link[^"]*"/g;
      let match;
      while ((match = linkPattern.exec(html)) !== null) {
        const url = match[1];
        if (!isBlockedDomain(url)) {
          sites.push({
            url,
            title: 'Untitled', // Will be enriched by pipeline
            source: 'directory',
            sourceUrl: `https://ooh.directory/categories/${category}/`,
            fetchedAt: now,
          });
        }
      }

      // Also try a more general link extraction for directory listings
      const generalPattern = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>/g;
      while ((match = generalPattern.exec(html)) !== null) {
        const url = match[1];
        // Skip internal ooh.directory links and common infrastructure
        if (url.includes('ooh.directory')) continue;
        if (url.includes('github.com')) continue;
        if (url.includes('twitter.com')) continue;
        if (!isBlockedDomain(url) && !sites.some((s) => s.url === url)) {
          sites.push({
            url,
            title: 'Untitled',
            source: 'directory',
            sourceUrl: `https://ooh.directory/categories/${category}/`,
            fetchedAt: now,
          });
        }
      }
    } catch (err) {
      console.warn(`ooh.directory fetch failed for ${category}:`, err);
    }
  }

  return sites;
}

/**
 * Fetch from Marginalia Search — a search engine for the non-commercial web.
 * Uses their API to find indie, personal, and niche websites.
 */
async function fetchMarginalia(): Promise<RawSite[]> {
  const queries = [
    'personal website',
    'creative coding',
    'web experiment',
    'interactive art',
    'indie game',
    'niche blog',
    'data visualization',
    'generative art',
    'science blog',
    'music discovery',
  ];

  const sites: RawSite[] = [];
  const now = new Date().toISOString();
  const seenUrls = new Set<string>();

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.marginalia.nu/public/search/${encodeURIComponent(query)}?count=20&index=0`,
        {
          headers: { 'User-Agent': 'Unearth/1.0' },
          signal: AbortSignal.timeout(10_000),
        }
      );

      if (!res.ok) continue;

      const json = await res.json();
      const results = json?.results ?? [];

      for (const result of results) {
        const url = result.url;
        if (!url || seenUrls.has(url)) continue;
        if (isBlockedDomain(url)) continue;
        seenUrls.add(url);

        sites.push({
          url,
          title: result.title ?? 'Untitled',
          description: result.description?.slice(0, 500) ?? undefined,
          source: 'directory',
          sourceUrl: `https://search.marginalia.nu/search?query=${encodeURIComponent(query)}`,
          fetchedAt: now,
        });
      }
    } catch (err) {
      console.warn(`Marginalia fetch failed for "${query}":`, err);
    }
  }

  return sites;
}

/**
 * Fetch from Neocities — modern Geocities, full of indie personal sites.
 * Uses their browse API sorted by various criteria.
 */
async function fetchNeocities(): Promise<RawSite[]> {
  const sortOptions = ['newest', 'most_followed', 'last_updated'];
  const sites: RawSite[] = [];
  const now = new Date().toISOString();
  const seenUrls = new Set<string>();

  for (const sort of sortOptions) {
    try {
      const res = await fetch(
        `https://neocities.org/browse?sort_by=${sort}`,
        {
          headers: { 'User-Agent': 'Unearth/1.0' },
          signal: AbortSignal.timeout(10_000),
        }
      );

      if (!res.ok) continue;

      const html = await res.text();

      // Extract site URLs from the browse page
      const pattern = /href="(https?:\/\/[a-zA-Z0-9-]+\.neocities\.org\/?)"[^>]*/g;
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1];
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        sites.push({
          url,
          title: 'Untitled', // Will be enriched by pipeline
          source: 'directory',
          sourceUrl: `https://neocities.org/browse?sort_by=${sort}`,
          fetchedAt: now,
        });
      }
    } catch (err) {
      console.warn(`Neocities fetch failed for sort=${sort}:`, err);
    }
  }

  return sites;
}

/**
 * Fetch from all indie web directories.
 * Designed to run weekly rather than daily.
 */
export async function fetchDirectories(): Promise<RawSite[]> {
  const [ooh, marginalia, neocities] = await Promise.allSettled([
    fetchOohDirectory(),
    fetchMarginalia(),
    fetchNeocities(),
  ]);

  const allSites: RawSite[] = [];
  const seenUrls = new Set<string>();

  for (const result of [ooh, marginalia, neocities]) {
    if (result.status !== 'fulfilled') continue;
    for (const site of result.value) {
      if (!seenUrls.has(site.url)) {
        seenUrls.add(site.url);
        allSites.push(site);
      }
    }
  }

  // Deduplicate against DB
  const candidateUrls = allSites.map((s) => s.url);
  const existingUrls = await getExistingUrls(candidateUrls);

  return allSites.filter((s) => !existingUrls.has(s.url));
}
