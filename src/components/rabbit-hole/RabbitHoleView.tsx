"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SiteViewer } from "@/components/SiteViewer";
import type { EngagementData } from "@/components/SiteViewer";
import { trackSiteEngagement } from "@/app/(app)/discover/actions";
import type { Site } from "@/types";

interface RabbitHoleViewProps {
  currentSite: Site;
  nextSite: Site | null;
  branches: Site[];
  depth: number;
  theme: string;
  suggestReset?: boolean;
  onAdvance: () => void;
  onBranch: (branchSiteId: string) => void;
  onSave?: (siteId: string) => void;
  onOpenPack: () => void;
  onEnd: () => void;
}

export function RabbitHoleView({
  currentSite,
  nextSite,
  branches,
  depth,
  theme,
  suggestReset,
  onAdvance,
  onBranch,
  onSave,
  onOpenPack,
  onEnd,
}: RabbitHoleViewProps) {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [previewSite, setPreviewSite] = useState<Site | null>(null);

  const handleSave = useCallback((siteId: string) => {
    if (!onSave) return;
    setSaved(prev => new Set(prev).add(siteId));
    onSave(siteId);
  }, [onSave]);

  const handleEngagement = useCallback((data: EngagementData) => {
    trackSiteEngagement(data);
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Depth indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className="text-[var(--accent-primary)] font-bold">{depth}</span>
          <span>sites deep into</span>
          <span className="font-semibold text-white/70">{theme}</span>
        </div>
        <button
          onClick={onEnd}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          End session
        </button>
      </motion.div>

      {/* Milestone at 10+ */}
      {suggestReset && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5 p-4 text-center"
        >
          <div className="text-2xl mb-1">🎉</div>
          <div className="text-sm font-semibold text-[var(--accent-gold)]">
            {depth} sites deep!
          </div>
          <div className="text-xs text-white/50 mt-1">
            Impressive depth. Want to keep going or start fresh?
          </div>
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={onOpenPack}
              className="rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/15 transition-colors"
            >
              Open a Pack
            </button>
            <button
              onClick={onAdvance}
              className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
            >
              Keep going
            </button>
          </div>
        </motion.div>
      )}

      {/* Current site — rich preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSite.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
        >
          {/* Screenshot — clickable to preview */}
          <button
            type="button"
            onClick={() => setPreviewSite(currentSite)}
            className="aspect-video w-full overflow-hidden cursor-pointer group relative"
          >
            {currentSite.thumbnail_url ? (
              <img
                src={currentSite.thumbnail_url}
                alt={currentSite.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center" style={{ background: "var(--bg-surface)" }}>
                <span className="text-3xl" style={{ color: "var(--text-muted)" }}>?</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-4 py-2 rounded-lg">
                Preview Site
              </span>
            </div>
          </button>

          <div className="p-5">
            {/* Title + description */}
            <h2 className="text-xl font-bold text-white mb-2">
              {currentSite.title}
            </h2>
            {currentSite.description && (
              <p className="text-sm text-white/60 mb-3 line-clamp-2">
                {currentSite.description}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {currentSite.content_type && (
                <span className="rounded-full bg-[var(--accent-primary)]/20 px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
                  {currentSite.content_type}
                </span>
              )}
              {(currentSite.categories ?? []).slice(0, 2).map(cat => (
                <span key={cat} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-white/50">
                  {cat}
                </span>
              ))}
              {currentSite.engagement_format && (
                <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40">
                  {currentSite.engagement_format}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewSite(currentSite)}
                className="flex-1 rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Explore Site
              </button>
              {onSave ? (
                <button
                  onClick={() => handleSave(currentSite.id)}
                  disabled={saved.has(currentSite.id)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    saved.has(currentSite.id)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {saved.has(currentSite.id) ? '\u2713 Saved' : 'Save'}
                </button>
              ) : (
                <a
                  href="/signup"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium bg-white/10 text-white/60 hover:bg-white/15 transition-all text-center"
                >
                  Sign up to save
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Next chained site */}
      {nextSite && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onAdvance}
          className="group rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-[var(--accent-primary)]/30 hover:bg-white/8"
        >
          <div className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
            Up next
          </div>
          <div className="flex items-center gap-3">
            {nextSite.thumbnail_url && (
              <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={nextSite.thumbnail_url}
                  alt={nextSite.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">
                {nextSite.title}
              </div>
              {nextSite.description && (
                <div className="text-xs text-white/40 truncate mt-0.5">
                  {nextSite.description}
                </div>
              )}
            </div>
            <div className="text-white/20 group-hover:text-[var(--accent-primary)] transition-colors text-xl">
              &rarr;
            </div>
          </div>
        </motion.button>
      )}

      {/* Branch options */}
      {branches.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-white/20 mb-2 px-1">
            Or explore a tangent...
          </div>
          <div className="flex gap-2">
            {branches.map(branch => (
              <motion.button
                key={branch.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => onBranch(branch.id)}
                className="flex-1 rounded-lg border border-white/5 bg-white/3 p-3 text-left transition-all hover:border-white/15 hover:bg-white/5"
              >
                <div className="text-xs font-medium text-white/70 truncate">
                  {branch.title}
                </div>
                <div className="text-[10px] text-white/30 mt-0.5 truncate">
                  {(branch.categories ?? [])[0] ?? ''}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={onOpenPack}
        className="mt-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/8 transition-all"
      >
        Open a Pack instead
      </button>

      {/* Embedded Site Viewer */}
      {previewSite && (
        <SiteViewer
          site={previewSite}
          isOpen={!!previewSite}
          onClose={() => setPreviewSite(null)}
          onKeep={onSave ? () => handleSave(previewSite.id) : undefined}
          isKept={saved.has(previewSite.id)}
          keepLabel="Save"
          onEngagement={handleEngagement}
        />
      )}
    </div>
  );
}
