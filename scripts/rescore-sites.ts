/**
 * Re-scoring script for existing seed sites.
 *
 * Populates the new Phase 1.5 fields on all approved sites:
 * - cold_open_score, engagement_format, rabbit_hole_depth_potential (via scorer)
 * - adjacency_tags (via tagger)
 * - site_edges (via edge generator)
 *
 * Run with: npx tsx scripts/rescore-sites.ts
 * Requires .env.local to be loaded (dotenv).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic();

// ── Scorer prompt (matches src/lib/pipeline/scorer.ts) ──────────────

const SCORING_PROMPT = `You are an expert web content evaluator for Unearth, a platform that curates the best human-made websites and content on the internet.

Evaluate the provided website across these 3 NEW dimensions only. We already have overall quality scores. We need these additional assessments.

## Dimensions

1. **cold_open_quality**: How immediately engaging is this site for a first-time visitor who lands with zero context? Score 90+ for sites delivering value within 3 seconds (interactive toys, auto-playing visualizations, playable games). Score 70-89 for sites engaging within 10 seconds (clear visual hook, obvious interaction). Score 50-69 for sites needing 30+ seconds of orientation. Score 30-49 for sites requiring significant reading commitment. Score 1-29 for sites needing deep navigation, account creation, or prior context.

2. **engagement_format**: Classify as exactly one of: "instant" (value in <3s, toys/games/visualizations), "visual" (primarily image/video driven), "read-short" (<5 min reading), "read-long" (5+ min deep reads), "tool" (interactive utility), "explore" (multi-page discovery experience)

3. **rabbit_hole_depth_potential**: 1-5 scale. How many meaningful thematic connections could this site anchor? 5 = hub that connects to many diverse topics. 1 = niche single-purpose with few natural connections.

## Response Format

Respond with ONLY valid JSON:
{
  "cold_open_quality": <number 1-100>,
  "engagement_format": "<instant|visual|read-short|read-long|tool|explore>",
  "rabbit_hole_depth_potential": <1-5>
}`;

// ── Tagger adjacency prompt (matches src/lib/pipeline/tagger.ts) ────

const ADJACENCY_PROMPT = `You are a metadata tagger for Unearth, a curated web discovery platform.

Generate 5-15 adjacency tags for this site. Adjacency tags describe what this site is ADJACENT TO — not what it IS.

Answer: "If someone liked this site, what other TOPICS, VIBES, or AUDIENCE TYPES would they also be interested in?"

Example: A site about neural network visualizations:
- Regular tags: ['neural-networks', 'machine-learning', 'visualization']
- Adjacency tags: ['creative-coding', 'data-art', 'ai-research', 'computational-creativity', 'mathematics', 'generative-art', 'python-ecosystem']

Respond with ONLY valid JSON:
{
  "adjacencyTags": ["adjacent-topic-one", "adjacent-vibe-two", "adjacent-audience-three"]
}`;

// ── Edge generator (simplified inline version) ──────────────────────

async function generateAllEdges() {
  const { data: sites } = await supabase
    .from('sites')
    .select('id, tags, adjacency_tags, categories, engagement_format')
    .eq('status', 'approved');

  if (!sites || sites.length < 2) {
    console.log('Not enough sites for edge generation');
    return 0;
  }

  const edges: Array<{
    source_site_id: string;
    target_site_id: string;
    edge_type: string;
    weight: number;
  }> = [];

  for (let i = 0; i < sites.length; i++) {
    for (let j = i + 1; j < sites.length; j++) {
      const a = sites[i];
      const b = sites[j];

      const aTags = new Set(a.tags ?? []);
      const aAdj = new Set(a.adjacency_tags ?? []);
      const bTags = new Set(b.tags ?? []);
      const bAdj = new Set(b.adjacency_tags ?? []);

      let tagOverlap = 0;
      for (const t of aAdj) { if (bTags.has(t)) tagOverlap++; }
      for (const t of aAdj) { if (bAdj.has(t)) tagOverlap++; }
      for (const t of aTags) { if (bAdj.has(t)) tagOverlap++; }

      const aCats = new Set(a.categories ?? []);
      const bCats = new Set(b.categories ?? []);
      let categoryOverlap = 0;
      for (const c of aCats) { if (bCats.has(c)) categoryOverlap++; }

      let weight = Math.min(1.0, tagOverlap * 0.15 + categoryOverlap * 0.15);

      if (a.engagement_format && b.engagement_format && a.engagement_format !== b.engagement_format) {
        weight = Math.min(1.0, weight + 0.1);
      }

      if (weight < 0.2) continue;

      const edgeType = tagOverlap > categoryOverlap ? 'topic' : 'vibe';
      edges.push({ source_site_id: a.id, target_site_id: b.id, edge_type: edgeType, weight });
      edges.push({ source_site_id: b.id, target_site_id: a.id, edge_type: edgeType, weight });
    }
  }

  if (edges.length > 0) {
    // Insert in batches of 500
    for (let i = 0; i < edges.length; i += 500) {
      const batch = edges.slice(i, i + 500);
      const { error } = await supabase
        .from('site_edges')
        .upsert(batch, { onConflict: 'source_site_id,target_site_id,edge_type' });
      if (error) {
        console.error(`Edge batch insert failed:`, error.message);
      }
    }
  }

  return edges.length / 2;
}

// ── Main ────────────────────────────────────────────────────────────

type EngagementFormat = 'instant' | 'visual' | 'read-short' | 'read-long' | 'tool' | 'explore';
const VALID_FORMATS: EngagementFormat[] = ['instant', 'visual', 'read-short', 'read-long', 'tool', 'explore'];

async function main() {
  console.log('=== Unearth Re-scoring Script ===\n');

  // Fetch all approved sites
  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, url, title, description, tags, categories')
    .eq('status', 'approved')
    .order('created_at');

  if (error) {
    console.error('Failed to fetch sites:', error.message);
    process.exit(1);
  }

  if (!sites || sites.length === 0) {
    console.log('No approved sites found. Run 005_seed_websites.sql first.');
    process.exit(0);
  }

  console.log(`Found ${sites.length} approved sites to process.\n`);

  let scored = 0;
  let tagged = 0;
  let failed = 0;

  for (const site of sites) {
    console.log(`[${scored + tagged + failed + 1}/${sites.length}] ${site.title}`);

    // Step 1: Score for new dimensions
    try {
      const scoreResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `${SCORING_PROMPT}\n\n**URL:** ${site.url}\n**Title:** ${site.title}\n**Description:** ${(site.description ?? '').slice(0, 500)}`,
        }],
      });

      const scoreText = scoreResponse.content[0].type === 'text' ? scoreResponse.content[0].text : '';
      const scoreJson = JSON.parse(scoreText.match(/\{[\s\S]*\}/)![0]) as {
        cold_open_quality: number;
        engagement_format: string;
        rabbit_hole_depth_potential: number;
      };

      const format = VALID_FORMATS.includes(scoreJson.engagement_format as EngagementFormat)
        ? scoreJson.engagement_format
        : 'explore';

      await supabase
        .from('sites')
        .update({
          cold_open_score: Math.max(1, Math.min(100, scoreJson.cold_open_quality)),
          engagement_format: format,
          rabbit_hole_depth_potential: Math.max(1, Math.min(5, scoreJson.rabbit_hole_depth_potential)),
        })
        .eq('id', site.id);

      scored++;
      console.log(`  Scored: cold_open=${scoreJson.cold_open_quality}, format=${format}, depth=${scoreJson.rabbit_hole_depth_potential}`);
    } catch (err) {
      console.error(`  Scoring failed:`, (err as Error).message);
      failed++;
      continue;
    }

    // Step 2: Generate adjacency tags
    try {
      const tagResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `${ADJACENCY_PROMPT}\n\n**URL:** ${site.url}\n**Title:** ${site.title}\n**Description:** ${(site.description ?? '').slice(0, 500)}\n**Current Tags:** ${(site.tags ?? []).join(', ')}`,
        }],
      });

      const tagText = tagResponse.content[0].type === 'text' ? tagResponse.content[0].text : '';
      const tagJson = JSON.parse(tagText.match(/\{[\s\S]*\}/)![0]) as { adjacencyTags: string[] };

      const adjacencyTags = (tagJson.adjacencyTags ?? [])
        .map((t: string) => t.toLowerCase().trim().replace(/\s+/g, '-'))
        .filter((t: string) => /^[a-z0-9-]+$/.test(t))
        .slice(0, 15);

      await supabase
        .from('sites')
        .update({ adjacency_tags: adjacencyTags })
        .eq('id', site.id);

      tagged++;
      console.log(`  Tagged: ${adjacencyTags.length} adjacency tags`);
    } catch (err) {
      console.error(`  Tagging failed:`, (err as Error).message);
    }

    // Rate limit: ~0.5s between sites
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n--- Scoring complete: ${scored} scored, ${tagged} tagged, ${failed} failed ---\n`);

  // Step 3: Generate edges
  console.log('Generating adjacency graph edges...');
  const edgeCount = await generateAllEdges();
  console.log(`Generated ${edgeCount} unique edges (${edgeCount * 2} bidirectional).\n`);

  // Summary
  const { count: totalEdges } = await supabase
    .from('site_edges')
    .select('*', { count: 'exact', head: true });

  console.log('=== Summary ===');
  console.log(`Sites processed: ${sites.length}`);
  console.log(`Successfully scored: ${scored}`);
  console.log(`Successfully tagged: ${tagged}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total edges in graph: ${totalEdges}`);
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
