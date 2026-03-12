"use client";

import { motion } from "motion/react";
import { Hourglass } from "lucide-react";
import Link from "next/link";

export function EmptyStateView() {
  return (
    <div className="px-4 min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
      {/* Illustration */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-8"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          <Hourglass
            size={40}
            style={{ color: "var(--text-muted)" }}
            strokeWidth={1.5}
          />
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 max-w-sm"
      >
        <h1
          className="text-2xl md:text-3xl mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          All packed out for today!
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Your packs refresh tomorrow at midnight
        </p>
      </motion.div>

      {/* Alternative actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3 w-full max-w-[340px]"
      >
        <Link
          href="/boards"
          className="w-full h-[52px] rounded-xl font-semibold text-sm flex items-center justify-center"
          style={{ background: "var(--accent-primary)", color: "white" }}
        >
          Browse your boards
        </Link>
      </motion.div>
    </div>
  );
}
