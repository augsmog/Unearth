"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { usePackStore } from "@/stores/packStore";
import { SealedPack } from "@/components/pack/SealedPack";
import { WebsiteCard } from "@/components/pack/WebsiteCard";
import type { Site } from "@/types";

type AnimationPhase =
  | "shake"
  | "tilt"
  | "burst"
  | "cards-fly"
  | "cards-settle"
  | "flip"
  | "complete";

interface PackOpeningViewProps {
  sites: Site[];
  onAnimationComplete: () => void;
}

export function PackOpeningView({
  sites,
  onAnimationComplete,
}: PackOpeningViewProps) {
  const { packColor } = usePackStore();
  const [phase, setPhase] = useState<AnimationPhase>("shake");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("tilt"), 600),
      setTimeout(() => setPhase("burst"), 1200),
      setTimeout(() => setPhase("cards-fly"), 1400),
      setTimeout(() => setPhase("cards-settle"), 1900),
      setTimeout(() => setPhase("flip"), 2400),
      setTimeout(() => setPhase("complete"), 3200),
      setTimeout(() => onAnimationComplete(), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onAnimationComplete]);

  const getParticleColor = () => {
    if (packColor === "gold") return "#FFD700";
    if (packColor === "blue") return "#00D4FF";
    return "#B794F6";
  };

  const getGlowGradient = () => {
    if (packColor === "gold")
      return "radial-gradient(circle, #FFD700 0%, var(--accent-primary) 50%, transparent 70%)";
    if (packColor === "blue")
      return "radial-gradient(circle, #00D4FF 0%, var(--accent-primary) 50%, transparent 70%)";
    return "radial-gradient(circle, #B794F6 0%, var(--accent-primary) 50%, transparent 70%)";
  };

  const getRayGradient = () => {
    if (packColor === "gold")
      return "linear-gradient(to top, #FFD700, transparent)";
    if (packColor === "blue")
      return "linear-gradient(to top, #00D4FF, transparent)";
    return "linear-gradient(to top, #B794F6, transparent)";
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      {/* Phase 1-3: Pack shaking, tilting, and bursting */}
      {(phase === "shake" || phase === "tilt" || phase === "burst") && (
        <div className="relative">
          {phase === "shake" && (
            <motion.div
              animate={{
                rotate: [0, -2, 2, -2, 2, 0],
                scale: [1, 1.02, 1, 1.02, 1],
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <SealedPack variant="sealed" color={packColor} />
            </motion.div>
          )}

          {phase === "tilt" && (
            <motion.div
              initial={{ rotateY: 0, rotateX: 0, scale: 1 }}
              animate={{ rotateY: 25, rotateX: -10, scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d", perspective: 1000 }}
            >
              <SealedPack variant="sealed" color={packColor} />
            </motion.div>
          )}

          {phase === "burst" && (
            <>
              <motion.div
                initial={{ scale: 1.1, rotateY: 25, rotateX: -10 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <SealedPack variant="opening" color={packColor} />
              </motion.div>

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 3, opacity: [0, 1, 0] }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div
                  className="w-64 h-64 rounded-full blur-3xl"
                  style={{ background: getGlowGradient() }}
                />
              </motion.div>

              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: [0, 0.6, 0] }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="absolute top-1/2 left-1/2 w-1 h-96 origin-bottom"
                  style={{
                    background: getRayGradient(),
                    transform: `rotate(${i * 45}deg) translateX(-50%)`,
                    marginLeft: "-0.125rem",
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Phase 4-7: Cards flying out and settling */}
      {(phase === "cards-fly" ||
        phase === "cards-settle" ||
        phase === "flip" ||
        phase === "complete") && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 w-full px-2 sm:px-4">
          {sites.map((site, index) => {
            const scatterPositions = [
              { x: -80, y: -60, rotate: -25 },
              { x: -40, y: -80, rotate: -12 },
              { x: 0, y: -90, rotate: 0 },
              { x: 40, y: -80, rotate: 12 },
              { x: 80, y: -60, rotate: 25 },
            ];

            const desktopScatterPositions = [
              { x: -180, y: -100, rotate: -25 },
              { x: -90, y: -130, rotate: -12 },
              { x: 0, y: -140, rotate: 0 },
              { x: 90, y: -130, rotate: 12 },
              { x: 180, y: -100, rotate: 25 },
            ];

            const getScatter = () => {
              if (typeof window !== "undefined" && window.innerWidth >= 1024)
                return desktopScatterPositions[index];
              return scatterPositions[index];
            };
            const scatter = getScatter();

            const getFinalX = () => {
              if (typeof window !== "undefined") {
                if (window.innerWidth >= 1440) return (index - 2) * 240;
                if (window.innerWidth >= 1024) return (index - 2) * 180;
                if (window.innerWidth >= 768) return (index - 2) * 110;
                if (window.innerWidth >= 640) return (index - 2) * 85;
              }
              return (index - 2) * 65;
            };
            const finalX = getFinalX();

            const flipRevealGradient =
              packColor === "gold"
                ? "radial-gradient(circle, #FFD700 0%, transparent 60%)"
                : packColor === "blue"
                ? "radial-gradient(circle, #00D4FF 0%, transparent 60%)"
                : "radial-gradient(circle, #B794F6 0%, transparent 60%)";

            return (
              <motion.div
                key={site.id}
                initial={{ x: 0, y: 0, rotate: 0, scale: 0.3, opacity: 0 }}
                animate={
                  phase === "cards-fly"
                    ? {
                        x: scatter.x,
                        y: scatter.y,
                        rotate: scatter.rotate,
                        scale: 0.7,
                        opacity: 1,
                      }
                    : {
                        x: finalX,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        opacity: 1,
                      }
                }
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease:
                    phase === "cards-fly"
                      ? [0.34, 1.56, 0.64, 1]
                      : "easeOut",
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {phase === "flip" || phase === "complete" ? (
                  <motion.div
                    initial={{ rotateY: 180 }}
                    animate={{ rotateY: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.08,
                      ease: "easeOut",
                    }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <WebsiteCard
                      site={site}
                      variant="face-up"
                      packColor={packColor}
                    />
                    {phase === "flip" && (
                      <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.08 + 0.3,
                        }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        <div
                          className="absolute inset-0 rounded-xl"
                          style={{ background: flipRevealGradient }}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <WebsiteCard
                    site={site}
                    variant="face-down"
                    packColor={packColor}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Background ambient particles during burst */}
      {phase === "burst" &&
        [...Array(20)].map((_, i) => {
          const angle = (i * 360) / 20;
          const distance = 200 + Math.random() * 100;
          const x = Math.cos((angle * Math.PI) / 180) * distance;
          const y = Math.sin((angle * Math.PI) / 180) * distance;

          return (
            <motion.div
              key={`particle-${i}`}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x,
                y,
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: Math.random() * 0.2,
                ease: "easeOut",
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
              style={{
                background:
                  i % 2 === 0 ? getParticleColor() : "var(--accent-primary)",
              }}
            />
          );
        })}
    </div>
  );
}
