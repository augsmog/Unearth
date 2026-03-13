"use client";

import { useState } from "react";
import Image from "next/image";
import { SiteViewer } from "@/components/SiteViewer";
import type { Site } from "@/types";

interface PublicSite {
  id: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  categories: string[];
}

interface PublicBoardGridProps {
  sites: PublicSite[];
}

export function PublicBoardGrid({ sites }: PublicBoardGridProps) {
  const [previewSite, setPreviewSite] = useState<PublicSite | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => (
          <button
            key={site.id}
            type="button"
            onClick={() => setPreviewSite(site)}
            className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02] text-left cursor-pointer"
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
            </div>
          </button>
        ))}
      </div>

      {/* Embedded Site Viewer */}
      {previewSite && (
        <SiteViewer
          site={previewSite as Site}
          isOpen={!!previewSite}
          onClose={() => setPreviewSite(null)}
        />
      )}
    </>
  );
}
