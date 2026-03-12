"use client";

import { useEffect, useCallback, useState } from "react";
import { usePackStore } from "@/stores/packStore";
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth";
import {
  generatePack,
  keepCards,
  fetchEntryPoints,
  startRabbitHoleAction,
  advanceRabbitHoleAction,
  branchRabbitHoleAction,
  saveFromRabbitHole,
  endRabbitHoleAction,
} from "./actions";
import { PackReadyView } from "./views/PackReadyView";
import { PackOpeningView } from "./views/PackOpeningView";
import { CardSelectionView } from "./views/CardSelectionView";
import { PostPackSummaryView } from "./views/PostPackSummaryView";
import { RabbitHoleReadyView } from "@/components/rabbit-hole/RabbitHoleReadyView";
import { RabbitHoleView } from "@/components/rabbit-hole/RabbitHoleView";
import { RabbitHoleSummary } from "@/components/rabbit-hole/RabbitHoleSummary";
import Link from "next/link";

interface PackContainerProps {
  userId: string;
  interests: string[];
  streak: number;
  isAnonymous?: boolean;
}

export function PackContainer({ userId: serverUserId, interests, streak, isAnonymous: serverAnonymous }: PackContainerProps) {
  // If server didn't have a user, the client-side hook signs in anonymously
  const { userId: clientUserId, isAnonymous: clientAnonymous, isLoading } = useAnonymousAuth();
  const userId = serverUserId || clientUserId || "";
  const isAnonymous = serverAnonymous ?? clientAnonymous;

  const {
    phase,
    sites,
    keptSiteIds,
    packId,
    setPhase,
    startPack,
    reset,
    entryPoints,
    loadEntryPoints,
    startRabbitHole,
    advanceChain,
    followBranch,
    exitRabbitHole,
    rabbitHoleId,
    rabbitHoleDepth,
    rabbitHoleTheme,
    currentSite,
    nextSite,
    branchOptions,
  } = usePackStore();

  const [suggestReset, setSuggestReset] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryStats, setSummaryStats] = useState({ theme: "", depth: 0 });

  // Load entry points when in ready phase (only if we have a userId)
  useEffect(() => {
    if (phase !== "ready" || !userId) return;
    let cancelled = false;

    async function loadEntries() {
      try {
        const entries = await fetchEntryPoints();
        if (!cancelled) {
          loadEntryPoints(entries);
        }
      } catch (err) {
        console.error("Failed to load entry points:", err);
      }
    }

    loadEntries();
    return () => { cancelled = true; };
  }, [phase, loadEntryPoints, userId]);

  const [error, setError] = useState<string | null>(null);

  const handleOpenPack = useCallback(async () => {
    setError(null);
    try {
      const result = await generatePack();
      if (result.pack && result.sites.length > 0) {
        startPack(result.pack.id, result.sites);
      } else {
        setError("No sites available right now. Try again in a moment.");
      }
    } catch (err) {
      console.error("Failed to generate pack:", err);
      setError("Something went wrong. Please try again.");
    }
  }, [startPack]);

  const handleConfirmKeep = useCallback(async () => {
    if (!packId) return;
    try {
      await keepCards(packId, Array.from(keptSiteIds));
      usePackStore.getState().confirmPack();
    } catch (error) {
      console.error("Failed to keep cards:", error);
    }
  }, [packId, keptSiteIds]);

  const handleOpenAnother = useCallback(() => {
    reset();
  }, [reset]);

  // Rabbit hole handlers
  const handleStartRabbitHole = useCallback(async (entrySiteId: string, category: string) => {
    try {
      const result = await startRabbitHoleAction(entrySiteId, category);
      if (result.currentSite && result.nextSite) {
        startRabbitHole(
          result.rabbitHoleId,
          result.theme,
          result.currentSite,
          result.nextSite,
          result.branches
        );
      }
    } catch (error) {
      console.error("Failed to start rabbit hole:", error);
    }
  }, [startRabbitHole]);

  const handleAdvance = useCallback(async () => {
    if (!rabbitHoleId || !nextSite) return;
    try {
      const result = await advanceRabbitHoleAction(rabbitHoleId, nextSite.id);
      advanceChain(nextSite, result.nextSite, result.branches);
      setSuggestReset(result.suggestReset);
    } catch (error) {
      console.error("Failed to advance rabbit hole:", error);
    }
  }, [rabbitHoleId, nextSite, advanceChain]);

  const handleBranch = useCallback(async (branchSiteId: string) => {
    if (!rabbitHoleId || !currentSite) return;
    try {
      const branchSite = branchOptions.find(b => b.id === branchSiteId);
      if (!branchSite) return;

      const result = await branchRabbitHoleAction(rabbitHoleId, currentSite.id, branchSiteId);
      followBranch(branchSite, result.nextSite, result.branches);
    } catch (error) {
      console.error("Failed to branch rabbit hole:", error);
    }
  }, [rabbitHoleId, currentSite, branchOptions, followBranch]);

  const handleSaveFromRabbitHole = useCallback(async (siteId: string) => {
    if (isAnonymous) return; // Anonymous users can't save to boards
    try {
      await saveFromRabbitHole(siteId);
    } catch (error) {
      console.error("Failed to save site:", error);
    }
  }, [isAnonymous]);

  const handleEndRabbitHole = useCallback(async () => {
    if (!rabbitHoleId) return;
    try {
      await endRabbitHoleAction(rabbitHoleId);
      setSummaryStats({ theme: rabbitHoleTheme ?? "", depth: rabbitHoleDepth });
      setShowSummary(true);
      exitRabbitHole();
    } catch (error) {
      console.error("Failed to end rabbit hole:", error);
    }
  }, [rabbitHoleId, rabbitHoleTheme, rabbitHoleDepth, exitRabbitHole]);

  const handleOpenPackFromRabbitHole = useCallback(async () => {
    if (rabbitHoleId) {
      try {
        await endRabbitHoleAction(rabbitHoleId);
      } catch (error) {
        console.error("Failed to end rabbit hole:", error);
      }
    }
    exitRabbitHole();
    setShowSummary(false);
  }, [rabbitHoleId, exitRabbitHole]);

  const handleDiveDeeper = useCallback(async (siteId: string, category: string) => {
    await handleStartRabbitHole(siteId, category);
  }, [handleStartRabbitHole]);

  // Loading state while anonymous auth initializes
  if (isLoading && !serverUserId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--border-subtle)", borderTopColor: "var(--accent-primary)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Preparing your exploration...
          </p>
        </div>
      </div>
    );
  }

  // Show summary after ending a rabbit hole
  if (showSummary) {
    return (
      <div>
        <RabbitHoleSummary
          theme={summaryStats.theme}
          depth={summaryStats.depth}
          sitesVisited={summaryStats.depth}
          onStartNew={() => {
            setShowSummary(false);
          }}
          onOpenPack={() => {
            setShowSummary(false);
            handleOpenPack();
          }}
        />
        {isAnonymous && <SignUpBanner />}
      </div>
    );
  }

  switch (phase) {
    case "ready":
      return (
        <div>
          <PackReadyView
            streak={streak}
            onOpenPack={handleOpenPack}
            interests={interests}
          />
          {error && (
            <div className="mx-4 mt-4 p-3 rounded-lg text-center text-sm" style={{ background: "rgba(233, 69, 96, 0.15)", color: "var(--accent-primary)" }}>
              {error}
            </div>
          )}
          <RabbitHoleReadyView
            entries={entryPoints}
            onStartRabbitHole={handleStartRabbitHole}
          />
          {isAnonymous && <SignUpBanner />}
        </div>
      );

    case "opening":
      return (
        <PackOpeningView
          sites={sites}
          onAnimationComplete={() => setPhase("selecting")}
        />
      );

    case "selecting":
      return (
        <CardSelectionView
          sites={sites}
          onConfirm={handleConfirmKeep}
        />
      );

    case "summary":
      return (
        <div>
          <PostPackSummaryView
            keptSites={sites.filter((s) => keptSiteIds.has(s.id))}
            streak={streak}
            onOpenAnother={handleOpenAnother}
            onDiveDeeper={isAnonymous ? undefined : handleDiveDeeper}
          />
          {isAnonymous && <SignUpBanner />}
        </div>
      );

    case "rabbit_hole":
      if (!currentSite) return null;
      return (
        <div>
          <RabbitHoleView
            currentSite={currentSite}
            nextSite={nextSite}
            branches={branchOptions}
            depth={rabbitHoleDepth}
            theme={rabbitHoleTheme ?? ""}
            suggestReset={suggestReset}
            onAdvance={handleAdvance}
            onBranch={handleBranch}
            onSave={isAnonymous ? undefined : handleSaveFromRabbitHole}
            onOpenPack={handleOpenPackFromRabbitHole}
            onEnd={handleEndRabbitHole}
          />
        </div>
      );

    default:
      return null;
  }
}

function SignUpBanner() {
  return (
    <div
      className="mx-4 mt-6 p-4 rounded-xl text-center"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
        Sign up to save sites to boards, track your streak, and get personalized recommendations.
      </p>
      <Link
        href="/signup"
        className="inline-block px-6 py-2 rounded-lg text-sm font-semibold"
        style={{ background: "var(--accent-primary)", color: "white" }}
      >
        Create Free Account
      </Link>
    </div>
  );
}
