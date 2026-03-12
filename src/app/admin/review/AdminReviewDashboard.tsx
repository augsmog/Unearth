'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { approveSite, rejectSite } from './actions';
import type { Site, ScoringDimensionDetail } from '@/types';

interface Props {
  sites: Site[];
  stats: {
    totalInPool: number;
    pendingCount: number;
    autoApproveRate: number;
  };
  scoreDistribution: { range: string; count: number }[];
}

const DIMENSION_LABELS: Record<string, string> = {
  content_originality: 'Content Originality',
  design_quality: 'Design Quality',
  human_presence: 'Human Presence',
  content_depth: 'Content Depth',
  domain_signals: 'Domain Signals',
  uniqueness: 'Uniqueness',
};

const AI_LIKELIHOOD_COLORS: Record<string, string> = {
  very_low: 'bg-emerald-500/20 text-emerald-400',
  low: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-orange-500/20 text-orange-400',
  very_high: 'bg-red-500/20 text-red-400',
};

function getScoreColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 60) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (score >= 30) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

export default function AdminReviewDashboard({
  sites: initialSites,
  stats,
  scoreDistribution,
}: Props) {
  const [sites, setSites] = useState(initialSites);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedDimensions, setExpandedDimensions] = useState(false);
  const [founderNotes, setFounderNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const currentSite = sites[currentIndex] ?? null;

  const handleApprove = useCallback(() => {
    if (!currentSite || isPending) return;

    const siteId = currentSite.id;
    const notes = founderNotes.trim() || undefined;

    startTransition(async () => {
      const result = await approveSite(siteId, notes);
      if (result.success) {
        setSites((prev) => prev.filter((s) => s.id !== siteId));
        setFounderNotes('');
        setExpandedDimensions(false);
        // Keep index clamped
        setCurrentIndex((prev) =>
          prev >= sites.length - 1 ? Math.max(0, prev - 1) : prev
        );
      } else {
        console.error('Approve failed:', result.error);
      }
    });
  }, [currentSite, founderNotes, isPending, sites.length]);

  const handleReject = useCallback(() => {
    if (!currentSite || isPending) return;

    const siteId = currentSite.id;
    const notes = founderNotes.trim() || undefined;

    startTransition(async () => {
      const result = await rejectSite(siteId, notes);
      if (result.success) {
        setSites((prev) => prev.filter((s) => s.id !== siteId));
        setFounderNotes('');
        setExpandedDimensions(false);
        setCurrentIndex((prev) =>
          prev >= sites.length - 1 ? Math.max(0, prev - 1) : prev
        );
      } else {
        console.error('Reject failed:', result.error);
      }
    });
  }, [currentSite, founderNotes, isPending, sites.length]);

  const handleSkip = useCallback(() => {
    if (!currentSite) return;
    setCurrentIndex((prev) => (prev + 1) % sites.length);
    setFounderNotes('');
    setExpandedDimensions(false);
  }, [currentSite, sites.length]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire if typing in an input
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          handleApprove();
          break;
        case 'r':
          handleReject();
          break;
        case 's':
          handleSkip();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleApprove, handleReject, handleSkip]);

  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <svg
          className="mb-4 h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium">Review queue is empty</p>
        <p className="text-sm">All scored sites have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main content area */}
      <div className="space-y-6">
        {/* Queue list */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-medium text-zinc-300">
              Review Queue ({sites.length} pending)
            </h2>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {sites.map((site, idx) => (
              <button
                key={site.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setFounderNotes('');
                  setExpandedDimensions(false);
                }}
                className={`flex w-full items-center gap-3 border-b border-zinc-800/50 px-5 py-3 text-left transition-colors last:border-0 hover:bg-zinc-800/50 ${
                  idx === currentIndex ? 'bg-zinc-800/70' : ''
                }`}
              >
                <span
                  className={`inline-flex min-w-[42px] items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold ${getScoreColor(site.quality_score)}`}
                >
                  {site.quality_score}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {site.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{site.url}</p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    AI_LIKELIHOOD_COLORS[site.ai_content_likelihood] ?? 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  AI: {site.ai_content_likelihood.replace('_', ' ')}
                </span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                  {site.source}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Current site detail */}
        {currentSite && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {currentSite.title}
                </h3>
                <a
                  href={currentSite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  {currentSite.url}
                </a>
              </div>
              <span
                className={`ml-4 rounded-lg border px-3 py-1 text-lg font-bold ${getScoreColor(currentSite.quality_score)}`}
              >
                {currentSite.quality_score}
              </span>
            </div>

            {currentSite.description && (
              <p className="mb-4 text-sm leading-relaxed text-zinc-400">
                {currentSite.description}
              </p>
            )}

            {/* Score breakdown */}
            <div className="mb-4">
              <button
                onClick={() => setExpandedDimensions(!expandedDimensions)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                <svg
                  className={`h-4 w-4 transition-transform ${expandedDimensions ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                Score Breakdown
              </button>

              {expandedDimensions && currentSite.scoring_dimensions && (
                <div className="mt-3 space-y-3">
                  {Object.entries(currentSite.scoring_dimensions).map(
                    ([key, dim]) => {
                      const detail = dim as ScoringDimensionDetail;
                      return (
                        <div key={key} className="rounded-lg bg-zinc-800/50 p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-300">
                              {DIMENSION_LABELS[key] ?? key}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                detail.score >= 70
                                  ? 'text-emerald-400'
                                  : detail.score >= 40
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {detail.score}/100
                            </span>
                          </div>
                          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                            <div
                              className={`h-full rounded-full transition-all ${
                                detail.score >= 70
                                  ? 'bg-emerald-500'
                                  : detail.score >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${detail.score}%` }}
                            />
                          </div>
                          <p className="text-xs text-zinc-500">
                            {detail.reasoning}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* Founder notes */}
            <div className="mb-4">
              <label
                htmlFor="founder-notes"
                className="mb-1 block text-xs font-medium text-zinc-400"
              >
                Founder Notes (optional)
              </label>
              <textarea
                id="founder-notes"
                value={founderNotes}
                onChange={(e) => setFounderNotes(e.target.value)}
                placeholder="Add any notes about this site..."
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                rows={2}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve
                <kbd className="ml-1 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-mono">
                  A
                </kbd>
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
                <kbd className="ml-1 rounded bg-red-700 px-1.5 py-0.5 text-[10px] font-mono">
                  R
                </kbd>
              </button>
              <button
                onClick={handleSkip}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                Skip
                <kbd className="ml-1 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-mono">
                  S
                </kbd>
              </button>

              {isPending && (
                <span className="ml-2 text-xs text-zinc-500">Processing...</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Stats */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-4 text-sm font-medium text-zinc-300">
            Pipeline Stats
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Total in pool</span>
              <span className="text-sm font-bold text-white">
                {stats.totalInPool.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Pending review</span>
              <span className="text-sm font-bold text-yellow-400">
                {stats.pendingCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Auto-approve rate (7d)
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {stats.autoApproveRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Score distribution chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-4 text-sm font-medium text-zinc-300">
            Score Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 9, fill: '#71717a' }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#e4e4e7' }}
                  itemStyle={{ color: '#a78bfa' }}
                />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Keyboard shortcuts legend */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 text-sm font-medium text-zinc-300">
            Keyboard Shortcuts
          </h3>
          <div className="space-y-2 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                A
              </kbd>
              <span>Approve site</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                R
              </kbd>
              <span>Reject site</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                S
              </kbd>
              <span>Skip to next</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
