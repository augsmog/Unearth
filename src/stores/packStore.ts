import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Site } from "@/types";

export type PackColor = "gold" | "blue" | "purple";
export type PackPhase = "ready" | "opening" | "selecting" | "summary" | "empty" | "rabbit_hole";

interface RabbitHoleEntry {
  site: Site;
  themeLabel: string;
  depthAvailable: number;
  category: string;
}

interface PackStore {
  sites: Site[];
  keptSiteIds: Set<string>;
  packColor: PackColor;
  phase: PackPhase;
  packsRemaining: number;
  packId: string | null;

  // Rabbit hole state
  rabbitHoleId: string | null;
  rabbitHoleDepth: number;
  rabbitHoleTheme: string | null;
  currentSite: Site | null;
  nextSite: Site | null;
  branchOptions: Site[];
  entryPoints: RabbitHoleEntry[];

  setPackColor: (color: PackColor) => void;
  startPack: (packId: string, sites: Site[], remaining?: number) => void;
  setPhase: (phase: PackPhase) => void;
  toggleKeep: (siteId: string) => boolean;
  confirmPack: () => void;
  reset: () => void;

  // Rabbit hole actions
  loadEntryPoints: (entries: RabbitHoleEntry[]) => void;
  startRabbitHole: (id: string, theme: string, currentSite: Site, nextSite: Site, branches: Site[]) => void;
  advanceChain: (nextSite: Site, newNext: Site | null, branches: Site[]) => void;
  followBranch: (branchSite: Site, newNext: Site | null, branches: Site[]) => void;
  exitRabbitHole: () => void;
}

const MAX_KEEPS = 3;

export const usePackStore = create<PackStore>()(
  persist(
    (set, get) => ({
      sites: [],
      keptSiteIds: new Set<string>(),
      packColor: "gold",
      phase: "ready",
      packsRemaining: 3,
      packId: null,

      // Rabbit hole state defaults
      rabbitHoleId: null,
      rabbitHoleDepth: 0,
      rabbitHoleTheme: null,
      currentSite: null,
      nextSite: null,
      branchOptions: [],
      entryPoints: [],

      setPackColor: (color) => set({ packColor: color }),

      startPack: (packId, sites, remaining) =>
        set({
          packId,
          sites,
          keptSiteIds: new Set(),
          phase: "opening",
          ...(remaining !== undefined ? { packsRemaining: remaining } : {}),
        }),

      setPhase: (phase) => set({ phase }),

      toggleKeep: (siteId) => {
        const { keptSiteIds } = get();
        const next = new Set(keptSiteIds);
        if (next.has(siteId)) {
          next.delete(siteId);
          set({ keptSiteIds: next });
          return false;
        }
        if (next.size >= MAX_KEEPS) return false;
        next.add(siteId);
        set({ keptSiteIds: next });
        return true;
      },

      confirmPack: () => set({ phase: "summary" }),

      reset: () =>
        set({
          packId: null,
          sites: [],
          keptSiteIds: new Set(),
          phase: "ready",
        }),

      // Rabbit hole actions
      loadEntryPoints: (entries) => set({ entryPoints: entries }),

      startRabbitHole: (id, theme, currentSite, nextSite, branches) =>
        set({
          phase: "rabbit_hole",
          rabbitHoleId: id,
          rabbitHoleTheme: theme,
          currentSite,
          nextSite,
          branchOptions: branches,
          rabbitHoleDepth: 1,
        }),

      advanceChain: (nextSite, newNext, branches) =>
        set((state) => ({
          currentSite: nextSite,
          nextSite: newNext,
          branchOptions: branches,
          rabbitHoleDepth: state.rabbitHoleDepth + 1,
        })),

      followBranch: (branchSite, newNext, branches) =>
        set((state) => ({
          currentSite: branchSite,
          nextSite: newNext,
          branchOptions: branches,
          rabbitHoleDepth: state.rabbitHoleDepth + 1,
        })),

      exitRabbitHole: () =>
        set({
          phase: "ready",
          rabbitHoleId: null,
          rabbitHoleDepth: 0,
          rabbitHoleTheme: null,
          currentSite: null,
          nextSite: null,
          branchOptions: [],
        }),
    }),
    {
      name: "unearth-pack",
      storage: createJSONStorage(() => sessionStorage, {
        replacer: (_, value) =>
          value instanceof Set ? { __set: [...value] } : value,
        reviver: (_, value) =>
          value && typeof value === "object" && "__set" in value
            ? new Set((value as { __set: string[] }).__set)
            : value,
      }),
      onRehydrateStorage: () => (state) => {
        // Clear stale "empty" phase from old pack-limit logic
        if (state?.phase === "empty") {
          state.phase = "ready";
        }
      },
    }
  )
);
