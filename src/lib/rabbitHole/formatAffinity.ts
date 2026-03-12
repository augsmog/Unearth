import { adminClient } from '@/lib/supabase/admin';
import type { FormatAffinityAction } from '@/types';

/**
 * Update a user's format affinity based on their interaction with a site.
 *
 * Actions and their effects:
 * - keep: +0.1 asymptotic approach -> new = old + (1 - old) * 0.1
 * - pass: *0.95 slow decay -> new = old * 0.95
 * - follow (rabbit hole advance): +0.15 approach -> new = old + (1 - old) * 0.15
 * - abandon (mid-chain exit): same as pass decay
 */
export async function updateFormatAffinity(
  userId: string,
  siteId: string,
  action: FormatAffinityAction
): Promise<void> {
  // Get site's categories and engagement format
  const { data: site } = await adminClient
    .from('sites')
    .select('categories, engagement_format')
    .eq('id', siteId)
    .single();

  if (!site?.engagement_format) return;

  const format = site.engagement_format;
  const categories = site.categories ?? [];

  // Update format preferences for each of the site's categories
  for (const category of categories) {
    // Get or create the preference row
    const { data: existing } = await adminClient
      .from('user_format_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('interest_slug', category)
      .single();

    let formatScores: Record<string, number> = {};
    let sampleSize = 0;

    if (existing) {
      formatScores = (existing.format_scores as Record<string, number>) ?? {};
      sampleSize = existing.sample_size ?? 0;
    }

    const currentScore = formatScores[format] ?? 0.5; // Neutral default

    // Apply the affinity formula based on action
    let newScore: number;
    switch (action) {
      case 'keep':
        newScore = currentScore + (1 - currentScore) * 0.1;
        break;
      case 'follow':
        newScore = currentScore + (1 - currentScore) * 0.15;
        break;
      case 'pass':
      case 'abandon':
        newScore = currentScore * 0.95;
        break;
    }

    formatScores[format] = Math.round(newScore * 1000) / 1000; // 3 decimal places

    // Upsert the preference
    await adminClient
      .from('user_format_preferences')
      .upsert(
        {
          user_id: userId,
          interest_slug: category,
          format_scores: formatScores,
          sample_size: sampleSize + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,interest_slug' }
      );
  }
}
