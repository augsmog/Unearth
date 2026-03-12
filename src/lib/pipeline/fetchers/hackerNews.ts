import { adminClient } from '@/lib/supabase/admin';
import type { RawSite } from '@/types';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';
const BATCH_SIZE = 30;

interface HNItem {
  id: number;
  title?: string;
  url?: string;
  text?: string;
  type?: string;
  score?: number;
  by?: string;
  time?: number;
  descendants?: number;
}

async function fetchItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetch(`${HN_API_BASE}/item/${id}.json`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();

  const { data } = await adminClient
    .from('sites')
    .select('url')
    .in('url', urls);

  return new Set((data ?? []).map((row) => row.url));
}

export async function fetchHackerNews(): Promise<RawSite[]> {
  // Fetch both top stories and Show HN
  const [topRes, showRes] = await Promise.all([
    fetch(`${HN_API_BASE}/topstories.json`, { next: { revalidate: 0 } }),
    fetch(`${HN_API_BASE}/showstories.json`, { next: { revalidate: 0 } }),
  ]);

  if (!topRes.ok || !showRes.ok) {
    throw new Error('Failed to fetch Hacker News story IDs');
  }

  const topIds: number[] = await topRes.json();
  const showIds: number[] = await showRes.json();

  // Combine and deduplicate IDs, take top N from each
  const combinedIds = [
    ...new Set([...topIds.slice(0, BATCH_SIZE), ...showIds.slice(0, BATCH_SIZE)]),
  ];

  // Fetch items in parallel with concurrency control
  const items: HNItem[] = [];
  for (let i = 0; i < combinedIds.length; i += 10) {
    const batch = combinedIds.slice(i, i + 10);
    const results = await Promise.all(batch.map(fetchItem));
    items.push(...results.filter((item): item is HNItem => item !== null));
  }

  // Filter to only stories with external URLs (not self-posts)
  const withUrls = items.filter(
    (item) => item.url && item.type === 'story'
  );

  // Deduplicate against DB
  const candidateUrls = withUrls.map((item) => item.url!);
  const existingUrls = await getExistingUrls(candidateUrls);

  const now = new Date().toISOString();

  return withUrls
    .filter((item) => !existingUrls.has(item.url!))
    .map((item) => ({
      url: item.url!,
      title: item.title ?? 'Untitled',
      description: item.text ?? undefined,
      source: 'hackernews' as const,
      sourceUrl: `https://news.ycombinator.com/item?id=${item.id}`,
      fetchedAt: now,
    }));
}
