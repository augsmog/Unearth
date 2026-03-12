import { adminClient } from '@/lib/supabase/admin';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';
import type { RawSite } from '@/types';

interface LobstersStory {
  short_id: string;
  title: string;
  url: string;
  description: string;
  comment_count: number;
  score: number;
  tags: string[];
  submitter_user: { username: string };
}

async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();

  const { data } = await adminClient
    .from('sites')
    .select('url')
    .in('url', urls);

  return new Set((data ?? []).map((row) => row.url));
}

/**
 * Fetch stories from Lobste.rs — an invite-only link aggregator
 * with higher signal-to-noise than HN.
 */
export async function fetchLobsters(): Promise<RawSite[]> {
  const [hotRes, newestRes] = await Promise.allSettled([
    fetch('https://lobste.rs/hottest.json', {
      headers: { 'User-Agent': 'Unearth/1.0' },
      signal: AbortSignal.timeout(10_000),
    }),
    fetch('https://lobste.rs/newest.json', {
      headers: { 'User-Agent': 'Unearth/1.0' },
      signal: AbortSignal.timeout(10_000),
    }),
  ]);

  const stories: LobstersStory[] = [];

  for (const result of [hotRes, newestRes]) {
    if (result.status === 'fulfilled' && result.value.ok) {
      const data: LobstersStory[] = await result.value.json();
      stories.push(...data);
    }
  }

  const now = new Date().toISOString();
  const seenUrls = new Set<string>();
  const sites: RawSite[] = [];

  for (const story of stories) {
    // Skip stories without external URLs (discussion-only posts)
    if (!story.url || story.url.startsWith('https://lobste.rs')) continue;
    // Skip blocked domains
    if (isBlockedDomain(story.url)) continue;
    // Deduplicate within batch
    if (seenUrls.has(story.url)) continue;
    seenUrls.add(story.url);

    sites.push({
      url: story.url,
      title: story.title,
      description: story.description || undefined,
      source: 'lobsters',
      sourceUrl: `https://lobste.rs/s/${story.short_id}`,
      fetchedAt: now,
    });
  }

  // Deduplicate against DB
  const candidateUrls = sites.map((s) => s.url);
  const existingUrls = await getExistingUrls(candidateUrls);

  return sites.filter((s) => !existingUrls.has(s.url));
}
