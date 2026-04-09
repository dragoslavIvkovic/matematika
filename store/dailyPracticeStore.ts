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

interface DailyPracticeState {
  /** Levels the user has selected for their daily practice mix */
  selectedLevels: LevelId[];
  /** Whether the user has completed setup at least once */
  hasConfigured: boolean;

  // Actions
  setSelectedLevels: (levels: LevelId[]) => void;
}

export const useDailyPracticeStore = create<DailyPracticeState>()(
  persist(
    (set) => ({
      selectedLevels: [],
      hasConfigured: false,

      setSelectedLevels: (levels) => {
        set({ selectedLevels: levels, hasConfigured: true });
      },
    }),
    {
      name: "math-daily-practice-store",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
