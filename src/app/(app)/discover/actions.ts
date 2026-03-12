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

  // Query approved sites that have screenshots, preferring those matching interests
  let query = adminClient
    .from("sites")
    .select("*")
    .eq("status", "approved")
    .not("thumbnail_url", "is", null)
    .order("quality_score", { ascending: false })
    .limit(50);

  // Exclude already seen sites
  if (seenSiteIds.length > 0) {
    query = query.not("id", "in", `(${seenSiteIds.join(",")})`);
  }

  const { data: candidates } = await query;

  if (!candidates || candidates.length < 5) {
    // Not enough unseen sites — allow repeats (still require screenshots)
    const { data: fallback } = await adminClient
      .from("sites")
      .select("*")
      .eq("status", "approved")
      .not("thumbnail_url", "is", null)
      .order("quality_score", { ascending: false })
      .limit(50);

    const pool = fallback ?? [];
    const selected = weightedRandomSample(pool, 5, interests);

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

  const selected = weightedRandomSample(candidates, 5, interests);

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

// Weighted random sampling — prefer sites matching user interests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function weightedRandomSample(candidates: any[], count: number, interests: string[]) {
  if (candidates.length <= count) return candidates;

  // Score each candidate based on interest overlap
  const scored = candidates.map((site) => {
    const categories = site.categories ?? [];
    const overlap = categories.filter((c: string) => interests.includes(c)).length;
    // Weight: base 1 + 3 per interest match + serendipity factor
    const weight = 1 + overlap * 3 + Math.random() * 2;
    return { site, weight };
  });

  // Sort by weight descending and take top N
  scored.sort((a, b) => b.weight - a.weight);
  return scored.slice(0, count).map((s) => s.site);
}
