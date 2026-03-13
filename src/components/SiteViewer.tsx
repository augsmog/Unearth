"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Heart, ExternalLink, Clock, Share2 } from "lucide-react";
import type { Site } from "@/types";

interface SiteViewerProps {
  site: Site;
  isOpen: boolean;
  onClose: () => void;
  onKeep?: () => void;
  isKept?: boolean;
  keepLabel?: string;
  /** Called with engagement data when the viewer closes */
  onEngagement?: (data: EngagementData) => void;
}

export interface EngagementData {
  siteId: string;
  timeSpentMs: number;
  iframeLoaded: boolean;
  usedProxy: boolean;
}

export function SiteViewer({
  site,
  isOpen,
  onClose,
  onKeep,
  isKept,
  keepLabel = "Keep",
  onEngagement,
}: SiteViewerProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const openedAt = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when site changes
  useEffect(() => {
    setIframeLoaded(false);
    setIframeFailed(false);
    setUseProxy(false);
    setProxyFailed(false);
    setTimeSpent(0);
  }, [site.id]);

  // Track time spent
  useEffect(() => {
    if (!isOpen) return;
    openedAt.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - openedAt.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, site.id]);

  // Detect iframe blocking via timeout — if iframe hasn't loaded after 5s, try proxy
  useEffect(() => {
    if (!isOpen || iframeLoaded || iframeFailed || useProxy) return;
    const timeout = setTimeout(() => {
      if (!iframeLoaded) {
        setUseProxy(true);
        setIframeLoaded(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [isOpen, iframeLoaded, iframeFailed, useProxy, site.id]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const showFallback = iframeFailed || (useProxy && proxyFailed);

  // Report embeddability to the server when we determine it
  const reportedRef = useRef(false);
  useEffect(() => {
    if (reportedRef.current) return;
    // Report success: iframe loaded directly
    if (iframeLoaded && !useProxy) {
      reportedRef.current = true;
      fetch('/api/probe-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, result: 'embeddable' }),
      }).catch(() => {});
    }
    // Report failure: both direct and proxy failed
    if (showFallback) {
      reportedRef.current = true;
      fetch('/api/probe-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, result: 'blocked' }),
      }).catch(() => {});
    }
  }, [iframeLoaded, useProxy, showFallback, site.id]);

  const handleClose = useCallback(() => {
    // Report engagement data
    if (onEngagement) {
      onEngagement({
        siteId: site.id,
        timeSpentMs: Date.now() - openedAt.current,
        iframeLoaded: iframeLoaded,
        usedProxy: useProxy,
      });
    }
    onClose();
  }, [site.id, iframeLoaded, useProxy, onClose, onEngagement]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  const handleIframeError = useCallback(() => {
    if (!useProxy) {
      // Direct iframe failed — try proxy
      setUseProxy(true);
      setIframeLoaded(false);
    } else {
      // Proxy also failed
      setProxyFailed(true);
      setIframeFailed(true);
    }
  }, [useProxy]);

  const handleProxyIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  const handleProxyIframeError = useCallback(() => {
    setProxyFailed(true);
    setIframeFailed(true);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const iframeSrc = useProxy
    ? `/api/proxy?url=${encodeURIComponent(site.url)}`
    : site.url;

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
          {/* Unearth Branding Bar */}
          <div
            className="flex items-center justify-between px-3 sm:px-4 h-12 sm:h-14 flex-shrink-0"
            style={{
              background: "var(--bg-surface)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            {/* Left: Back button */}
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 min-w-[60px]"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Center: Site info + Unearth branding */}
            <div className="flex-1 text-center px-3 min-w-0">
              <div className="flex items-center justify-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Unearth
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  /
                </span>
                <p className="text-xs font-medium truncate max-w-[200px] sm:max-w-[400px]" style={{ color: "var(--text-primary)" }}>
                  {site.title}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <p className="text-[10px] truncate max-w-[200px]" style={{ color: "var(--text-muted)" }}>
                  {new URL(site.url).hostname}
                </p>
                {timeSpent > 0 && (
                  <>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>·</span>
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--text-muted)" }}>
                      <Clock size={8} />
                      {formatTime(timeSpent)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {onKeep && (
                <button
                  onClick={onKeep}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all"
                  style={{
                    background: isKept ? "var(--accent-primary)" : "var(--bg-elevated)",
                    color: isKept ? "white" : "var(--text-secondary)",
                    border: `1px solid ${isKept ? "var(--accent-primary)" : "var(--border-default)"}`,
                  }}
                >
                  <Heart size={13} fill={isKept ? "white" : "none"} />
                  <span className="hidden sm:inline">{isKept ? "Kept" : keepLabel}</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: site.title, url: site.url });
                  } else {
                    navigator.clipboard.writeText(site.url);
                  }
                }}
                className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
                title="Share"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>

          {/* Content area — iframe */}
          <div className="flex-1 relative overflow-hidden">
            {/* Loading state */}
            {!iframeLoaded && !showFallback && (
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
                      {useProxy ? "Loading via Unearth proxy..." : "Loading site..."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-8 h-8 border-2 rounded-full animate-spin"
                      style={{ borderColor: "var(--border-subtle)", borderTopColor: "var(--accent-primary)" }}
                    />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Loading site...
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Fallback: iframe completely failed */}
            {showFallback && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-4" style={{ background: "var(--bg-primary)" }}>
                {site.thumbnail_url && (
                  <div className="w-full max-w-3xl">
                    <img
                      src={site.thumbnail_url}
                      alt={site.title}
                      className="w-full rounded-xl shadow-2xl"
                      style={{ border: "1px solid var(--border-subtle)" }}
                    />
                  </div>
                )}
                <div className="text-center max-w-lg">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    {site.title}
                  </h3>
                  {site.description && (
                    <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                      {site.description}
                    </p>
                  )}
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                    This site can&apos;t be embedded. Opening in a new tab keeps you on Unearth — come back to continue exploring.
                  </p>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "var(--accent-primary)", color: "white" }}
                  >
                    <ExternalLink size={14} />
                    Visit {new URL(site.url).hostname}
                  </a>
                </div>
              </div>
            )}

            {/* Iframe — direct or proxied */}
            {!showFallback && (
              <iframe
                key={`${site.id}-${useProxy ? 'proxy' : 'direct'}`}
                src={iframeSrc}
                title={site.title}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={useProxy ? handleProxyIframeLoad : handleIframeLoad}
                onError={useProxy ? handleProxyIframeError : handleIframeError}
                style={{ opacity: iframeLoaded ? 1 : 0 }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
