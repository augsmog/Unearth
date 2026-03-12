import type { RawSite } from '@/types';

const GITHUB_TRENDING_URL = 'https://github.com/trending';

interface TrendingRepo {
  name: string;
  description: string;
  url: string;
  stars: string;
  language: string | null;
}

/**
 * Scrape the GitHub Trending page for daily trending repositories.
 * Returns repos as RawSite[] with source='github_trending'.
 */
export async function fetchGitHubTrending(): Promise<RawSite[]> {
  const res = await fetch(`${GITHUB_TRENDING_URL}?since=daily`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub Trending: ${res.status}`);
  }

  const html = await res.text();
  const repos = parseRepos(html);
  const now = new Date().toISOString();

  return repos.map((repo) => ({
    url: repo.url,
    title: repo.name,
    description: repo.description || undefined,
    source: 'github_trending' as const,
    sourceUrl: repo.url,
    fetchedAt: now,
  }));
}

function parseRepos(html: string): TrendingRepo[] {
  const repos: TrendingRepo[] = [];

  // Each trending repo lives inside an <article> element
  const articlePattern = /<article[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
  let articleMatch: RegExpExecArray | null;

  while ((articleMatch = articlePattern.exec(html)) !== null) {
    const block = articleMatch[1];

    // Extract repo path: /owner/repo
    const linkMatch = block.match(
      /<h2[^>]*>[\s\S]*?<a[^>]*href="(\/[^"]+)"[^>]*>/
    );
    if (!linkMatch) continue;

    const repoPath = linkMatch[1].trim();
    const repoName = repoPath
      .split('/')
      .filter(Boolean)
      .join('/');

    // Extract description
    const descMatch = block.match(
      /<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/
    );
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, '').trim()
      : '';

    // Extract language
    const langMatch = block.match(
      /<span[^>]*itemprop="programmingLanguage"[^>]*>([^<]+)<\/span>/
    );
    const language = langMatch ? langMatch[1].trim() : null;

    // Extract stars today
    const starsMatch = block.match(
      /(\d[\d,]*)\s+stars?\s+today/i
    );
    const stars = starsMatch ? starsMatch[1] : '0';

    repos.push({
      name: repoName,
      description,
      url: `https://github.com${repoPath}`,
      stars,
      language,
    });
  }

  return repos;
}
