import { adminClient } from '@/lib/supabase/admin';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';
import type { RawSite } from '@/types';

/**
 * Curated Are.na channels that surface indie/creative/niche content.
 * Are.na is used by designers, artists, and researchers — perfect for
 * creative, design, and art categories.
 */
const ARENA_CHANNELS = [
  'creative-coding-hn0bagkgsto',
  'internet-oddities',
  'websites-that-spark-joy',
  'digital-gardens',
  'generative-art-cxhzj3bmfyo',
  'tools-for-thinking',
  'indie-web',
  'small-web',
  'personal-websites',
  'data-visualization-bqfpqjaoxhc',
];

/**
 * Search terms for finding channels with link content.
 */
const SEARCH_TERMS = [
  'indie websites',
  'creative tools',
  'web experiments',
  'obscure internet',
  'digital art tools',
  'interactive visualizations',
];

interface ArenaBlock {
  id: number;
  title: string;
  description: string | null;
  source?: {
    url: string;
    title?: string;
  };
  class: string; // 'Link', 'Image', 'Text', etc.
  content?: string;
}

async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();

  const { data } = await adminClient
    .from('sites')
    .select('url')
    .in('url', urls);

  return new Set((data ?? []).map((row) => row.url));
}

async function fetchChannel(channelSlug: string): Promise<RawSite[]> {
  const url = `https://api.are.na/v2/channels/${channelSlug}/contents?per=50`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Unearth/1.0',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn(`Are.na fetch failed for channel ${channelSlug}: ${res.status}`);
    return [];
  }

  const json = await res.json();
  const blocks: ArenaBlock[] = json?.contents ?? [];
  const now = new Date().toISOString();
  const sites: RawSite[] = [];

  for (const block of blocks) {
    // Only process Link blocks with source URLs
    if (block.class !== 'Link' || !block.source?.url) continue;

    const blockUrl = block.source.url;
    if (!blockUrl.startsWith('http')) continue;
    if (isBlockedDomain(blockUrl)) continue;

    sites.push({
      url: blockUrl,
      title: block.source.title ?? block.title ?? 'Untitled',
      description: block.description
        ? block.description.slice(0, 500)
        : undefined,
      source: 'arena',
      sourceUrl: `https://www.are.na/block/${block.id}`,
      fetchedAt: now,
    });
  }

  return sites;
}

async function searchArena(term: string): Promise<RawSite[]> {
  const url = `https://api.are.na/v2/search?q=${encodeURIComponent(term)}&per=20`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Unearth/1.0',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return [];

  const json = await res.json();
  const blocks: ArenaBlock[] = json?.blocks ?? [];
  const now = new Date().toISOString();
  const sites: RawSite[] = [];

  for (const block of blocks) {
    if (block.class !== 'Link' || !block.source?.url) continue;

    const blockUrl = block.source.url;
    if (!blockUrl.startsWith('http')) continue;
    if (isBlockedDomain(blockUrl)) continue;

    sites.push({
      url: blockUrl,
      title: block.source.title ?? block.title ?? 'Untitled',
      description: block.description?.slice(0, 500) ?? undefined,
      source: 'arena',
      sourceUrl: `https://www.are.na/block/${block.id}`,
      fetchedAt: now,
    });
  }

  return sites;
}

/**
 * Fetch links from curated Are.na channels and search results.
 */
export async function fetchArena(): Promise<RawSite[]> {
  const allSites: RawSite[] = [];
  const seenUrls = new Set<string>();

  // Fetch from curated channels
  const channelResults = await Promise.allSettled(
    ARENA_CHANNELS.map((ch) => fetchChannel(ch))
  );

  for (const result of channelResults) {
    if (result.status !== 'fulfilled') continue;
    for (const site of result.value) {
      if (!seenUrls.has(site.url)) {
        seenUrls.add(site.url);
        allSites.push(site);
      }
    }
  }

  // Search for additional content
  const searchResults = await Promise.allSettled(
    SEARCH_TERMS.map((term) => searchArena(term))
  );

  for (const result of searchResults) {
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

export { ARENA_CHANNELS, SEARCH_TERMS };
