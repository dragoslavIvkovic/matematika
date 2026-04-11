/**
 * analyticsStore — Background analytics tracking.
 *
 * Tracks user behavior metrics silently (no UI).
 * Structured for seamless PostHog integration:
 * just add `posthog.capture(event, properties)` inside `trackEvent`.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LevelId } from "@/utils/ProblemGenerator";
import { posthog } from "@/utils/posthog";
import { storage } from "@/utils/storage";

/** Values returned by RevenueCat `presentPaywall` (see `PAYWALL_RESULT`). */
export type RevenueCatPaywallResultCode =
  | "NOT_PRESENTED"
  | "ERROR"
  | "CANCELLED"
  | "PURCHASED"
  | "RESTORED";

/**
 * High-signal product / lifecycle events only (PostHog — no local aggregation).
 * Keeps subscription and funnel noise out of `trackEvent` level/daily counters.
 */
export type ProductAnalyticsEvent =
  | {
      event: "revenuecat_paywall";
      properties: {
        /** RC dismiss result, or why the native flow did not finish */
        rc_result:
          | RevenueCatPaywallResultCode
          | "billing_blocked"
          | "present_threw"
          | "unexpected_exception"
          | "customer_info_unresolved";
        premium_after?: boolean;
        block_reason?: "missing_env" | "native_unavailable" | "paywall_ui_load_failed" | null;
        /** True when RC paywall ran but we could not confirm entitlements afterward */
        customer_info_failed?: boolean;
      };
    }
  | {
      event: "app_opened_from_notification";
      properties: { cold_start: boolean; title?: string };
    }
  | {
      event: "subscription_upsell_tapped";
      properties: { source: string };
    }
  | {
      event: "weak_practice_started";
      properties: { task_count: number; level_count: number; levels: LevelId[] };
    }
  | {
      event: "weak_practice_completed";
      properties: { correct_count: number; total_tasks: number };
    };

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

// ─── Event Types ─────────────────────────────────────────

export type AnalyticsEventName =
  | "level_started"
  | "level_completed"
  | "level_dropped"
  | "quiz_answer_correct"
  | "quiz_answer_incorrect"
  | "daily_practice_started"
  | "daily_practice_completed"
  | "daily_practice_dropped";

export type AnalyticsEvent =
  | { event: "level_started"; properties: { levelId: LevelId } }
  | {
      event: "level_completed";
      properties: { levelId: LevelId; totalAnswers: number; correctAnswers: number };
    }
  | {
      event: "level_dropped";
      properties: { levelId: LevelId; totalAnswers: number; correctAnswers: number };
    }
  | { event: "quiz_answer_correct"; properties: { levelId: LevelId } }
  | { event: "quiz_answer_incorrect"; properties: { levelId: LevelId } }
  | { event: "daily_practice_started"; properties: { levelIds: LevelId[]; taskCount: number } }
  | {
      event: "daily_practice_completed";
      properties: { levelIds: LevelId[]; totalAnswers: number; correctAnswers: number };
    }
  | {
      event: "daily_practice_dropped";
      properties: { levelIds: LevelId[]; totalAnswers: number; correctAnswers: number };
    };

// ─── Per-Level Analytics ─────────────────────────────────

interface LevelAnalytics {
  timesStarted: number;
  timesCompleted: number;
  timesDropped: number;
  totalAnswers: number;
  correctAnswers: number;
}

// ─── State Shape ─────────────────────────────────────────

interface AnalyticsState {
  /** How many times each level has been started */
  levelStartCounts: Record<string, number>;

  /** Detailed per-level stats for completion/drop-off calculations */
  levelAnalytics: Record<string, LevelAnalytics>;

  /** How many times each specific quiz (level) has been played (full sessions) */
  quizPlayCounts: Record<string, number>;

  /** Total number of daily practice sessions initiated */
  dailyPracticeCount: number;

  /** Daily practice completion vs drop-off tracking */
  dailyPracticeCompleted: number;
  dailyPracticeDropped: number;
  dailyPracticeTotalAnswers: number;
  dailyPracticeCorrectAnswers: number;

  // ─── Derived Getters ─────────────────────────────────

  /** Start percentage for a given level relative to all level starts */
  getLevelStartPercentage: (levelId: LevelId) => number;

  /** Completion rate for a given level (completed / started * 100) */
  getLevelCompletionRate: (levelId: LevelId) => number;

  /** Drop-off rate for a given level (dropped / started * 100) */
  getLevelDropOffRate: (levelId: LevelId) => number;

  /** Average completion progress for a level (correct / total answers * 100) */
  getLevelAvgProgress: (levelId: LevelId) => number;

  /** Daily practice completion rate */
  getDailyPracticeCompletionRate: () => number;

  /** Daily practice drop-off rate */
  getDailyPracticeDropOffRate: () => number;

  // ─── Actions ─────────────────────────────────────────

  /**
   * Central event dispatcher.
   * All tracking goes through here so PostHog integration is a single addition:
   *
   *   // Future: just add this line inside trackEvent
   *   // posthog.capture(event.event, event.properties);
   */
  trackEvent: (event: AnalyticsEvent) => void;

  /** Subscription, RevenueCat, and sparse funnel events (PostHog only). */
  trackProductEvent: (event: ProductAnalyticsEvent) => void;

  /** Reset all analytics data */
  resetAnalytics: () => void;
}

// ─── Defaults ────────────────────────────────────────────

const DEFAULT_LEVEL_ANALYTICS: LevelAnalytics = {
  timesStarted: 0,
  timesCompleted: 0,
  timesDropped: 0,
  totalAnswers: 0,
  correctAnswers: 0,
};

const DEFAULT_STATE = {
  levelStartCounts: {} as Record<string, number>,
  levelAnalytics: {} as Record<string, LevelAnalytics>,
  quizPlayCounts: {} as Record<string, number>,
  dailyPracticeCount: 0,
  dailyPracticeCompleted: 0,
  dailyPracticeDropped: 0,
  dailyPracticeTotalAnswers: 0,
  dailyPracticeCorrectAnswers: 0,
};

// ─── Helpers ─────────────────────────────────────────────

function ensureLevelAnalytics(
  analytics: Record<string, LevelAnalytics>,
  levelId: string,
): LevelAnalytics {
  if (!analytics[levelId]) {
    analytics[levelId] = { ...DEFAULT_LEVEL_ANALYTICS };
  }
  return analytics[levelId];
}

function safePercent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100; // 2 decimal places
}

// ─── Store ───────────────────────────────────────────────

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      // ── Derived Getters ──────────────────────────────

      getLevelStartPercentage: (levelId: LevelId) => {
        const state = get();
        const totalStarts = Object.values(state.levelStartCounts).reduce((s, c) => s + c, 0);
        const levelStarts = state.levelStartCounts[levelId] ?? 0;
        return safePercent(levelStarts, totalStarts);
      },

      getLevelCompletionRate: (levelId: LevelId) => {
        const la = get().levelAnalytics[levelId];
        if (!la) return 0;
        return safePercent(la.timesCompleted, la.timesStarted);
      },

      getLevelDropOffRate: (levelId: LevelId) => {
        const la = get().levelAnalytics[levelId];
        if (!la) return 0;
        return safePercent(la.timesDropped, la.timesStarted);
      },

      getLevelAvgProgress: (levelId: LevelId) => {
        const la = get().levelAnalytics[levelId];
        if (!la) return 0;
        return safePercent(la.correctAnswers, la.totalAnswers);
      },

      getDailyPracticeCompletionRate: () => {
        const s = get();
        const totalSessions = s.dailyPracticeCompleted + s.dailyPracticeDropped;
        return safePercent(s.dailyPracticeCompleted, totalSessions);
      },

      getDailyPracticeDropOffRate: () => {
        const s = get();
        const totalSessions = s.dailyPracticeCompleted + s.dailyPracticeDropped;
        return safePercent(s.dailyPracticeDropped, totalSessions);
      },

      // ── Central Event Dispatcher ─────────────────────

      trackProductEvent: (event: ProductAnalyticsEvent) => {
        posthog.capture(event.event, event.properties);
      },

      trackEvent: (event: AnalyticsEvent) => {
        posthog.capture(event.event, event.properties);

        set((state) => {
          switch (event.event) {
            case "level_started": {
              const { levelId } = event.properties;
              const levelStartCounts = { ...state.levelStartCounts };
              levelStartCounts[levelId] = (levelStartCounts[levelId] ?? 0) + 1;

              const levelAnalytics = { ...state.levelAnalytics };
              const la = { ...ensureLevelAnalytics(levelAnalytics, levelId) };
              la.timesStarted++;
              levelAnalytics[levelId] = la;

              const quizPlayCounts = { ...state.quizPlayCounts };
              quizPlayCounts[levelId] = (quizPlayCounts[levelId] ?? 0) + 1;

              return { levelStartCounts, levelAnalytics, quizPlayCounts };
            }

            case "level_completed": {
              const { levelId, totalAnswers, correctAnswers } = event.properties;
              const levelAnalytics = { ...state.levelAnalytics };
              const la = { ...ensureLevelAnalytics(levelAnalytics, levelId) };
              la.timesCompleted++;
              la.totalAnswers += totalAnswers;
              la.correctAnswers += correctAnswers;
              levelAnalytics[levelId] = la;
              return { levelAnalytics };
            }

            case "level_dropped": {
              const { levelId, totalAnswers, correctAnswers } = event.properties;
              const levelAnalytics = { ...state.levelAnalytics };
              const la = { ...ensureLevelAnalytics(levelAnalytics, levelId) };
              la.timesDropped++;
              la.totalAnswers += totalAnswers;
              la.correctAnswers += correctAnswers;
              levelAnalytics[levelId] = la;
              return { levelAnalytics };
            }

            case "quiz_answer_correct": {
              const { levelId } = event.properties;
              const levelAnalytics = { ...state.levelAnalytics };
              const la = { ...ensureLevelAnalytics(levelAnalytics, levelId) };
              la.totalAnswers++;
              la.correctAnswers++;
              levelAnalytics[levelId] = la;
              return { levelAnalytics };
            }

            case "quiz_answer_incorrect": {
              const { levelId } = event.properties;
              const levelAnalytics = { ...state.levelAnalytics };
              const la = { ...ensureLevelAnalytics(levelAnalytics, levelId) };
              la.totalAnswers++;
              levelAnalytics[levelId] = la;
              return { levelAnalytics };
            }

            case "daily_practice_started": {
              return {
                dailyPracticeCount: state.dailyPracticeCount + 1,
              };
            }

            case "daily_practice_completed": {
              const { totalAnswers, correctAnswers } = event.properties;
              return {
                dailyPracticeCompleted: state.dailyPracticeCompleted + 1,
                dailyPracticeTotalAnswers: state.dailyPracticeTotalAnswers + totalAnswers,
                dailyPracticeCorrectAnswers: state.dailyPracticeCorrectAnswers + correctAnswers,
              };
            }

            case "daily_practice_dropped": {
              const { totalAnswers, correctAnswers } = event.properties;
              return {
                dailyPracticeDropped: state.dailyPracticeDropped + 1,
                dailyPracticeTotalAnswers: state.dailyPracticeTotalAnswers + totalAnswers,
                dailyPracticeCorrectAnswers: state.dailyPracticeCorrectAnswers + correctAnswers,
              };
            }

            default:
              return {};
          }
        });
      },

      resetAnalytics: () => {
        set({ ...DEFAULT_STATE });
      },
    }),
    {
      name: "math-analytics-store",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        levelStartCounts: state.levelStartCounts,
        levelAnalytics: state.levelAnalytics,
        quizPlayCounts: state.quizPlayCounts,
        dailyPracticeCount: state.dailyPracticeCount,
        dailyPracticeCompleted: state.dailyPracticeCompleted,
        dailyPracticeDropped: state.dailyPracticeDropped,
        dailyPracticeTotalAnswers: state.dailyPracticeTotalAnswers,
        dailyPracticeCorrectAnswers: state.dailyPracticeCorrectAnswers,
      }),
    },
  ),
);
