"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Share2, ArrowLeft, Globe, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Masonry from "react-responsive-masonry";
import { SiteViewer } from "@/components/SiteViewer";
import type { EngagementData } from "@/components/SiteViewer";
import { trackSiteEngagement } from "@/app/(app)/discover/actions";
import type { Site, Board } from "@/types";

interface BoardViewProps {
  board: Board;
  sites: Site[];
}

export function BoardView({ board, sites }: BoardViewProps) {
  const [previewSite, setPreviewSite] = useState<Site | null>(null);

  const handleShare = async () => {
    if (board.is_public) {
      await navigator.clipboard.writeText(
        `${window.location.origin}/b/${board.slug}`
      );
      alert("Link copied!");
    }
  };

  const handleEngagement = useCallback((data: EngagementData) => {
    trackSiteEngagement(data);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/boards">
            <ArrowLeft size={20} style={{ color: "var(--text-secondary)" }} />
          </Link>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {board.name}
            </h1>
            {board.description && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {board.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {board.is_public ? (
            <Globe size={16} style={{ color: "var(--text-muted)" }} />
          ) : (
            <Lock size={16} style={{ color: "var(--text-muted)" }} />
          )}
          {board.is_public && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Share2 size={14} />
              Share
            </button>
          )}
        </div>
      </div>

      {/* Sites masonry grid */}
      {sites.length > 0 ? (
        <Masonry columnsCount={3} gutter="16px">
          {sites.map((site, index) => (
            <motion.button
              key={site.id}
              type="button"
              onClick={() => setPreviewSite(site)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="block w-full rounded-xl overflow-hidden transition-transform hover:scale-[1.02] text-left cursor-pointer"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {site.thumbnail_url && (
                <div className="relative aspect-video">
                  <Image
                    src={site.thumbnail_url}
                    alt={site.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              <div className="p-3">
                <h3
                  className="text-sm font-semibold line-clamp-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {site.title}
                </h3>
                {site.description && (
                  <p
                    className="text-xs mt-1 line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {site.description}
                  </p>
                )}
                {site.categories && site.categories.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {site.categories.slice(0, 2).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-full text-[10px]"
                        style={{
                          background: "var(--bg-surface)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </Masonry>
      ) : (
        <div className="text-center py-16">
          <p
            className="text-lg mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            This board is empty
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Open a pack to start discovering sites!
          </p>
          <Link
            href="/discover"
            className="inline-block mt-4 px-6 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--accent-primary)", color: "white" }}
          >
            Open a Pack
          </Link>
        </div>
      )}

      {/* Embedded Site Viewer */}
      {previewSite && (
        <SiteViewer
          site={previewSite}
          isOpen={!!previewSite}
          onClose={() => setPreviewSite(null)}
          onEngagement={handleEngagement}
        />
      )}
    </div>
  );
}
