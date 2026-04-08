/**
 * errorStore — Tracks per-level error counts to identify weak areas.
 *
 * Groups errors by LevelId (not individual equations).
 * Provides a getter for weak levels and a function to decrement
 * errors when the user successfully answers in weak-areas practice.
 */

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

interface ErrorStoreState {
  /** Cumulative error count per level */
  errorsByLevel: Record<string, number>;

  // ── Actions ──

  /** Record an incorrect answer for a level */
  recordError: (levelId: LevelId) => void;

  /** Reduce error count for a level (e.g. after a correct weak-area answer) */
  reduceError: (levelId: LevelId) => void;

  /** Get all levels that have at least 1 recorded error, sorted by most errors first */
  getWeakLevels: () => LevelId[];

  /** Whether there is at least one recorded error across all levels */
  hasErrors: () => boolean;

  /** Total error count across all levels */
  getTotalErrors: () => number;

  /** Reset all error data */
  resetErrors: () => void;
}

export const useErrorStore = create<ErrorStoreState>()(
  persist(
    (set, get) => ({
      errorsByLevel: {},

      recordError: (levelId) => {
        set((state) => {
          const errorsByLevel = { ...state.errorsByLevel };
          errorsByLevel[levelId] = (errorsByLevel[levelId] ?? 0) + 1;
          return { errorsByLevel };
        });
      },

      reduceError: (levelId) => {
        set((state) => {
          const errorsByLevel = { ...state.errorsByLevel };
          const current = errorsByLevel[levelId] ?? 0;
          if (current <= 1) {
            delete errorsByLevel[levelId];
          } else {
            errorsByLevel[levelId] = current - 1;
          }
          return { errorsByLevel };
        });
      },

      getWeakLevels: () => {
        const { errorsByLevel } = get();
        return (Object.entries(errorsByLevel) as [LevelId, number][])
          .filter(([, count]) => count > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([levelId]) => levelId);
      },

      hasErrors: () => {
        const { errorsByLevel } = get();
        return Object.values(errorsByLevel).some((c) => c > 0);
      },

      getTotalErrors: () => {
        const { errorsByLevel } = get();
        return Object.values(errorsByLevel).reduce((sum, c) => sum + c, 0);
      },

      resetErrors: () => {
        set({ errorsByLevel: {} });
      },
    }),
    {
      name: "math-error-store",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        errorsByLevel: state.errorsByLevel,
      }),
    },
  ),
);
