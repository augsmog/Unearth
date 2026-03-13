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

  // Get user's interests (anonymous users have none)
  let interests: string[] = [];
  if (!isAnonymous) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests")
      .eq("id", user.id)
      .single();
    interests = profile?.interests ?? [];
  }

  // Get sites the user has already seen
  const { data: seenPacks } = await supabase
    .from("packs")
    .select("site_ids")
    .eq("user_id", user.id);

  const seenSiteIds = seenPacks?.flatMap((p) => p.site_ids) ?? [];

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
    const selected = diverseWeightedSample(pool, 5, interests);

    const { data: pack } = await adminClient
      .from("packs")
      .insert({
        user_id: user.id,
        site_ids: selected.map((s) => s.id),
      })
      .select()
      .single();

    return { pack, sites: selected, limitReached: false };
  }

  const selected = diverseWeightedSample(candidates, 5, interests);

  const { data: pack } = await adminClient
    .from("packs")
    .insert({
      user_id: user.id,
      site_ids: selected.map((s) => s.id),
    })
    .select()
    .single();

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

    // Update user stats
    await adminClient.rpc("increment_user_stats", {
      p_user_id: user.id,
      p_sites_kept: keptSiteIds.length,
    });

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

  // Update stats
  await supabase
    .from('profiles')
    .update({ total_sites_kept: (await supabase.from('profiles').select('total_sites_kept').eq('id', user.id).single()).data?.total_sites_kept + 1 || 1 })
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
function diverseWeightedSample(candidates: any[], count: number, interests: string[]) {
  if (candidates.length <= count) return candidates;

  const MAX_PER_DOMAIN = 2;

  // Score each candidate
  const scored = candidates.map((site) => {
    const categories = site.categories ?? [];
    const overlap = categories.filter((c: string) => interests.includes(c)).length;

    let weight = 1 + overlap * 3 + Math.random() * 2;

    // Boost embeddable pages — they keep users inside Unearth
    if (site.iframe_compatible === true) {
      weight += 2;
    }
    // Slight penalty for confirmed non-embeddable pages
    if (site.iframe_compatible === false) {
      weight *= 0.6;
    }
    // Untested pages (null) get no modifier — will be tested on first view

    return { site, weight };
  });

  // Sort by weight descending
  scored.sort((a, b) => b.weight - a.weight);

  // Select greedily, enforcing domain diversity
  const selected: typeof scored = [];
  const domainCounts = new Map<string, number>();

  for (const entry of scored) {
    if (selected.length >= count) break;

    const domain = entry.site.domain ?? 'unknown';
    const current = domainCounts.get(domain) ?? 0;

    if (current >= MAX_PER_DOMAIN) continue; // skip — too many from this domain

    selected.push(entry);
    domainCounts.set(domain, current + 1);
  }

  return selected.map((s) => s.site);
}
