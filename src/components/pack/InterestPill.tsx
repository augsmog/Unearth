"use client";

import { cn } from "@/lib/utils/cn";

interface InterestPillProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function InterestPill({ label, selected, onClick, size = "md" }: InterestPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full font-medium transition-all duration-200",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        selected && "scale-[1.02]"
      )}
      style={{
        background: selected ? "var(--accent-primary)" : "var(--bg-elevated)",
        color: selected ? "white" : "var(--text-secondary)",
        border: `1px solid ${selected ? "var(--accent-primary)" : "var(--border-default)"}`,
      }}
    >
      {label}
    </button>
  );
}
