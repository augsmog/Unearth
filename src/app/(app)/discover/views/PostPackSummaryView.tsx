"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { ChevronDown, Flame } from "lucide-react";
import { WebsiteCard } from "@/components/pack/WebsiteCard";
import { SiteViewer } from "@/components/SiteViewer";
import type { EngagementData } from "@/components/SiteViewer";
import { trackSiteEngagement } from "../actions";
import type { Site } from "@/types";

interface PostPackSummaryViewProps {
  keptSites: Site[];
  streak: number;
  onOpenAnother: () => void;
  onDiveDeeper?: (siteId: string, category: string) => void;
}

export function PostPackSummaryView({
  keptSites,
  streak,
  onOpenAnother,
  onDiveDeeper,
}: PostPackSummaryViewProps) {
  const [previewSite, setPreviewSite] = useState<Site | null>(null);

  const handlePreview = useCallback((site: Site) => {
    setPreviewSite(site);
  }, []);

  const handleEngagement = useCallback((data: EngagementData) => {
    trackSiteEngagement(data);
  }, []);

  return (
    <div className="px-4 min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
      {/* Header text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1
          className="text-3xl md:text-4xl mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Nice finds!
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Added to your collection
        </p>
      </motion.div>

      {/* Kept cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 mb-6 flex-wrap justify-center max-w-4xl"
      >
        {keptSites.map((site, index) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex flex-col items-center gap-2"
          >
            <WebsiteCard site={site} variant="face-up" isKept onPreview={handlePreview} />
            {onDiveDeeper && (site.categories ?? []).length > 0 && (
              <button
                onClick={() => onDiveDeeper(site.id, site.categories[0])}
                className="text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 transition-colors px-3 py-1.5 rounded-lg border border-[var(--accent-primary)]/20 hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/5"
              >
                Dive deeper into {site.categories[0].split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Board selector */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg mb-6"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
        }}
      >
        <span className="text-sm">Save to: Favorites</span>
        <ChevronDown size={16} />
      </motion.button>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col items-center gap-3 w-full max-w-[340px]"
      >
        <button
          onClick={onOpenAnother}
          className="w-full h-[52px] rounded-xl font-semibold text-sm"
          style={{ background: "var(--accent-primary)", color: "white" }}
        >
          Open Another Pack
        </button>
      </motion.div>

      {/* Stats nudge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-8 flex items-center gap-2 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <Flame
          size={14}
          style={{ color: "var(--accent-gold)" }}
          fill="currentColor"
        />
        <span>
          {streak}-day streak! You&apos;ve discovered {keptSites.length} sites
        </span>
      </motion.div>

      {/* Embedded Site Viewer */}
      {previewSite && (
        <SiteViewer
          site={previewSite}
          isOpen={!!previewSite}
          onClose={() => setPreviewSite(null)}
          keepLabel="View"
          onEngagement={handleEngagement}
        />
      )}
    </div>
  );
}
