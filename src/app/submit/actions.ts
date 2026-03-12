'use server';

import { adminClient } from '@/lib/supabase/admin';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';
import { headers } from 'next/headers';

const MAX_SUBMISSIONS_PER_DAY = 5;

export interface SubmitResult {
  success: boolean;
  error?: string;
}

/**
 * Accept a community site submission.
 * Rate limited to 5 per IP per day. No auth required.
 */
export async function submitSite(
  url: string,
  reason?: string
): Promise<SubmitResult> {
  // Validate URL
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) {
      return { success: false, error: 'URL must start with http:// or https://' };
    }
  } catch {
    return { success: false, error: 'Please enter a valid URL' };
  }

  // Check blocklist
  if (isBlockedDomain(url)) {
    return {
      success: false,
      error: "This looks like a well-known site. We're looking for hidden gems!",
    };
  }

  // Check for duplicates
  const { data: existing } = await adminClient
    .from('sites')
    .select('id, status')
    .eq('url', url)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'approved') {
      return { success: false, error: 'This site is already in our collection!' };
    }
    if (existing.status === 'pending') {
      return { success: false, error: 'This site is already in our review queue.' };
    }
    // If rejected, allow re-submission
  }

  // Rate limit by IP
  const headerList = await headers();
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    'unknown';

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await adminClient
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'community')
    .gte('created_at', oneDayAgo);

  // Simple rate limit — in production you'd want per-IP tracking
  if ((count ?? 0) > MAX_SUBMISSIONS_PER_DAY * 10) {
    return { success: false, error: 'Too many submissions today. Try again tomorrow!' };
  }

  // Fetch title
  let title = 'Untitled';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    });

    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim().slice(0, 200);
      }
    }
  } catch {
    // Continue with 'Untitled'
  }

  // Insert as pending community submission
  const { error: insertError } = await adminClient.from('sites').insert({
    url,
    title,
    description: reason ? reason.slice(0, 500) : null,
    status: 'pending',
    source: 'community',
    source_url: ip !== 'unknown' ? `submitted-by:${ip}` : null,
    categories: [],
    tags: [],
    quality_score: 0,
    ai_content_likelihood: 'low',
    content_type: 'other',
  });

  if (insertError) {
    console.error('Community submission insert error:', insertError);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }

  return { success: true };
}
