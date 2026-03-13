import { adminClient } from '@/lib/supabase/admin';
import type { Site, RabbitHoleEntry, ChainResult } from '@/types';

// Theme label templates — generate from category + tags
const THEME_TEMPLATES: Record<string, string[]> = {
  'technology': ['Tech Deep Dive', 'Digital Frontiers', 'Code & Craft'],
  'design-creative': ['Design Wonderland', 'Creative Depths', 'Visual Journeys'],
  'science-nature': ['Weird Science', 'Nature Unraveled', 'Lab Notes'],
  'startups-business': ['Money Machines', 'Founder Files', 'Market Moves'],
  'arts-expression': ['Art Underground', 'Creative Frequencies', 'The Gallery'],
  'culture-ideas': ['Internet Archaeology', 'Big Ideas', 'Culture Dive'],
  'gaming-interactive': ['Play Mode', 'Game On', 'Interactive Worlds'],
  'lifestyle-wellness': ['Good Living', 'Wellness Trail', 'Life Hacks'],
  'finance-money': ['Money Moves', 'Market Watch', 'Wealth Paths'],
  'learning-knowledge': ['Knowledge Spiral', 'Learning Loops', 'Deep Study'],
};

function generateThemeLabel(category: string, tags: string[]): string {
  const templates = THEME_TEMPLATES[category];
  if (templates) {
    return templates[Math.floor(Math.random() * templates.length)];
  }
  // Fallback: use first tag
  if (tags.length > 0) {
    return `Deep Dive: ${tags[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
  }
  return 'Rabbit Hole';
}

/**
 * Generate 3-5 rabbit hole entry points for a user
 */
export async function generateEntryPoints(
  userId: string,
  count: number = 4
): Promise<RabbitHoleEntry[]> {
  // Get user interests
  const { data: profile } = await adminClient
    .from('profiles')
    .select('interests')
    .eq('id', userId)
    .single();

  const interests = profile?.interests ?? [];

  // Get sites the user has already seen
  const { data: seenPacks } = await adminClient
    .from('packs')
    .select('site_ids')
    .eq('user_id', userId);
  const seenSiteIds = new Set(seenPacks?.flatMap(p => p.site_ids) ?? []);

  // Also get sites from rabbit holes
  const { data: seenRabbits } = await adminClient
    .from('rabbit_holes')
    .select('site_sequence')
    .eq('user_id', userId);
  for (const rh of seenRabbits ?? []) {
    for (const id of rh.site_sequence ?? []) seenSiteIds.add(id);
  }

  // Query candidate entry sites (must have screenshots)
  const { data: candidates } = await adminClient
    .from('sites')
    .select('*')
    .eq('status', 'approved')
    .not('thumbnail_url', 'is', null)
    .gte('quality_score', 80)
    .gte('rabbit_hole_depth_potential', 3)
    .order('quality_score', { ascending: false })
    .limit(50);

  if (!candidates || candidates.length === 0) return [];

  // Filter out seen sites
  const unseen = candidates.filter(s => !seenSiteIds.has(s.id));
  const pool = unseen.length >= count ? unseen : candidates;

  // For each candidate, count reachable nodes via site_edges (simplified BFS)
  const entries: RabbitHoleEntry[] = [];
  const usedCategories = new Set<string>();

  for (const site of pool) {
    if (entries.length >= count) break;

    const primaryCategory = (site.categories ?? [])[0] ?? 'technology';

    // Diversity: skip if we already have an entry for this category
    if (usedCategories.has(primaryCategory) && entries.length > 0) continue;

    // Count reachable nodes (simplified: count edges from this site)
    const { count: edgeCount } = await adminClient
      .from('site_edges')
      .select('*', { count: 'exact', head: true })
      .eq('source_site_id', site.id)
      .gte('weight', 0.3);

    const depthAvailable = Math.min(edgeCount ?? 0, 20);

    // Only include if there's enough depth
    if (depthAvailable < 2 && entries.length > 0) continue;

    usedCategories.add(primaryCategory);
    entries.push({
      site: site as Site,
      themeLabel: generateThemeLabel(primaryCategory, site.adjacency_tags ?? []),
      depthAvailable,
      category: primaryCategory,
    });
  }

  return entries;
}

/**
 * Start a rabbit hole from a specific site
 */
export async function startRabbitHole(
  userId: string,
  entrySiteId: string,
  entryCategory?: string
): Promise<{ rabbitHole: { id: string }; firstChain: ChainResult }> {
  // Get the entry site
  const { data: entrySite } = await adminClient
    .from('sites')
    .select('*')
    .eq('id', entrySiteId)
    .single();

  if (!entrySite) throw new Error('Entry site not found');

  const category = entryCategory ?? (entrySite.categories ?? [])[0] ?? 'unknown';
  const themeLabel = generateThemeLabel(category, entrySite.adjacency_tags ?? []);

  // Create rabbit hole record
  const { data: rabbitHole } = await adminClient
    .from('rabbit_holes')
    .insert({
      user_id: userId,
      entry_site_id: entrySiteId,
      entry_category: category,
      site_sequence: [entrySiteId],
      max_depth: 1,
    })
    .select('id')
    .single();

  if (!rabbitHole) throw new Error('Failed to create rabbit hole');

  // Get the first chain result
  const chainResult = await getNextInChain(rabbitHole.id, entrySiteId, userId);

  return {
    rabbitHole: { id: rabbitHole.id },
    firstChain: { ...chainResult, themeLabel },
  };
}

/**
 * Get the next site in a rabbit hole chain
 */
export async function getNextInChain(
  rabbitHoleId: string,
  currentSiteId: string,
  userId: string
): Promise<ChainResult> {
  // Get the current rabbit hole state
  const { data: rh } = await adminClient
    .from('rabbit_holes')
    .select('*')
    .eq('id', rabbitHoleId)
    .single();

  if (!rh) throw new Error('Rabbit hole not found');

  const seenSiteIds = new Set<string>(rh.site_sequence ?? []);
  const depth = (rh.site_sequence ?? []).length;
  const category = rh.entry_category ?? 'technology';
  const themeLabel = generateThemeLabel(category, []);

  // Get user interests and format preferences
  const { data: profile } = await adminClient
    .from('profiles')
    .select('interests')
    .eq('id', userId)
    .single();
  const interests = new Set(profile?.interests ?? []);

  const { data: formatPrefs } = await adminClient
    .from('user_format_preferences')
    .select('*')
    .eq('user_id', userId);
  const formatMap = new Map(
    (formatPrefs ?? []).map(fp => [fp.interest_slug, fp.format_scores as Record<string, number>])
  );

  // Determine edge weight threshold based on depth
  let minEdgeWeight = 0.6;
  if (depth >= 4 && depth < 7) minEdgeWeight = 0.4;
  else if (depth >= 7 && depth < 10) minEdgeWeight = 0.2;
  else if (depth >= 10) minEdgeWeight = 0.2;

  // 1. Get candidates from site_edges
  const { data: edges } = await adminClient
    .from('site_edges')
    .select('target_site_id, weight, edge_type')
    .eq('source_site_id', currentSiteId)
    .gte('weight', minEdgeWeight)
    .order('weight', { ascending: false })
    .limit(20);

  const candidateIds = (edges ?? [])
    .map(e => e.target_site_id)
    .filter(id => !seenSiteIds.has(id));

  // 2. Fetch candidate sites
  let candidates: Site[] = [];
  if (candidateIds.length > 0) {
    const { data } = await adminClient
      .from('sites')
      .select('*')
      .in('id', candidateIds)
      .gte('quality_score', 70)
      .eq('status', 'approved')
      .not('thumbnail_url', 'is', null);
    candidates = (data ?? []) as Site[];
  }

  // 3. Fallback: adjacency tag search if not enough candidates
  if (candidates.length < 3) {
    const { data: currentSite } = await adminClient
      .from('sites')
      .select('adjacency_tags')
      .eq('id', currentSiteId)
      .single();

    if (currentSite?.adjacency_tags?.length) {
      const { data: fallbackSites } = await adminClient
        .from('sites')
        .select('*')
        .eq('status', 'approved')
        .not('thumbnail_url', 'is', null)
        .gte('quality_score', 70)
        .overlaps('tags', currentSite.adjacency_tags)
        .not('id', 'in', `(${[...seenSiteIds].join(',')})`)
        .limit(10);

      const existingIds = new Set(candidates.map(c => c.id));
      for (const s of (fallbackSites ?? []) as Site[]) {
        if (!existingIds.has(s.id)) candidates.push(s);
      }
    }
  }

  if (candidates.length === 0) {
    // Ultimate fallback: random approved sites (still require screenshots)
    const { data: randomSites } = await adminClient
      .from('sites')
      .select('*')
      .eq('status', 'approved')
      .not('thumbnail_url', 'is', null)
      .gte('quality_score', 70)
      .not('id', 'in', `(${[...seenSiteIds].join(',')})`)
      .limit(5);
    candidates = (randomSites ?? []) as Site[];
  }

  // Edge weight lookup
  const edgeWeightMap = new Map(
    (edges ?? []).map(e => [e.target_site_id, e.weight])
  );

  // Categories seen in this rabbit hole
  const seenCategories = new Set<string>();
  // We don't track category per site in the sequence, so approximate from current known candidates

  // 4. Score candidates
  const scored = candidates.map(candidate => {
    const edgeWeight = edgeWeightMap.get(candidate.id) ?? 0.2;

    // Interest match
    const candidateCategories = candidate.categories ?? [];
    const interestMatch = candidateCategories.some(c => interests.has(c)) ? 1.0 : 0.3;

    // Format affinity
    let formatAffinity = 0.5; // neutral default
    if (candidate.engagement_format) {
      for (const cat of candidateCategories) {
        const prefs = formatMap.get(cat);
        if (prefs && prefs[candidate.engagement_format] !== undefined) {
          formatAffinity = prefs[candidate.engagement_format];
          break;
        }
      }
    }

    // Novelty bonus (higher if category not seen in this rabbit hole)
    const noveltyBonus = candidateCategories.some(c => !seenCategories.has(c)) ? 1.0 : 0.3;

    // Depth-adjusted weights
    let noveltyWeight = 0.1;
    if (depth >= 7) noveltyWeight = 0.2;

    let chainScore =
      (0.4 * edgeWeight) +
      (0.3 * interestMatch) +
      ((0.3 - noveltyWeight) * formatAffinity) +
      (noveltyWeight * noveltyBonus);

    // Small boost for sites with proven aggregate engagement
    if (candidate.engagement_view_count >= 3 && (candidate.engagement_avg_time_ms ?? 0) > 15_000) {
      chainScore += 0.05;
    }

    return { site: candidate, chainScore, edgeWeight };
  });

  // Sort by chain score
  scored.sort((a, b) => b.chainScore - a.chainScore);

  if (scored.length === 0) {
    throw new Error('No candidates available for rabbit hole chain');
  }

  const nextSite = scored[0].site;

  // Branches: next 1-2 from DIFFERENT categories than the primary
  const nextCategories = new Set(nextSite.categories ?? []);
  const branches = scored
    .slice(1)
    .filter(s => !(s.site.categories ?? []).every(c => nextCategories.has(c)))
    .slice(0, 2)
    .map(s => s.site);

  // Update rabbit hole state
  const newSequence = [...(rh.site_sequence ?? []), nextSite.id];
  await adminClient
    .from('rabbit_holes')
    .update({
      site_sequence: newSequence,
      max_depth: Math.max(rh.max_depth ?? 0, newSequence.length),
    })
    .eq('id', rabbitHoleId);

  return {
    nextSite,
    branches,
    depth: newSequence.length,
    themeLabel,
    suggestReset: depth >= 10,
  };
}

/**
 * Record that the user followed a branch
 */
export async function recordBranch(
  rabbitHoleId: string,
  fromSiteId: string,
  toSiteId: string
): Promise<void> {
  const { data: rh } = await adminClient
    .from('rabbit_holes')
    .select('branch_points, site_sequence, max_depth')
    .eq('id', rabbitHoleId)
    .single();

  if (!rh) return;

  const branchPoints = [...(rh.branch_points as Array<Record<string, unknown>> ?? []), {
    depth: (rh.site_sequence ?? []).length,
    from_site_id: fromSiteId,
    to_site_id: toSiteId,
    branch_type: 'user_choice',
  }];

  const newSequence = [...(rh.site_sequence ?? []), toSiteId];

  await adminClient
    .from('rabbit_holes')
    .update({
      branch_points: branchPoints,
      site_sequence: newSequence,
      max_depth: Math.max(rh.max_depth ?? 0, newSequence.length),
    })
    .eq('id', rabbitHoleId);
}

/**
 * End a rabbit hole session
 */
export async function endRabbitHole(rabbitHoleId: string): Promise<void> {
  await adminClient
    .from('rabbit_holes')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', rabbitHoleId);
}
