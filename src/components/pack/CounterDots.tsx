"use client";

interface CounterDotsProps {
  total: number;
  filled: number;
  color?: string;
  size?: string;
}

export function CounterDots({ total, filled, color = "var(--accent-primary)" }: CounterDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full transition-all duration-300"
          style={{
            background: i < filled ? color : "var(--bg-elevated)",
            border: `1.5px solid ${i < filled ? color : "var(--border-default)"}`,
            boxShadow: i < filled ? `0 0 8px ${color}40` : "none",
          }}
        />
      ))}
    </div>
  );
}
