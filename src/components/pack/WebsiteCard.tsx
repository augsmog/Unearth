"use client";

import { motion } from "motion/react";
import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { ParticleBurst } from "./ParticleBurst";
import type { Site } from "@/types";

interface WebsiteCardProps {
  site: Site;
  kept?: boolean;
  isKept?: boolean;
  onToggle?: () => void;
  onKeepToggle?: () => void;
  onPreview?: (site: Site) => void;
  disabled?: boolean;
  index?: number;
  variant?: string;
  showParticles?: boolean;
  packColor?: string;
}

export function WebsiteCard({ site, kept: keptProp, isKept, onToggle, onKeepToggle, onPreview, disabled, index = 0 }: WebsiteCardProps) {
  const kept = keptProp ?? isKept ?? false;
  const handleToggleAction = onToggle ?? onKeepToggle ?? (() => {});
  const [burstKey, setBurstKey] = useState(0);

  const handleToggle = () => {
    if (!kept) setBurstKey((k) => k + 1);
    handleToggleAction();
  };

  const handlePreviewClick = () => {
    if (onPreview) {
      onPreview(site);
    } else {
      window.open(site.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="relative w-[280px] md:w-[260px] flex-shrink-0 rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-elevated)",
        border: `2px solid ${kept ? "var(--accent-primary)" : "var(--border-subtle)"}`,
        boxShadow: kept ? "0 0 20px rgba(233, 69, 96, 0.3)" : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Thumbnail — clickable for preview */}
      <button
        type="button"
        onClick={handlePreviewClick}
        className="relative aspect-video w-full bg-black/20 cursor-pointer group"
      >
        {site.thumbnail_url ? (
          <Image
            src={site.thumbnail_url}
            alt={site.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="280px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--bg-surface)" }}>
            <span className="text-2xl" style={{ color: "var(--text-muted)" }}>?</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Preview
          </span>
        </div>
      </button>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold line-clamp-1 mb-1" style={{ color: "var(--text-primary)" }}>
          {site.title}
        </h3>
        <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--text-secondary)" }}>
          {site.description}
        </p>
        {site.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {site.categories.slice(0, 2).map((cat) => (
              <span key={cat} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Keep button */}
        <div className="relative">
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled && !kept}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: kept ? "var(--accent-primary)" : "var(--bg-surface)",
              color: kept ? "white" : "var(--text-secondary)",
              border: `1px solid ${kept ? "var(--accent-primary)" : "var(--border-default)"}`,
              opacity: disabled && !kept ? 0.4 : 1,
            }}
          >
            <Heart size={14} fill={kept ? "white" : "none"} />
            {kept ? "Kept" : "Keep"}
          </button>
          <ParticleBurst key={burstKey} trigger={burstKey > 0} />
        </div>
      </div>

      {/* Preview link */}
      <button
        type="button"
        onClick={handlePreviewClick}
        className="block w-full text-center py-2 text-xs transition-colors cursor-pointer hover:opacity-80"
        style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)" }}
      >
        Preview Site &rarr;
      </button>
    </motion.div>
  );
}
