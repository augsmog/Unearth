"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, Heart, ArrowLeft } from "lucide-react";
import type { Site } from "@/types";

interface SitePreviewModalProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
  /** If provided, shows a keep/save button */
  onKeep?: () => void;
  isKept?: boolean;
  /** Label for the keep button (e.g. "Keep" or "Save") */
  keepLabel?: string;
}

export function SitePreviewModal({
  site,
  isOpen,
  onClose,
  onKeep,
  isKept,
  keepLabel = "Keep",
}: SitePreviewModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  // Reset state when site changes
  useEffect(() => {
    setIframeLoaded(false);
    setIframeFailed(false);
  }, [site.id]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleIframeError = useCallback(() => {
    setIframeFailed(true);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col"
          style={{ background: "var(--bg-primary)" }}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-4 h-14 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex-1 text-center px-4 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {site.title}
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                {site.url}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onKeep && (
                <button
                  onClick={onKeep}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isKept ? "var(--accent-primary)" : "var(--bg-elevated)",
                    color: isKept ? "white" : "var(--text-secondary)",
                    border: `1px solid ${isKept ? "var(--accent-primary)" : "var(--border-default)"}`,
                  }}
                >
                  <Heart size={14} fill={isKept ? "white" : "none"} />
                  {isKept ? "Kept" : keepLabel}
                </button>
              )}
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">New Tab</span>
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Loading state */}
            {!iframeLoaded && !iframeFailed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10" style={{ background: "var(--bg-primary)" }}>
                {site.thumbnail_url ? (
                  <div className="w-full max-w-3xl px-4">
                    <img
                      src={site.thumbnail_url}
                      alt={site.title}
                      className="w-full rounded-xl shadow-2xl"
                      style={{ border: "1px solid var(--border-subtle)" }}
                    />
                    <p className="text-center mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
                      Loading live preview...
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-8 h-8 border-2 rounded-full animate-spin"
                      style={{ borderColor: "var(--border-subtle)", borderTopColor: "var(--accent-primary)" }}
                    />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Loading preview...
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Iframe failed fallback */}
            {iframeFailed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10" style={{ background: "var(--bg-primary)" }}>
                {site.thumbnail_url ? (
                  <div className="w-full max-w-3xl px-4">
                    <img
                      src={site.thumbnail_url}
                      alt={site.title}
                      className="w-full rounded-xl shadow-2xl"
                      style={{ border: "1px solid var(--border-subtle)" }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-full max-w-3xl aspect-video rounded-xl flex items-center justify-center mx-4"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <p style={{ color: "var(--text-muted)" }}>Preview unavailable</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    {site.description}
                  </p>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "var(--accent-primary)", color: "white" }}
                  >
                    <ExternalLink size={14} />
                    Open in New Tab
                  </a>
                </div>
              </div>
            )}

            {/* Iframe */}
            {!iframeFailed && (
              <iframe
                src={site.url}
                title={site.title}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{ opacity: iframeLoaded ? 1 : 0 }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
