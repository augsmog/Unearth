"use client";

import { motion } from "motion/react";
import { Compass, Sparkles, Zap } from "lucide-react";
import type { PackColor } from "@/stores/packStore";

const packThemes: Record<PackColor, { gradient: string; border: string; icon: typeof Compass; label: string }> = {
  gold: {
    gradient: "linear-gradient(135deg, #2A1810 0%, #1a1f3a 50%, #0a0e27 100%)",
    border: "rgba(255, 215, 0, 0.5)",
    icon: Compass,
    label: "Explorer",
  },
  blue: {
    gradient: "linear-gradient(135deg, #0a1628 0%, #1a2f4a 50%, #0a1628 100%)",
    border: "rgba(78, 205, 196, 0.5)",
    icon: Zap,
    label: "Trending",
  },
  purple: {
    gradient: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)",
    border: "rgba(155, 89, 182, 0.5)",
    icon: Sparkles,
    label: "Surprise",
  },
};

const accentColors: Record<PackColor, string> = {
  gold: "#FFD700",
  blue: "#4ECDC4",
  purple: "#9B59B6",
};

interface SealedPackProps {
  color: PackColor;
  selected?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: string;
}

export function SealedPack({ color, selected: selectedProp, isSelected, onClick }: SealedPackProps) {
  const selected = selectedProp ?? isSelected;
  const theme = packThemes[color];
  const accent = accentColors[color];
  const Icon = theme.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
      whileTap={{ scale: 0.95 }}
      className="relative w-[160px] h-[220px] md:w-[180px] md:h-[260px] rounded-xl overflow-hidden cursor-pointer flex-shrink-0"
      style={{
        background: theme.gradient,
        border: `2px solid ${selected ? accent : theme.border}`,
        boxShadow: selected
          ? `0 0 30px ${accent}40, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 4px 20px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Corner decorations */}
      {["top-0 left-0 border-l-2 border-t-2", "top-0 right-0 border-r-2 border-t-2", "bottom-0 left-0 border-l-2 border-b-2", "bottom-0 right-0 border-r-2 border-b-2"].map((pos) => (
        <div key={pos} className={`absolute ${pos} w-8 h-8 opacity-30`} style={{ borderColor: accent }} />
      ))}

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-16 h-16 rounded-full border opacity-20"
          style={{ borderColor: accent, borderStyle: "dashed" }}
        />
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${accent}30, transparent 70%)` }}>
          <Icon size={28} style={{ color: accent }} strokeWidth={1.5} />
        </div>
      </div>

      {/* Label */}
      <div className="absolute top-3 left-0 right-0 text-center">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: accent, textShadow: `0 0 10px ${accent}30` }}>
          {theme.label}
        </span>
      </div>

      {/* Bottom badge */}
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="inline-block px-2 py-0.5 rounded text-[10px] tracking-wide uppercase" style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${accent}40`, color: accent }}>
          5 Sites
        </span>
      </div>
    </motion.button>
  );
}
