import { adminClient } from '@/lib/supabase/admin';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';
import type { RawSite } from '@/types';

/**
 * Curated subreddits that surface indie, obscure, niche content.
 * Organized by discovery type.
 */
const SUBREDDITS: Record<string, string[]> = {
  // Cross-category discovery (best sources)
  discovery: [
    'InternetIsBeautiful',
    'ObscureMedia',
    'CoolWebsites',
    'WebsitesOfTheDay',
  ],
  // Science & Nature
  science: [
    'ObscureScience',
    'CuriousVideos',
  ],
  // Creative & Design
  creative: [
    'generative',
    'CreativeCoding',
    'WoahDude',
  ],
  // Tech & Development
  tech: [
    'SideProject',
    'selfhosted',
  ],
  // Gaming
  gaming: [
    'IndieGaming',
    'WebGames',
  ],
  // Music & Audio
  music: [
    'ListenToThis',
    'MusicForConcentration',
  ],
  // Food & Cooking
  food: [
    'Old_Recipes',
    'fermentation',
    'foraging',
  ],
  // Nature & Outdoors
  nature: [
    'MarineBiology',
    'mycology',
  ],
  // Sports & Fitness
  sports: [
    'obscuresports',
  ],
  // Automotive
  automotive: [
    'WeirdWheels',
  ],
  // Parenting & Family
  parenting: [
    'ScienceBasedParenting',
  ],
  // Pets & Animals
  pets: [
    'Ethology',
  ],
};

const ALL_SUBREDDITS = Object.values(SUBREDDITS).flat();
const MIN_SCORE = 10;
const RATE_LIMIT_MS = 1100; // Just over 1 second per Reddit guidelines

async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();

  const { data } = await adminClient
    .from('sites')
    .select('url')
    .in('url', urls);

  return new Set((data ?? []).map((row) => row.url));
}

async function fetchSubreddit(subreddit: string): Promise<RawSite[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Unearth/1.0 (content discovery platform)',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn(`Reddit fetch failed for r/${subreddit}: ${res.status}`);
    return [];
  }

  const json = await res.json();
  const posts = json?.data?.children ?? [];
  const now = new Date().toISOString();

  const sites: RawSite[] = [];

  for (const post of posts) {
    const data = post?.data;
    if (!data) continue;

    // Skip self-posts (no external URL)
    if (data.is_self) continue;
    // Skip low-score posts
    if ((data.score ?? 0) < MIN_SCORE) continue;
    // Skip reddit/imgur/image links
    const postUrl: string = data.url ?? '';
    if (!postUrl || !postUrl.startsWith('http')) continue;
    if (postUrl.includes('reddit.com')) continue;
    if (postUrl.includes('imgur.com')) continue;
    if (postUrl.includes('i.redd.it')) continue;
    if (postUrl.includes('v.redd.it')) continue;
    // Skip blocked mainstream domains
    if (isBlockedDomain(postUrl)) continue;

    sites.push({
      url: postUrl,
      title: data.title ?? 'Untitled',
      description: data.selftext
        ? data.selftext.slice(0, 500)
        : undefined,
      source: 'reddit',
      sourceUrl: `https://reddit.com${data.permalink}`,
      fetchedAt: now,
    });
  }

  return sites;
}

/**
 * Fetch external links from curated niche subreddits.
 * Rate-limited to 1 request/second per Reddit guidelines.
 */
export async function fetchReddit(
  subreddits: string[] = ALL_SUBREDDITS
): Promise<RawSite[]> {
  const allSites: RawSite[] = [];
  const seenUrls = new Set<string>();

  for (const sub of subreddits) {
    try {
      const sites = await fetchSubreddit(sub);
      for (const site of sites) {
        if (!seenUrls.has(site.url)) {
          seenUrls.add(site.url);
          allSites.push(site);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch r/${sub}:`, err);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  // Deduplicate against DB
  const candidateUrls = allSites.map((s) => s.url);
  const existingUrls = await getExistingUrls(candidateUrls);

  return allSites.filter((s) => !existingUrls.has(s.url));
}

export { SUBREDDITS, ALL_SUBREDDITS };
