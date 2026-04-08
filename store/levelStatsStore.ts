import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LevelId } from "@/utils/ProblemGenerator";
import { storage } from "@/utils/storage";

const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

export interface PerLevelStats {
  solved: number;
  errors: number;
  bestStreak: number;
}

interface LevelStatsState {
  currentLevel: LevelId;
  streak: number;
  completedLevels: string[];
  totalSolved: number;
  totalErrors: number;
  levelStats: Record<string, PerLevelStats>;
  activeDays: string[];

  // Actions
  syncFromManager: (data: {
    currentLevel: LevelId;
    streak: number;
    completedLevels: string[];
    totalSolved: number;
    totalErrors: number;
    levelStats: Record<string, PerLevelStats>;
    activeDays: string[];
  }) => void;
  resetStats: () => void;
}

const DEFAULT: Pick<
  LevelStatsState,
  | "currentLevel"
  | "streak"
  | "completedLevels"
  | "totalSolved"
  | "totalErrors"
  | "levelStats"
  | "activeDays"
> = {
  currentLevel: "1.1",
  streak: 0,
  completedLevels: [],
  totalSolved: 0,
  totalErrors: 0,
  levelStats: {},
  activeDays: [],
};

export const useLevelStatsStore = create<LevelStatsState>()(
  persist(
    (set) => ({
      ...DEFAULT,

      syncFromManager: (data) => {
        set({
          currentLevel: data.currentLevel,
          streak: data.streak,
          completedLevels: [...data.completedLevels],
          totalSolved: data.totalSolved,
          totalErrors: data.totalErrors,
          levelStats: { ...data.levelStats },
          activeDays: [...data.activeDays],
        });
      },

      resetStats: () => {
        set({ ...DEFAULT });
      },
    }),
    {
      name: "math-level-stats-store",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
