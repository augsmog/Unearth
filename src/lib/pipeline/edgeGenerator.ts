import { adminClient } from '@/lib/supabase/admin';

export async function generateEdges(siteId: string): Promise<number> {
  // 1. Fetch the newly approved site
  const { data: site } = await adminClient
    .from('sites')
    .select('id, tags, adjacency_tags, categories, engagement_format')
    .eq('id', siteId)
    .single();

  if (!site) throw new Error(`Site ${siteId} not found`);

  // 2. Fetch all other approved sites
  const { data: otherSites } = await adminClient
    .from('sites')
    .select('id, tags, adjacency_tags, categories, engagement_format')
    .eq('status', 'approved')
    .neq('id', siteId);

  if (!otherSites || otherSites.length === 0) return 0;

  const edges: Array<{
    source_site_id: string;
    target_site_id: string;
    edge_type: string;
    weight: number;
  }> = [];

  for (const other of otherSites) {
    const siteTags = new Set(site.tags ?? []);
    const siteAdjTags = new Set(site.adjacency_tags ?? []);
    const otherTags = new Set(other.tags ?? []);
    const otherAdjTags = new Set(other.adjacency_tags ?? []);

    // Tag overlap: site.adjacency_tags ∩ other.tags + site.adjacency_tags ∩ other.adjacency_tags + site.tags ∩ other.adjacency_tags
    let tagOverlap = 0;
    for (const t of siteAdjTags) { if (otherTags.has(t)) tagOverlap++; }
    for (const t of siteAdjTags) { if (otherAdjTags.has(t)) tagOverlap++; }
    for (const t of siteTags) { if (otherAdjTags.has(t)) tagOverlap++; }

    // Category overlap
    const siteCategories = new Set(site.categories ?? []);
    const otherCategories = new Set(other.categories ?? []);
    let categoryOverlap = 0;
    for (const c of siteCategories) { if (otherCategories.has(c)) categoryOverlap++; }

    // Weight calculation
    let weight = Math.min(1.0, (tagOverlap * 0.15) + (categoryOverlap * 0.15));

    // Format diversity bonus
    if (site.engagement_format && other.engagement_format && site.engagement_format !== other.engagement_format) {
      weight = Math.min(1.0, weight + 0.1);
    }

    // Only create edges where weight >= 0.2
    if (weight < 0.2) continue;

    // Determine primary edge type
    const edgeType = tagOverlap > categoryOverlap ? 'topic' : 'vibe';

    // Bidirectional edges
    edges.push({ source_site_id: site.id, target_site_id: other.id, edge_type: edgeType, weight });
    edges.push({ source_site_id: other.id, target_site_id: site.id, edge_type: edgeType, weight });
  }

  // Batch insert edges (upsert to handle existing)
  if (edges.length > 0) {
    const { error } = await adminClient
      .from('site_edges')
      .upsert(edges, { onConflict: 'source_site_id,target_site_id,edge_type' });

    if (error) {
      console.error('Failed to insert edges:', error);
      throw error;
    }
  }

  return edges.length / 2; // Return unique edge count (bidirectional counted once)
}
