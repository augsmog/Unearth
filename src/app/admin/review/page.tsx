import { adminClient } from '@/lib/supabase/admin';
import AdminReviewDashboard from './AdminReviewDashboard';
import type { Site } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  // Fetch pending review queue: sites that are pending and have been scored
  const { data: pendingSites, error } = await adminClient
    .from('sites')
    .select('*')
    .eq('status', 'pending')
    .not('scoring_dimensions', 'is', null)
    .order('quality_score', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-6">
        <p className="text-red-400">
          Failed to load review queue: {error.message}
        </p>
      </div>
    );
  }

  // Fetch stats
  const [
    { count: totalCount },
    { count: pendingCount },
    { count: approvedThisWeek },
    { count: totalScoredThisWeek },
  ] = await Promise.all([
    adminClient.from('sites').select('*', { count: 'exact', head: true }),
    adminClient
      .from('sites')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    adminClient
      .from('scoring_decisions')
      .select('*', { count: 'exact', head: true })
      .eq('decision', 'approved')
      .eq('decided_by', 'ai')
      .gte(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ),
    adminClient
      .from('scoring_decisions')
      .select('*', { count: 'exact', head: true })
      .eq('decided_by', 'ai')
      .gte(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ),
  ]);

  const autoApproveRate =
    totalScoredThisWeek && totalScoredThisWeek > 0
      ? Math.round(((approvedThisWeek ?? 0) / totalScoredThisWeek) * 100)
      : 0;

  // Build score distribution data for the chart
  const { data: allScored } = await adminClient
    .from('sites')
    .select('quality_score')
    .not('quality_score', 'eq', 0);

  const distribution = buildScoreDistribution(
    (allScored ?? []).map((s) => s.quality_score)
  );

  return (
    <AdminReviewDashboard
      sites={(pendingSites ?? []) as Site[]}
      stats={{
        totalInPool: totalCount ?? 0,
        pendingCount: pendingCount ?? 0,
        autoApproveRate,
      }}
      scoreDistribution={distribution}
    />
  );
}

function buildScoreDistribution(
  scores: number[]
): { range: string; count: number }[] {
  const buckets: Record<string, number> = {
    '0-10': 0,
    '11-20': 0,
    '21-30': 0,
    '31-40': 0,
    '41-50': 0,
    '51-60': 0,
    '61-70': 0,
    '71-80': 0,
    '81-90': 0,
    '91-100': 0,
  };

  for (const score of scores) {
    if (score <= 10) buckets['0-10']++;
    else if (score <= 20) buckets['11-20']++;
    else if (score <= 30) buckets['21-30']++;
    else if (score <= 40) buckets['31-40']++;
    else if (score <= 50) buckets['41-50']++;
    else if (score <= 60) buckets['51-60']++;
    else if (score <= 70) buckets['61-70']++;
    else if (score <= 80) buckets['71-80']++;
    else if (score <= 90) buckets['81-90']++;
    else buckets['91-100']++;
  }

  return Object.entries(buckets).map(([range, count]) => ({
    range,
    count,
  }));
}
