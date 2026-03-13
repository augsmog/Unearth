"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export async function generatePack() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const isAnonymous = user.is_anonymous === true;

  // Get user's interests and pack history count
  let interests: string[] = [];
  let packsOpened = 0;
  if (!isAnonymous) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests, total_packs_opened")
      .eq("id", user.id)
      .single();
    interests = profile?.interests ?? [];
    packsOpened = profile?.total_packs_opened ?? 0;
  }

  // Get sites the user has already seen
  const { data: seenPacks } = await supabase
    .from("packs")
    .select("site_ids")
    .eq("user_id", user.id);

  const seenSiteIds = seenPacks?.flatMap((p) => p.site_ids) ?? [];

  // Also exclude sites the user has already viewed (boards, rabbit holes, etc.)
  try {
    const { data: viewedPages } = await adminClient
      .from('user_page_views')
      .select('site_id')
      .eq('user_id', user.id);
    for (const v of viewedPages ?? []) {
      if (!seenSiteIds.includes(v.site_id)) seenSiteIds.push(v.site_id);
    }
  } catch { /* table may not exist yet */ }

  // Fetch user's format preferences for weighted sampling
  let formatMap = new Map<string, Record<string, number>>();
  try {
    const { data: formatPrefs } = await adminClient
      .from('user_format_preferences')
      .select('interest_slug, format_scores')
      .eq('user_id', user.id);
    formatMap = new Map(
      (formatPrefs ?? []).map((fp: { interest_slug: string; format_scores: Record<string, number> }) => [fp.interest_slug, fp.format_scores])
    );
  } catch { /* table may not exist yet */ }

  // Query approved pages that have screenshots
  // Prefer embeddable pages (iframe_compatible = true or untested)
  let query = adminClient
    .from("sites")
    .select("*")
    .eq("status", "approved")
    .not("thumbnail_url", "is", null)
    .order("quality_score", { ascending: false })
    .limit(80);

  // Exclude already seen pages
  if (seenSiteIds.length > 0) {
    query = query.not("id", "in", `(${seenSiteIds.join(",")})`);
  }

  const { data: candidates } = await query;

  if (!candidates || candidates.length < 5) {
    // Not enough unseen pages — allow repeats
    const { data: fallback } = await adminClient
      .from("sites")
      .select("*")
      .eq("status", "approved")
      .not("thumbnail_url", "is", null)
      .order("quality_score", { ascending: false })
      .limit(80);

    const pool = fallback ?? [];
    const selected = diverseWeightedSample(pool, 5, interests, formatMap, packsOpened);

    const { data: pack } = await adminClient
      .from("packs")
      .insert({
        user_id: user.id,
        site_ids: selected.map((s) => s.id),
      })
      .select()
      .single();

    incrementImpressions(selected.map((s) => s.id));
    return { pack, sites: selected, limitReached: false };
  }

  const selected = diverseWeightedSample(candidates, 5, interests, formatMap, packsOpened);

  const { data: pack } = await adminClient
    .from("packs")
    .insert({
      user_id: user.id,
      site_ids: selected.map((s) => s.id),
    })
    .select()
    .single();

  incrementImpressions(selected.map((s) => s.id));
  return { pack, sites: selected, limitReached: false };
}

export async function keepCards(
  packId: string,
  keptSiteIds: string[],
  boardId?: string
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const isAnonymous = user.is_anonymous === true;

  // Update pack with kept site IDs
  await adminClient
    .from("packs")
    .update({ kept_site_ids: keptSiteIds })
    .eq("id", packId);

  // Increment site-level keep_count for kept sites
  for (const siteId of keptSiteIds) {
    try {
      const { data: site } = await adminClient
        .from('sites')
        .select('keep_count')
        .eq('id', siteId)
        .single();
      if (site) {
        await adminClient
          .from('sites')
          .update({ keep_count: (site.keep_count ?? 0) + 1 })
          .eq('id', siteId);
      }
    } catch { /* column may not exist yet */ }
  }

  // Anonymous users: skip board saving, streaks, and stats
  if (!isAnonymous) {
    // Get the user's Favorites board if no board specified
    let targetBoardId = boardId;
    if (!targetBoardId) {
      const { data: favBoard } = await supabase
        .from("boards")
        .select("id")
        .eq("user_id", user.id)
        .eq("slug", "favorites")
        .single();
      targetBoardId = favBoard?.id;
    }

    // Add kept sites to board
    if (targetBoardId) {
      const boardItems = keptSiteIds.map((siteId, index) => ({
        board_id: targetBoardId,
        site_id: siteId,
        position: index,
      }));

      await adminClient.from("board_items").upsert(boardItems, {
        onConflict: "board_id,site_id",
      });
    }

    // Update streak
    const today = new Date().toISOString().split("T")[0];
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_last_date, streak_count")
      .eq("id", user.id)
      .single();

    if (profile) {
      const lastDate = profile.streak_last_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = 1;
      if (lastDate === yesterdayStr) {
        newStreak = (profile.streak_count ?? 0) + 1;
      } else if (lastDate === today) {
        newStreak = profile.streak_count ?? 1;
      }

      await supabase
        .from("profiles")
        .update({
          streak_count: newStreak,
          streak_last_date: today,
          total_packs_opened: (profile as Record<string, number>).total_packs_opened
            ? (profile as Record<string, number>).total_packs_opened + 1
            : 1,
          total_sites_kept: (profile as Record<string, number>).total_sites_kept
            ? (profile as Record<string, number>).total_sites_kept + keptSiteIds.length
            : keptSiteIds.length,
        })
        .eq("id", user.id);
    }
  }

  // Update format affinity for kept and passed sites (works for all users)
  try {
    const { updateFormatAffinity } = await import('@/lib/rabbitHole/formatAffinity');
    const allSiteIds = (await adminClient.from('packs').select('site_ids').eq('id', packId).single()).data?.site_ids ?? [];
    for (const siteId of allSiteIds) {
      const action = keptSiteIds.includes(siteId) ? 'keep' : 'pass';
      await updateFormatAffinity(user.id, siteId, action as 'keep' | 'pass');
    }
  } catch (err) {
    console.error('Format affinity update failed:', err);
  }

  return { success: true };
}

// ── Rabbit Hole Actions ─────────────────────────────────────────────

export async function fetchEntryPoints() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { generateEntryPoints } = await import('@/lib/rabbitHole/engine');
  return generateEntryPoints(user.id);
}

export async function startRabbitHoleAction(entrySiteId: string, category?: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { startRabbitHole } = await import('@/lib/rabbitHole/engine');
  const result = await startRabbitHole(user.id, entrySiteId, category);

  // Get the entry site for currentSite
  const { data: entrySite } = await adminClient
    .from('sites')
    .select('*')
    .eq('id', entrySiteId)
    .single();

  return {
    rabbitHoleId: result.rabbitHole.id,
    theme: result.firstChain.themeLabel,
    currentSite: entrySite,
    nextSite: result.firstChain.nextSite,
    branches: result.firstChain.branches,
  };
}

export async function advanceRabbitHoleAction(rabbitHoleId: string, currentSiteId: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { getNextInChain } = await import('@/lib/rabbitHole/engine');
  const result = await getNextInChain(rabbitHoleId, currentSiteId, user.id);

  return {
    nextSite: result.nextSite,
    branches: result.branches,
    depth: result.depth,
    suggestReset: result.suggestReset ?? false,
  };
}

export async function branchRabbitHoleAction(rabbitHoleId: string, fromSiteId: string, toSiteId: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { recordBranch, getNextInChain } = await import('@/lib/rabbitHole/engine');
  await recordBranch(rabbitHoleId, fromSiteId, toSiteId);
  const result = await getNextInChain(rabbitHoleId, toSiteId, user.id);

  return {
    nextSite: result.nextSite,
    branches: result.branches,
    depth: result.depth,
  };
}

export async function saveFromRabbitHole(siteId: string, boardId?: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Anonymous users can't save to boards
  if (user.is_anonymous) return { success: false };

  let targetBoardId = boardId;
  if (!targetBoardId) {
    const { data: favBoard } = await supabase
      .from('boards')
      .select('id')
      .eq('user_id', user.id)
      .eq('slug', 'favorites')
      .single();
    targetBoardId = favBoard?.id;
  }

  if (targetBoardId) {
    await adminClient.from('board_items').upsert(
      { board_id: targetBoardId, site_id: siteId, position: 0 },
      { onConflict: 'board_id,site_id' }
    );
  }

  // Increment site-level keep_count and rabbit_hole_save_count
  try {
    const { data: site } = await adminClient
      .from('sites')
      .select('keep_count, rabbit_hole_save_count')
      .eq('id', siteId)
      .single();
    if (site) {
      await adminClient
        .from('sites')
        .update({
          keep_count: (site.keep_count ?? 0) + 1,
          rabbit_hole_save_count: (site.rabbit_hole_save_count ?? 0) + 1,
        })
        .eq('id', siteId);
    }
  } catch { /* columns may not exist yet */ }

  // Update user stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_sites_kept')
    .eq('id', user.id)
    .single();
  await supabase
    .from('profiles')
    .update({ total_sites_kept: (profile?.total_sites_kept ?? 0) + 1 })
    .eq('id', user.id);

  return { success: true };
}

export async function endRabbitHoleAction(rabbitHoleId: string) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { endRabbitHole } = await import('@/lib/rabbitHole/engine');
  await endRabbitHole(rabbitHoleId);
}

// ── Engagement Tracking ────────────────────────────────────────────

export async function trackSiteEngagement(data: {
  siteId: string;
  timeSpentMs: number;
  iframeLoaded: boolean;
  usedProxy: boolean;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Log page view for reuse tracking
  try {
    await adminClient.from('user_page_views').upsert(
      {
        user_id: user.id,
        site_id: data.siteId,
        time_spent_ms: data.timeSpentMs,
        iframe_loaded: data.iframeLoaded,
        source: 'pack',
      },
      { onConflict: 'user_id,site_id' }
    );
  } catch {
    // Table may not exist yet if migration hasn't been run
  }

  // Update site-level aggregate engagement (running average)
  try {
    const { data: site } = await adminClient
      .from('sites')
      .select('engagement_view_count, engagement_avg_time_ms')
      .eq('id', data.siteId)
      .single();

    if (site) {
      const n = site.engagement_view_count ?? 0;
      const oldAvg = site.engagement_avg_time_ms ?? 0;
      const newAvg = (oldAvg * n + data.timeSpentMs) / (n + 1);

      await adminClient
        .from('sites')
        .update({
          engagement_view_count: n + 1,
          engagement_avg_time_ms: Math.round(newAvg),
        })
        .eq('id', data.siteId);
    }
  } catch { /* columns may not exist yet */ }

  // Update format affinity based on engagement signals
  try {
    const { updateFormatAffinity } = await import('@/lib/rabbitHole/formatAffinity');

    // >10s = strong positive signal (they actually engaged)
    // <3s = bounce (pass)
    if (data.timeSpentMs > 10_000) {
      await updateFormatAffinity(user.id, data.siteId, 'follow');
    } else if (data.timeSpentMs < 3_000 && data.iframeLoaded) {
      await updateFormatAffinity(user.id, data.siteId, 'pass');
    }
  } catch (err) {
    console.error('Engagement tracking failed:', err);
  }
}

/**
 * Domain-diverse weighted sampling.
 * - Max 2 pages per domain in a single pack (prevents "we only have 3 sites" feel)
 * - Embeddable pages get a boost (they keep users on-platform)
 * - Interest overlap still drives selection
 * - Serendipity factor ensures variety
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function diverseWeightedSample(
  candidates: any[],
  count: number,
  interests: string[],
  formatMap: Map<string, Record<string, number>> = new Map(),
  packsOpened: number = 0
) {
  if (candidates.length <= count) return candidates;

  const MAX_PER_DOMAIN = 2;
  const isNewUser = packsOpened < 3;

  // Score each candidate
  const scored = candidates.map((site) => {
    const categories = site.categories ?? [];
    const overlap = categories.filter((c: string) => interests.includes(c)).length;

    // Effective score: blend AI quality with real user keep rate
    const impressions = site.impression_count ?? 0;
    const keeps = site.keep_count ?? 0;
    const keepRate = impressions >= 5 ? keeps / impressions : 0.5; // neutral until enough data
    // AI score normalized to 0-1, then boosted by keep rate
    const effectiveScore = (site.quality_score / 100) * (1 + (keepRate - 0.5) * 1.0);
    let weight = effectiveScore * 5 + overlap * 3 + Math.random() * 2;

    if (isNewUser) {
      // ── First-time experience: serve the greatest hits ──
      // Strongly penalize pages that require clicks to engage (homepages, hubs)
      const coldOpen = site.cold_open_score ?? 50;
      if (coldOpen < 30) weight *= 0.1; // near-zero for navigation hubs
      else if (coldOpen >= 70) weight += 1.5; // bonus for instant engagement

      // Heavy bonus for proven content — these sites need to hook the user
      if (keeps >= 3) weight += 3.0;          // Multiple users kept this
      if (keeps >= 10) weight += 2.0;         // Many users kept this — top tier
      if (keepRate > 0.5 && impressions >= 5) weight += 2.0; // >50% keep rate with real data
      // Bonus for high engagement time (people actually spend time here)
      const avgTime = site.engagement_avg_time_ms ?? 0;
      if (avgTime > 20_000 && (site.engagement_view_count ?? 0) >= 3) weight += 2.0;
      // Strong preference for embeddable (new users must stay on-platform)
      if (site.iframe_compatible === true) weight += 3.0;
      if (site.iframe_compatible === false) weight *= 0.3; // much harsher for new users
      // Prefer instant/visual formats for cold opens
      if (site.engagement_format === 'instant' || site.engagement_format === 'visual') {
        weight += 1.5;
      }
    } else {
      // ── Returning user: balanced exploration + exploitation ──
      // Boost embeddable pages — they keep users inside Unearth
      if (site.iframe_compatible === true) weight += 2;
      if (site.iframe_compatible === false) weight *= 0.6;

      // Format affinity: boost formats the user engages with
      if (site.engagement_format && formatMap.size > 0) {
        for (const cat of categories) {
          const prefs = formatMap.get(cat);
          if (prefs && prefs[site.engagement_format] !== undefined) {
            weight += (prefs[site.engagement_format] - 0.5) * 3;
            break;
          }
        }
      }

      // Aggregate engagement: boost proven content, penalize bounces
      if (site.engagement_view_count >= 3) {
        const avgTime = site.engagement_avg_time_ms ?? 0;
        if (avgTime > 15_000) weight += 1.5;
        else if (avgTime < 3_000) weight *= 0.7;
      }

      // Rabbit hole saves are the strongest quality signal
      if ((site.rabbit_hole_save_count ?? 0) >= 2) weight += 1.0;
    }

    return { site, weight, impressions };
  });

  // Sort by weight descending
  scored.sort((a, b) => b.weight - a.weight);

  // Select greedily, enforcing domain diversity
  const selected: typeof scored = [];
  const domainCounts = new Map<string, number>();

  // Exploration slot: only for returning users (new users get proven content only)
  let explorationSlotFilled = false;
  if (!isNewUser && count >= 3) {
    const explorationCandidate = scored.find(
      (entry) => entry.impressions < 3
    );
    if (explorationCandidate) {
      const domain = explorationCandidate.site.domain ?? 'unknown';
      selected.push(explorationCandidate);
      domainCounts.set(domain, 1);
      explorationSlotFilled = true;
    }
  }

  for (const entry of scored) {
    if (selected.length >= count) break;
    if (explorationSlotFilled && selected.some((s) => s.site.id === entry.site.id)) continue;

    const domain = entry.site.domain ?? 'unknown';
    const current = domainCounts.get(domain) ?? 0;

    if (current >= MAX_PER_DOMAIN) continue; // skip — too many from this domain

    selected.push(entry);
    domainCounts.set(domain, current + 1);
  }

  return selected.map((s) => s.site);
}

/**
 * Fire-and-forget: increment impression_count for sites shown in a pack.
 */
async function incrementImpressions(siteIds: string[]) {
  for (const id of siteIds) {
    try {
      const { data } = await adminClient
        .from('sites')
        .select('impression_count')
        .eq('id', id)
        .single();
      if (data) {
        await adminClient
          .from('sites')
          .update({ impression_count: (data.impression_count ?? 0) + 1 })
          .eq('id', id);
      }
    } catch { /* column may not exist yet */ }
  }
}
