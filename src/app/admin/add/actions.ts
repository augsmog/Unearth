'use server';

import { adminClient } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';
import { scoreSite } from '@/lib/pipeline/scorer';
import { processScoredSite } from '@/lib/pipeline/router';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function assertAdmin(): Promise<void> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const email = user.email?.toLowerCase() ?? '';
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
    throw new Error('Not authorized');
  }
}

export interface QuickAddResult {
  success: boolean;
  error?: string;
  siteId?: string;
  title?: string;
  score?: number;
  decision?: string;
  blocked?: boolean;
  duplicate?: boolean;
}

/**
 * Quick-add a URL through the full pipeline: insert → score → route → tag.
 */
export async function quickAddSite(url: string): Promise<QuickAddResult> {
  try {
    await assertAdmin();

    // Validate URL
    try {
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL' };
    }

    // Check blocklist
    if (isBlockedDomain(url)) {
      return { success: false, blocked: true, error: 'Domain is on mainstream blocklist' };
    }

    // Check for duplicates
    const { data: existing } = await adminClient
      .from('sites')
      .select('id, title, status')
      .eq('url', url)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        duplicate: true,
        siteId: existing.id,
        title: existing.title,
        error: `Already exists (${existing.status})`,
      };
    }

    // Fetch page title
    let title = 'Untitled';
    let textContent = '';

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(15_000),
        redirect: 'follow',
      });

      if (res.ok) {
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].trim().slice(0, 200);
        }
        textContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch {
      // Continue with defaults
    }

    // Insert the site
    const { data: newSite, error: insertError } = await adminClient
      .from('sites')
      .insert({
        url,
        title,
        status: 'scoring',
        source: 'manual',
        categories: [],
        tags: [],
        quality_score: 0,
        ai_content_likelihood: 'low',
        content_type: 'other',
      })
      .select('id')
      .single();

    if (insertError || !newSite) {
      return { success: false, error: insertError?.message ?? 'Insert failed' };
    }

    // Score through the full pipeline
    const scoringResult = await scoreSite(url, textContent, title);
    const { decision } = await processScoredSite(newSite.id, scoringResult);

    return {
      success: true,
      siteId: newSite.id,
      title,
      score: scoringResult.overall_score,
      decision,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Batch-add multiple URLs. Returns results for each.
 */
export async function batchAddSites(
  urls: string[]
): Promise<QuickAddResult[]> {
  await assertAdmin();

  const results: QuickAddResult[] = [];

  for (const url of urls) {
    const trimmed = url.trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      results.push({ success: false, error: 'Invalid URL' });
      continue;
    }
    const result = await quickAddSite(trimmed);
    results.push(result);
  }

  return results;
}
