"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { updateInterests } from "./actions";
import type { Interest } from "@/types";

interface InterestGridProps {
  parents: Interest[];
  children: Interest[];
}

export function InterestGrid({ parents, children }: InterestGridProps) {
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set());
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleParent = (parentSlug: string, parentId: string) => {
    const childSlugs = children
      .filter((c) => c.parent_id === parentId)
      .map((c) => c.slug);

    setSelectedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentSlug)) {
        next.delete(parentSlug);
        // Remove all children
        setSelectedSlugs((s) => {
          const ns = new Set(s);
          childSlugs.forEach((slug) => ns.delete(slug));
          return ns;
        });
      } else {
        next.add(parentSlug);
        // Add all children
        setSelectedSlugs((s) => {
          const ns = new Set(s);
          childSlugs.forEach((slug) => ns.add(slug));
          return ns;
        });
      }
      return next;
    });
  };

  const toggleChild = (childSlug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(childSlug)) {
        next.delete(childSlug);
      } else {
        next.add(childSlug);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    await updateInterests(Array.from(selectedSlugs));
  };

  const handleSkip = async () => {
    setLoading(true);
    await updateInterests([]);
  };

  const canProceed = selectedParents.size >= 3;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          What are you into?
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Pick at least 3 categories to personalize your packs
        </p>
      </motion.div>

      {/* Interest grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
        {parents.map((parent, index) => {
          const isSelected = selectedParents.has(parent.slug);
          const isExpanded = expandedParent === parent.id;
          const parentChildren = children.filter(
            (c) => c.parent_id === parent.id
          );

          return (
            <motion.div
              key={parent.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="relative"
            >
              <button
                onClick={() => toggleParent(parent.slug, parent.id)}
                className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all"
                style={{
                  background: isSelected
                    ? "var(--accent-secondary)"
                    : "var(--bg-elevated)",
                  border: isSelected
                    ? "2px solid var(--accent-primary)"
                    : "2px solid var(--border-subtle)",
                }}
              >
                {isSelected && (
                  <div
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    <Check size={12} color="white" strokeWidth={3} />
                  </div>
                )}
                <span className="text-2xl">{parent.icon}</span>
                <span
                  className="text-[10px] md:text-xs text-center px-1 leading-tight font-medium"
                  style={{
                    color: isSelected
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {parent.name}
                </span>
              </button>

              {/* Expand button for subcategories */}
              {isSelected && parentChildren.length > 0 && (
                <button
                  onClick={() =>
                    setExpandedParent(isExpanded ? null : parent.id)
                  }
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <ChevronDown
                    size={14}
                    style={{
                      color: "var(--text-muted)",
                      transform: isExpanded ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Expanded subcategories */}
      <AnimatePresence>
        {expandedParent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p
                className="text-xs mb-3 font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Customize subcategories:
              </p>
              <div className="flex flex-wrap gap-2">
                {children
                  .filter((c) => c.parent_id === expandedParent)
                  .map((child) => {
                    const isChildSelected = selectedSlugs.has(child.slug);
                    return (
                      <button
                        key={child.id}
                        onClick={() => toggleChild(child.slug)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                        style={{
                          background: isChildSelected
                            ? "var(--accent-primary)"
                            : "var(--bg-surface)",
                          color: isChildSelected
                            ? "white"
                            : "var(--text-secondary)",
                          border: isChildSelected
                            ? "1px solid var(--accent-primary)"
                            : "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>{child.icon}</span>
                        {child.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleSubmit}
          disabled={!canProceed || loading}
          className="w-full max-w-[340px] h-[52px] rounded-xl font-semibold text-sm"
          style={{
            background: canProceed ? "var(--accent-primary)" : "var(--bg-elevated)",
            color: canProceed ? "white" : "var(--text-muted)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Setting up..."
            : canProceed
            ? "Start Discovering"
            : `Pick ${3 - selectedParents.size} more`}
        </motion.button>

        <button
          onClick={handleSkip}
          disabled={loading}
          className="text-xs underline-offset-2 hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
