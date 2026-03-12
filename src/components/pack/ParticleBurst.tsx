"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface ParticleBurstProps {
  trigger: boolean;
  colors?: string[];
}

export function ParticleBurst({
  trigger,
  colors = ["#FFD700", "#E94560", "#4ECDC4", "#9B59B6", "#FF6B6B"],
}: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newParticles = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: colors[i % colors.length],
      };
    });
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 600);
    return () => clearTimeout(timer);
  }, [trigger, colors]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
          style={{ background: p.color }}
        />
      ))}
    </div>
  );
}
