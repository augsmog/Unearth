import Anthropic from '@anthropic-ai/sdk';
import type { ScoringResult, AiContentLikelihood, EngagementFormat, ScoringDimensionDetail } from '@/types';

const anthropic = new Anthropic();

const DIMENSION_WEIGHTS: Record<string, number> = {
  content_originality: 0.19,
  human_presence: 0.16,
  content_depth: 0.16,
  indie_factor: 0.14,
  design_quality: 0.11,
  cold_open_quality: 0.10,
  domain_signals: 0.07,
  uniqueness: 0.07,
};

const SCORING_PROMPT = `You are an expert web content evaluator for Unearth, a platform that curates the best indie, obscure, hard-to-find websites — things people would NOT find on the first page of Google.

Evaluate the provided website content across these 8 dimensions. For each dimension, provide a score from 1-100 and brief reasoning.

## Dimensions

1. **content_originality** (19% weight): How original and unique is the content? Is it a fresh perspective or rehashed content? Does it offer insights not found elsewhere?

2. **human_presence** (16% weight): Does this content feel authentically human-written? Look for personal voice, lived experience, nuanced opinions. Score LOW if it reads like AI-generated content.

3. **content_depth** (16% weight): How thorough and substantive is the content? Does it go beyond surface-level treatment? Is there evidence of research or deep knowledge?

4. **indie_factor** (14% weight): How indie/obscure is this site? Score 90+: personal passion project, tiny team, no marketing budget, unusual domain, clearly not optimized for SEO. Score 70-89: small independent team, niche audience, minimal advertising. Score 50-69: somewhat known in its niche, some SEO effort, modest following. Score 30-49: well-known within tech/design circles, significant social following. Score 1-29: major brand, VC-backed, household name, heavy SEO/marketing, appears on first page of Google for its category.

5. **design_quality** (11% weight): Based on the URL and content structure, does this appear to be a well-designed, thoughtfully crafted site? Consider readability and presentation.

6. **cold_open_quality** (10% weight): How immediately engaging is this site for a first-time visitor who lands with zero context? Score 90+ for sites delivering value within 3 seconds (interactive toys, auto-playing visualizations, playable games). Score 70-89 for sites engaging within 10 seconds (clear visual hook, obvious interaction). Score 50-69 for sites needing 30+ seconds of orientation. Score 30-49 for sites requiring significant reading commitment. Score 1-29 for sites needing deep navigation, account creation, or prior context.

7. **domain_signals** (7% weight): Consider the domain reputation, age signals, and whether this seems like a legitimate, established source vs. spam or low-effort site.

8. **uniqueness** (7% weight): How different is this from typical content in its category? Does it stand out from the crowd?

## AI Content Assessment

Also assess the likelihood that this content is AI-generated:
- "very_low": Clearly human, strong personal voice
- "low": Likely human, some personal touches
- "medium": Uncertain, could be either
- "high": Likely AI-generated, generic patterns
- "very_high": Almost certainly AI-generated

## Response Format

Respond with ONLY valid JSON matching this exact structure:
{
  "overall_score": <number 1-100, weighted average of dimensions>,
  "dimensions": {
    "content_originality": { "score": <number>, "reasoning": "<string>" },
    "human_presence": { "score": <number>, "reasoning": "<string>" },
    "content_depth": { "score": <number>, "reasoning": "<string>" },
    "indie_factor": { "score": <number>, "reasoning": "<string>" },
    "design_quality": { "score": <number>, "reasoning": "<string>" },
    "cold_open_quality": { "score": <number>, "reasoning": "<string>" },
    "domain_signals": { "score": <number>, "reasoning": "<string>" },
    "uniqueness": { "score": <number>, "reasoning": "<string>" }
  },
  "ai_content_likelihood": "<very_low|low|medium|high|very_high>",
  "summary": "<one sentence summary of the site's value proposition>",
  "recommended_categories": ["<category1>", "<category2>"],
  "recommended_tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>"],
  "engagement_format": "<instant|visual|read-short|read-long|tool|explore>",
  "rabbit_hole_depth_potential": <1-5>
}`;

export async function scoreSite(
  url: string,
  textContent: string,
  title: string
): Promise<ScoringResult> {
  const truncatedContent = textContent.slice(0, 8000);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${SCORING_PROMPT}

## Site to Evaluate

**URL:** ${url}
**Title:** ${title}

**Content:**
${truncatedContent}`,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from the response (handle possible markdown wrapping)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Scorer did not return valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    overall_score: number;
    dimensions: Record<string, ScoringDimensionDetail>;
    ai_content_likelihood: AiContentLikelihood;
    summary: string;
    recommended_categories: string[];
    recommended_tags: string[];
    engagement_format: EngagementFormat;
    rabbit_hole_depth_potential: number;
  };

  // Validate and recalculate the weighted score for accuracy
  const calculatedScore = calculateWeightedScore(parsed.dimensions);

  return {
    overall_score: Math.round(calculatedScore),
    dimensions: parsed.dimensions,
    ai_content_likelihood: parsed.ai_content_likelihood,
    summary: parsed.summary,
    recommended_categories: parsed.recommended_categories ?? [],
    recommended_tags: parsed.recommended_tags ?? [],
    cold_open_score: parsed.dimensions.cold_open_quality?.score,
    engagement_format: parsed.engagement_format,
    rabbit_hole_depth_potential: parsed.rabbit_hole_depth_potential,
  };
}

function calculateWeightedScore(
  dimensions: Record<string, ScoringDimensionDetail>
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    const dim = dimensions[key];
    if (dim) {
      weightedSum += dim.score * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
