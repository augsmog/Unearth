"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { usePackStore } from "@/stores/packStore";
import { WebsiteCard } from "@/components/pack/WebsiteCard";
import { SiteViewer } from "@/components/SiteViewer";
import type { EngagementData } from "@/components/SiteViewer";
import { CounterDots } from "@/components/pack/CounterDots";
import { trackSiteEngagement } from "../actions";
import type { Site } from "@/types";

interface CardSelectionViewProps {
  sites: Site[];
  onConfirm: () => void;
}

export function CardSelectionView({ sites, onConfirm }: CardSelectionViewProps) {
  const { keptSiteIds, toggleKeep, packColor } = usePackStore();
  const [justKept, setJustKept] = useState<string | null>(null);
  const [previewSite, setPreviewSite] = useState<Site | null>(null);
  const maxKeep = 3;

  useEffect(() => {
    if (justKept) {
      const timer = setTimeout(() => setJustKept(null), 600);
      return () => clearTimeout(timer);
    }
  }, [justKept]);

  const handleKeepToggle = (id: string) => {
    if (!keptSiteIds.has(id) && keptSiteIds.size < maxKeep) {
      setJustKept(id);
    }
    toggleKeep(id);
  };

  const handlePreview = useCallback((site: Site) => {
    setPreviewSite(site);
  }, []);

  const handleKeepFromPreview = useCallback(() => {
    if (!previewSite) return;
    handleKeepToggle(previewSite.id);
  }, [previewSite, keptSiteIds]);

  const handleEngagement = useCallback((data: EngagementData) => {
    trackSiteEngagement(data);
  }, []);

  return (
    <div className="px-4 min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden flex-1 flex items-center justify-center">
        <div className="w-full overflow-x-auto pb-4 pt-6 hide-scrollbar">
          <div className="flex gap-4 px-4 justify-center">
            {sites.map((site, index) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              >
                <WebsiteCard
                  site={site}
                  variant="face-up"
                  isKept={keptSiteIds.has(site.id)}
                  disabled={!keptSiteIds.has(site.id) && keptSiteIds.size >= maxKeep}
                  onKeepToggle={() => handleKeepToggle(site.id)}
                  onPreview={handlePreview}
                  showParticles={justKept === site.id}
                  packColor={packColor}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: All cards visible */}
      <div className="hidden md:flex flex-1 items-center justify-center gap-2 lg:gap-4 px-4">
        {sites.map((site, index) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
          >
            <WebsiteCard
              site={site}
              variant="face-up"
              isKept={keptSiteIds.has(site.id)}
              disabled={!keptSiteIds.has(site.id) && keptSiteIds.size >= maxKeep}
              onKeepToggle={() => handleKeepToggle(site.id)}
              onPreview={handlePreview}
              showParticles={justKept === site.id}
              packColor={packColor}
            />
          </motion.div>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-6 mt-6 mb-8">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Kept {keptSiteIds.size} of {maxKeep}
          </p>
          <CounterDots total={maxKeep} filled={keptSiteIds.size} size="medium" />
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onConfirm}
          className="w-full max-w-[340px] h-[52px] rounded-xl font-semibold text-sm"
          style={{ background: "var(--accent-primary)", color: "white" }}
        >
          {keptSiteIds.size > 0 ? "Add to Collection" : "Skip this pack"}
        </motion.button>
      </div>

      {/* Embedded Site Viewer */}
      {previewSite && (
        <SiteViewer
          site={previewSite}
          isOpen={!!previewSite}
          onClose={() => setPreviewSite(null)}
          onKeep={handleKeepFromPreview}
          isKept={keptSiteIds.has(previewSite.id)}
          onEngagement={handleEngagement}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
