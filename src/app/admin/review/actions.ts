'use server';

import { adminClient } from '@/lib/supabase/admin';
import { tagSite } from '@/lib/pipeline/tagger';
import { createServerSupabase } from '@/lib/supabase/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function assertAdmin(): Promise<void> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const email = user.email?.toLowerCase() ?? '';
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
    throw new Error('Not authorized');
  }
}

export async function approveSite(
  siteId: string,
  founderNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    // Fetch site for tagging
    const { data: site, error: fetchError } = await adminClient
      .from('sites')
      .select('url, title, description, quality_score, scoring_dimensions')
      .eq('id', siteId)
      .single();

    if (fetchError || !site) {
      return { success: false, error: 'Site not found' };
    }

    // Update site status to approved
    const { error: updateError } = await adminClient
      .from('sites')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', siteId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create scoring_decision record
    const { error: decisionError } = await adminClient
      .from('scoring_decisions')
      .insert({
        site_id: siteId,
        ai_score: site.quality_score,
        ai_dimensions: site.scoring_dimensions,
        decision: 'approved',
        decided_by: 'founder',
        founder_notes: founderNotes ?? null,
      });

    if (decisionError) {
      console.error('Failed to create scoring decision:', decisionError);
    }

    // Trigger tagger to enrich metadata
    try {
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
        })
        .eq('id', siteId);
    } catch (err) {
      console.error(`Tagging failed for site ${siteId}:`, err);
      // Non-fatal
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function rejectSite(
  siteId: string,
  founderNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();

    const { data: site, error: fetchError } = await adminClient
      .from('sites')
      .select('quality_score, scoring_dimensions')
      .eq('id', siteId)
      .single();

    if (fetchError || !site) {
      return { success: false, error: 'Site not found' };
    }

    // Update site status to rejected
    const { error: updateError } = await adminClient
      .from('sites')
      .update({ status: 'rejected' })
      .eq('id', siteId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create scoring_decision record
    const { error: decisionError } = await adminClient
      .from('scoring_decisions')
      .insert({
        site_id: siteId,
        ai_score: site.quality_score,
        ai_dimensions: site.scoring_dimensions,
        decision: 'rejected',
        decided_by: 'founder',
        founder_notes: founderNotes ?? null,
      });

    if (decisionError) {
      console.error('Failed to create scoring decision:', decisionError);
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
