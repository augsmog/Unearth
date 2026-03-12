"use client";

import { motion } from "motion/react";

interface RabbitHoleSummaryProps {
  theme: string;
  depth: number;
  sitesVisited: number;
  onStartNew: () => void;
  onOpenPack: () => void;
}

export function RabbitHoleSummary({
  theme,
  depth,
  sitesVisited,
  onStartNew,
  onOpenPack,
}: RabbitHoleSummaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-5xl mb-4"
      >
        🕳️
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-white mb-2"
      >
        Rabbit Hole Complete
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-white/50 mb-6"
      >
        You explored &quot;{theme}&quot;
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-8 mb-8"
      >
        <div>
          <div className="text-3xl font-bold text-[var(--accent-primary)]">{depth}</div>
          <div className="text-xs text-white/40 mt-1">Sites Deep</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-[var(--accent-gold)]">{sitesVisited}</div>
          <div className="text-xs text-white/40 mt-1">Discovered</div>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <button
          onClick={onStartNew}
          className="rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Start a New Rabbit Hole
        </button>
        <button
          onClick={onOpenPack}
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          Open a Pack
        </button>
      </motion.div>
    </div>
  );
}
