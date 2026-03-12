import { adminClient } from '@/lib/supabase/admin';
import { tagSite } from '@/lib/pipeline/tagger';
import { generateEdges } from '@/lib/pipeline/edgeGenerator';
import { isBlockedDomain } from '@/lib/pipeline/blocklist';
import type { ScoringResult, ScoringDecisionOutcome, SiteStatus } from '@/types';

export type RouteDecision = 'auto_approve' | 'human_review' | 'auto_reject';

/**
 * Determine the routing decision based on the quality score.
 */
export function routeByScore(score: number): RouteDecision {
  if (score >= 85) return 'auto_approve';
  if (score >= 30) return 'human_review';
  return 'auto_reject';
}

/**
 * Map route decisions to their corresponding DB-level values.
 */
function toSiteStatus(decision: RouteDecision): SiteStatus {
  switch (decision) {
    case 'auto_approve':
      return 'approved';
    case 'human_review':
      return 'pending';
    case 'auto_reject':
      return 'rejected';
  }
}

function toDecisionOutcome(decision: RouteDecision): ScoringDecisionOutcome {
  switch (decision) {
    case 'auto_approve':
      return 'approved';
    case 'human_review':
      return 'needs_review';
    case 'auto_reject':
      return 'rejected';
  }
}

/**
 * Check if a site URL is on the mainstream blocklist.
 * If blocked, auto-reject it without spending API calls on scoring.
 */
export async function checkBlocklist(
  siteId: string,
  url: string
): Promise<boolean> {
  if (!isBlockedDomain(url)) return false;

  await adminClient
    .from('sites')
    .update({ status: 'rejected' })
    .eq('id', siteId);

  await adminClient
    .from('scoring_decisions')
    .insert({
      site_id: siteId,
      ai_score: 0,
      ai_dimensions: null,
      decision: 'rejected',
      decided_by: 'ai',
      founder_notes: 'Auto-rejected: mainstream domain blocklist',
    });

  return true;
}

/**
 * Process a scored site:
 * 1. Update site status based on score
 * 2. Create a scoring_decision record
 * 3. If approved, trigger the tagger to enrich metadata
 */
export async function processScoredSite(
  siteId: string,
  scoringResult: ScoringResult
): Promise<{
  decision: RouteDecision;
  tagged: boolean;
}> {
  const decision = routeByScore(scoringResult.overall_score);
  const status = toSiteStatus(decision);
  const outcome = toDecisionOutcome(decision);

  // Update site with scoring data
  const siteUpdate: Record<string, unknown> = {
    quality_score: scoringResult.overall_score,
    scoring_dimensions: scoringResult.dimensions,
    ai_content_likelihood: scoringResult.ai_content_likelihood,
    status,
  };

  if (scoringResult.cold_open_score !== undefined) {
    siteUpdate.cold_open_score = scoringResult.cold_open_score;
  }
  if (scoringResult.engagement_format) {
    siteUpdate.engagement_format = scoringResult.engagement_format;
  }
  if (scoringResult.rabbit_hole_depth_potential !== undefined) {
    siteUpdate.rabbit_hole_depth_potential = scoringResult.rabbit_hole_depth_potential;
  }

  if (status === 'approved') {
    siteUpdate.approved_at = new Date().toISOString();
  }

  const { error: updateError } = await adminClient
    .from('sites')
    .update(siteUpdate)
    .eq('id', siteId);

  if (updateError) {
    throw new Error(`Failed to update site: ${updateError.message}`);
  }

  // Create scoring_decision record
  const { error: decisionError } = await adminClient
    .from('scoring_decisions')
    .insert({
      site_id: siteId,
      ai_score: scoringResult.overall_score,
      ai_dimensions: scoringResult.dimensions,
      decision: outcome,
      decided_by: 'ai',
    });

  if (decisionError) {
    throw new Error(
      `Failed to create scoring decision: ${decisionError.message}`
    );
  }

  // If approved, run tagger to enrich metadata
  let tagged = false;
  if (decision === 'auto_approve') {
    try {
      const { data: site } = await adminClient
        .from('sites')
        .select('url, title, description')
        .eq('id', siteId)
        .single();

      if (site) {
        const tagResult = await tagSite(
          site.url,
          site.description ?? '',
          site.title
        );

        await adminClient
          .from('sites')
          .update({
            categories: tagResult.categories,
            tags: tagResult.tags,
            content_type: tagResult.contentType,
            description: tagResult.description,
            adjacency_tags: tagResult.adjacencyTags,
          })
          .eq('id', siteId);

        tagged = true;

        // Generate edges for the adjacency graph
        try {
          await generateEdges(siteId);
        } catch (edgeErr) {
          console.error(`Edge generation failed for site ${siteId}:`, edgeErr);
          // Non-fatal
        }
      }
    } catch (err) {
      console.error(`Tagging failed for site ${siteId}:`, err);
      // Non-fatal: site is still approved, just not enriched
    }
  }

  return { decision, tagged };
}
