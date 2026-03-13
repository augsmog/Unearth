import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { fetchHackerNews } from '@/lib/pipeline/fetchers/hackerNews';
import { fetchProductHunt } from '@/lib/pipeline/fetchers/productHunt';
import { fetchGitHubTrending } from '@/lib/pipeline/fetchers/githubTrending';
import { fetchRssFeeds } from '@/lib/pipeline/fetchers/rssFeed';
import { fetchReddit } from '@/lib/pipeline/fetchers/redditFetcher';
import { fetchLobsters } from '@/lib/pipeline/fetchers/lobstersFetcher';
import { fetchArena } from '@/lib/pipeline/fetchers/arenaFetcher';
import { fetchDirectories } from '@/lib/pipeline/fetchers/directoryFetcher';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';
import type { RawSite } from '@/types';

const VALID_SOURCES = [
  'hacker_news',
  'product_hunt',
  'github_trending',
  'rss_feed',
  'reddit',
  'lobsters',
  'arena',
  'directory',
] as const;

type SourceType = (typeof VALID_SOURCES)[number];

function validateApiKey(request: NextRequest): boolean {
  const key = request.headers.get('x-pipeline-api-key');
  return key === process.env.PIPELINE_API_KEY;
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { source: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { source } = body;

  if (!VALID_SOURCES.includes(source as SourceType)) {
    return NextResponse.json(
      { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    let rawSites: RawSite[];

    switch (source as SourceType) {
      case 'hacker_news':
        rawSites = await fetchHackerNews();
        break;
      case 'product_hunt':
        rawSites = await fetchProductHunt();
        break;
      case 'github_trending':
        rawSites = await fetchGitHubTrending();
        break;
      case 'rss_feed':
        rawSites = await fetchRssFeeds();
        break;
      case 'reddit':
        rawSites = await fetchReddit();
        break;
      case 'lobsters':
        rawSites = await fetchLobsters();
        break;
      case 'arena':
        rawSites = await fetchArena();
        break;
      case 'directory':
        rawSites = await fetchDirectories();
        break;
    }

    if (rawSites.length === 0) {
      return NextResponse.json({ added: 0, message: 'No new sites found' });
    }

    // Check for existing URLs to avoid duplicates
    const urls = rawSites.map((s) => s.url);
    const { data: existing } = await adminClient
      .from('sites')
      .select('url')
      .in('url', urls);

    const existingUrls = new Set((existing ?? []).map((r) => r.url));
    const newSites = rawSites
      .filter((s) => !existingUrls.has(s.url))
      .filter((s) => !isBlockedDomain(s.url));

    if (newSites.length === 0) {
      return NextResponse.json({ added: 0, message: 'All sites already exist' });
    }

    // Insert into sites table with status='pending'
    // Try with domain column; fall back without if migration hasn't run
    const rows = newSites.map((site) => ({
      url: site.url,
      title: site.title,
      description: site.description ?? null,
      source: site.source,
      source_url: site.sourceUrl ?? null,
      status: 'pending' as const,
      quality_score: 1, // minimum valid score (CHECK constraint: 1-100)
      ai_content_likelihood: 'medium' as const,
      content_type: 'other' as const,
      categories: [],
      tags: [],
    }));

    // Use upsert with ignoreDuplicates to handle race conditions
    // where the same URL was inserted between our dedup check and now
    const { error, count } = await adminClient
      .from('sites')
      .upsert(rows, { onConflict: 'url', ignoreDuplicates: true });

    if (error) {
      throw new Error(`DB insert failed: ${error.message}`);
    }

    return NextResponse.json({
      added: count ?? newSites.length,
      source,
      message: `Added ${newSites.length} new sites from ${source}`,
    });
  } catch (err) {
    console.error(`Pipeline fetch error (${source}):`, err);
    return NextResponse.json(
      {
        error: 'Fetch failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
