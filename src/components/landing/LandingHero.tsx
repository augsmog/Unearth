"use client";

import { motion } from "motion/react";
import { Compass } from "lucide-react";
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="pt-28 pb-16 px-6 min-h-screen flex flex-col items-center justify-center">
      {/* Decorative pack visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-10"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-[200px] h-[280px] rounded-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #2A1810 0%, #1a1f3a 50%, #0a0e27 100%)",
            border: "3px solid rgba(255, 215, 0, 0.4)",
            boxShadow:
              "0 0 80px rgba(255, 215, 0, 0.2) inset, 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.15)",
          }}
        >
          {/* Corner decorations */}
          <div
            className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 opacity-30"
            style={{ borderColor: "#FFD700" }}
          />
          <div
            className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 opacity-30"
            style={{ borderColor: "#FFD700" }}
          />
          <div
            className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 opacity-30"
            style={{ borderColor: "#FFD700" }}
          />
          <div
            className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 opacity-30"
            style={{ borderColor: "#FFD700" }}
          />

          {/* Center emblem */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute w-24 h-24 rounded-full border-2 opacity-30"
              style={{ borderColor: "#FFD700", borderStyle: "dashed" }}
            />
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center relative"
              style={{
                background:
                  "radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)",
              }}
            >
              <Compass
                size={40}
                style={{ color: "#FFD700" }}
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Title badge */}
          <div className="absolute top-4 left-0 right-0 text-center">
            <div
              className="inline-block px-4 py-1.5 rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.05) 100%)",
                border: "1px solid rgba(255, 215, 0, 0.4)",
              }}
            >
              <p
                className="text-sm font-bold tracking-widest uppercase"
                style={{
                  color: "#FFD700",
                  textShadow: "0 0 10px rgba(255, 215, 0, 0.3)",
                }}
              >
                UNEARTHED
              </p>
            </div>
          </div>

          {/* Bottom text */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div
              className="inline-block px-3 py-1 rounded-lg"
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 215, 0, 0.4)",
              }}
            >
              <p
                className="text-xs tracking-wide uppercase"
                style={{ color: "#FFD700" }}
              >
                5 Sites
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center max-w-2xl"
      >
        <h1
          className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Unearth the internet
        </h1>
        <p
          className="text-lg md:text-xl mb-8 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Open packs of curated website cards. Keep your favorites. Build
          collections of the best corners of the web.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 rounded-xl text-lg font-bold"
          style={{
            background: "var(--accent-primary)",
            color: "white",
            boxShadow:
              "0 8px 32px rgba(233, 69, 96, 0.5), 0 0 20px rgba(233, 69, 96, 0.3)",
          }}
        >
          Start Exploring
        </Link>
      </motion.div>
    </section>
  );
}
