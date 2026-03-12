"use client";

import { motion } from "motion/react";
import type { Site } from "@/types";

interface RabbitHoleEntry {
  site: Site;
  themeLabel: string;
  depthAvailable: number;
  category: string;
}

interface RabbitHoleReadyViewProps {
  entries: RabbitHoleEntry[];
  onStartRabbitHole: (entrySiteId: string, category: string) => void;
}

export function RabbitHoleReadyView({ entries, onStartRabbitHole }: RabbitHoleReadyViewProps) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-4">
        Or explore a rabbit hole
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map((entry, i) => (
          <motion.button
            key={entry.site.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onStartRabbitHole(entry.site.id, entry.category)}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-[var(--accent-primary)]/50 hover:bg-white/8"
          >
            {/* Thumbnail */}
            {entry.site.thumbnail_url && (
              <div className="mb-3 h-24 w-full overflow-hidden rounded-lg">
                <img
                  src={entry.site.thumbnail_url}
                  alt={entry.site.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            )}

            {/* Theme label */}
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-1">
              {entry.themeLabel}
            </div>

            {/* Site title */}
            <div className="text-sm font-medium text-white truncate">
              {entry.site.title}
            </div>

            {/* Depth info */}
            <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                {entry.depthAvailable}+ sites to discover
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                {entry.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
