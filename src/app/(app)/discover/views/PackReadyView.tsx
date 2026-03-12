"use client";

import { motion } from "motion/react";
import { usePackStore } from "@/stores/packStore";
import { SealedPack } from "@/components/pack/SealedPack";

interface PackReadyViewProps {
  streak: number;
  interests: string[];
  onOpenPack: () => void;
}

export function PackReadyView({ onOpenPack, interests }: PackReadyViewProps) {
  const { packColor, setPackColor } = usePackStore();

  return (
    <div className="px-4 min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12 px-4"
      >
        <p
          className="text-2xl md:text-4xl font-bold tracking-wide mb-2"
          style={{
            color: "var(--text-primary)",
            fontFamily:
              'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
            textShadow: "0 0 20px rgba(255, 107, 157, 0.3)",
            letterSpacing: "0.05em",
          }}
        >
          THE INTERNET IS CLUTTERED
        </p>
        <p
          className="text-2xl md:text-4xl font-bold tracking-wide"
          style={{
            color: "var(--accent-primary)",
            fontFamily:
              'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
            textShadow: "0 0 20px rgba(255, 107, 157, 0.5)",
            letterSpacing: "0.05em",
          }}
        >
          LET US CURATE FOR YOU
        </p>
      </motion.div>

      {/* Pack selection carousel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-3 md:gap-6 mb-8"
      >
        <SealedPack
          color="purple"
          isSelected={packColor === "purple"}
          onClick={() => setPackColor("purple")}
        />
        <SealedPack
          color="gold"
          isSelected={packColor === "gold"}
          onClick={() => setPackColor("gold")}
        />
        <SealedPack
          color="blue"
          isSelected={packColor === "blue"}
          onClick={() => setPackColor("blue")}
        />
      </motion.div>

      {/* Open Pack button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenPack}
        className="relative w-full max-w-[340px] h-[56px] rounded-xl font-bold text-base overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-primary) 0%, #E94560 100%)",
          color: "white",
          boxShadow:
            "0 8px 32px rgba(233, 69, 96, 0.5), 0 0 20px rgba(233, 69, 96, 0.3)",
        }}
      >
        {/* Animated shimmer effect */}
        <motion.div
          animate={{ x: ["-200%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
          }}
        />
        <span className="relative">Let&apos;s Explore!</span>
      </motion.button>

      {/* Interest tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex flex-wrap gap-2 justify-center max-w-[320px]"
      >
        {interests.slice(0, 4).map((interest) => (
          <div
            key={interest}
            className="px-3 py-1 rounded-full text-xs"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {interest.replace(/-/g, " ")}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
