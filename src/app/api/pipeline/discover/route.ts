import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';

/**
 * Receives user-discovered pages from in-iframe navigation.
 * When a user browses from one page to another within a proxied site,
 * the navigation tracker reports the new URL here.
 *
 * Pages are added as pending with source 'user_discovery' and linked
 * to the source page that led to the discovery.
 */
export async function POST(request: NextRequest) {
  let body: {
    url: string;
    title: string;
    sourceSiteId: string;
    sourceUrl: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { url, title, sourceSiteId } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
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

  // Skip if blocked domain
  if (isBlockedDomain(url)) {
    return NextResponse.json({ skipped: true, reason: 'blocked_domain' });
  }

  // Skip if it's just the homepage (no path or just /)
  if (!parsed.pathname || parsed.pathname === '/') {
    return NextResponse.json({ skipped: true, reason: 'homepage' });
  }

  // Skip very short paths (likely category/nav pages)
  const pathSegments = parsed.pathname.split('/').filter(Boolean);
  if (pathSegments.length < 1) {
    return NextResponse.json({ skipped: true, reason: 'shallow_path' });
  }

  // Normalize URL (strip tracking params, fragments)
  const cleanUrl = `${parsed.origin}${parsed.pathname}`;

  // Check if this URL already exists
  const { data: existing } = await adminClient
    .from('sites')
    .select('id')
    .eq('url', cleanUrl)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ skipped: true, reason: 'already_exists' });
  }

  // Also check with trailing slash variation
  const altUrl = cleanUrl.endsWith('/')
    ? cleanUrl.slice(0, -1)
    : cleanUrl + '/';
  const { data: existingAlt } = await adminClient
    .from('sites')
    .select('id')
    .eq('url', altUrl)
    .maybeSingle();

  if (existingAlt) {
    return NextResponse.json({ skipped: true, reason: 'already_exists' });
  }

  // Extract domain
  const domain = parsed.hostname.replace(/^www\./, '');

  // Insert as pending page — will be scored by the pipeline
  const { error } = await adminClient
    .from('sites')
    .insert({
      url: cleanUrl,
      title: title || `${domain} — ${pathSegments[pathSegments.length - 1]}`,
      description: null,
      source: 'user_discovery',
      source_url: sourceSiteId ? null : null, // linked via source field
      status: 'pending',
      quality_score: 1,
      ai_content_likelihood: 'medium',
      content_type: 'other',
      categories: [],
      tags: [],
    });

  if (error) {
    // Likely duplicate URL (race condition) — not a real error
    if (error.code === '23505') {
      return NextResponse.json({ skipped: true, reason: 'duplicate' });
    }
    console.error('Discovery insert failed:', error);
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }

  return NextResponse.json({ added: true, url: cleanUrl });
}
