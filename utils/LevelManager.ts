/**
 * LevelManager — Manages level progression, streak tracking, and error-based fallback.
 *
 * Error logic (controlled by AppConfig):
 * - Until ERRORS_BEFORE_FALLBACK consecutive mistakes → retry + procedure
 * - At ERRORS_BEFORE_FALLBACK consecutive mistakes → theory (learning), not "Try again"
 * - After ERRORS_BEFORE_LEVEL_DROP total mistakes on the level → one step down in LEVEL_CONFIGS (1.1 has no down)
 *
 * All thresholds are in utils/AppConfig.ts — change there, applies everywhere.
 */

import { APP_CONFIG } from "./AppConfig";
import { getLocalDateString } from "./dateUtils";
import { getLevelConfig, LEVEL_CONFIGS, type LevelId } from "./ProblemGenerator";
import { AppStorage } from "./storage";

const STORAGE_KEY = "math_tutor_level_state_v3";

export interface LevelState {
  currentLevel: LevelId;
  streak: number;
  operationCounts: Record<string, number>;
  consecutiveErrors: number; // errors in a row without a correct answer
  levelErrorCount: number; // total errors on current level (resets on level change)
  completedLevels: string[];
  totalSolved: number;
  totalErrors: number;
  levelStats: Record<string, { solved: number; errors: number; bestStreak: number }>;
  theoryShownForLevel: string[];
  needsTheory: boolean;
  activeDays: string[]; // Local calendar days (YYYY-MM-DD)
}

const DEFAULT_STATE: LevelState = {
  currentLevel: "1.1",
  streak: 0,
  operationCounts: {},
  consecutiveErrors: 0,
  levelErrorCount: 0,
  completedLevels: [],
  totalSolved: 0,
  totalErrors: 0,
  levelStats: {},
  theoryShownForLevel: [],
  needsTheory: false,
  activeDays: [],
};

/** Previous level in the app roadmap; null for 1.1 (lowest). */
function getLevelBelow(level: LevelId): LevelId | null {
  const idx = LEVEL_CONFIGS.findIndex((l) => l.id === level);
  if (idx <= 0) return null;
  return LEVEL_CONFIGS[idx - 1].id;
}

export interface ErrorAction {
  type: "show_theory" | "fallback_level" | "retry";
  targetLevel?: LevelId;
  message: string;
  errorCount: number; // consecutive (theory) or level total (modal display)
  threshold: number; // how many needed before action
}

export type LevelManager = {
  save(): void;
  getState(): Readonly<LevelState>;
  getCurrentLevel(): LevelId;
  setCurrentLevel(level: LevelId): void;
  markTheoryShown(): void;
  needsTheoryDisplay(): boolean;
  recordCorrect(operationType: string): {
    levelComplete: boolean;
    newLevel?: LevelId;
  };
  recordError(failedAtStep: number): ErrorAction;
  getNextOperationType(): string;
  isLevelUnlocked(_levelId: string): boolean;
  isLevelCompleted(levelId: string): boolean;
  reset(): void;
  getStreakProgress(): { current: number; required: number; percent: number };
};

export const createLevelManager = (initialState?: LevelState): LevelManager => {
  let state: LevelState = initialState ? { ...initialState } : { ...DEFAULT_STATE };

  const manager: LevelManager = {
    save() {
      try {
        AppStorage.setObject(STORAGE_KEY, state);
      } catch (e) {
        console.warn("Failed to save level state:", e);
      }
    },
    getState(): Readonly<LevelState> {
      return { ...state };
    },
    getCurrentLevel(): LevelId {
      return state.currentLevel;
    },
    setCurrentLevel(level: LevelId): void {
      state.currentLevel = level;
      state.streak = 0;
      state.operationCounts = {};
      state.consecutiveErrors = 0;
      state.levelErrorCount = 0;
      const config = getLevelConfig(level);
      if (config.hasTheory && !state.theoryShownForLevel.includes(level)) {
        state.needsTheory = true;
      }
    },
    markTheoryShown(): void {
      const level = state.currentLevel;
      if (!state.theoryShownForLevel.includes(level)) {
        state.theoryShownForLevel.push(level);
      }
      state.needsTheory = false;
    },
    needsTheoryDisplay(): boolean {
      return state.needsTheory;
    },
    recordCorrect(operationType: string) {
      const config = getLevelConfig(state.currentLevel);

      state.streak++;
      state.operationCounts[operationType] = (state.operationCounts[operationType] || 0) + 1;
      state.totalSolved++;
      state.consecutiveErrors = 0;

      const today = getLocalDateString();
      if (!state.activeDays.includes(today)) {
        state.activeDays.push(today);
      }

      const levelKey = state.currentLevel;
      if (!state.levelStats[levelKey]) {
        state.levelStats[levelKey] = { solved: 0, errors: 0, bestStreak: 0 };
      }
      state.levelStats[levelKey].solved++;
      if (state.streak > state.levelStats[levelKey].bestStreak) {
        state.levelStats[levelKey].bestStreak = state.streak;
      }

      let allOpsMet = true;
      for (const op of config.operations) {
        if ((state.operationCounts[op] || 0) < config.operationsPerType) {
          allOpsMet = false;
          break;
        }
      }

      if (state.streak >= config.requiredStreak && allOpsMet) {
        if (!state.completedLevels.includes(state.currentLevel)) {
          state.completedLevels.push(state.currentLevel);
        }

        const currentIdx = LEVEL_CONFIGS.findIndex((l) => l.id === state.currentLevel);
        if (currentIdx < LEVEL_CONFIGS.length - 1) {
          const nextLevel = LEVEL_CONFIGS[currentIdx + 1].id;
          state.currentLevel = nextLevel;
          state.streak = 0;
          state.operationCounts = {};
          state.consecutiveErrors = 0;
          state.levelErrorCount = 0;

          const nextConfig = getLevelConfig(nextLevel);
          if (nextConfig.hasTheory && !state.theoryShownForLevel.includes(nextLevel)) {
            state.needsTheory = true;
          }

          return { levelComplete: true, newLevel: nextLevel };
        }

        return { levelComplete: true };
      }

      return { levelComplete: false };
    },
    recordError(_failedAtStep: number): ErrorAction {
      const level = state.currentLevel;
      const threshold = APP_CONFIG.ERRORS_BEFORE_FALLBACK;
      const dropThreshold = APP_CONFIG.ERRORS_BEFORE_LEVEL_DROP;

      state.totalErrors++;
      state.consecutiveErrors++;
      state.levelErrorCount++;

      if (!state.levelStats[level]) {
        state.levelStats[level] = { solved: 0, errors: 0, bestStreak: 0 };
      }
      state.levelStats[level].errors++;

      state.streak = 0;
      state.operationCounts = {};

      const errCount = state.consecutiveErrors;

      // First: consecutive mistakes → theory (learning), including 1.1 and 1.2
      if (errCount >= threshold) {
        state.needsTheory = true;
        state.consecutiveErrors = 0;
        return {
          type: "show_theory",
          message: `You missed ${errCount} in a row. Let’s review the theory to reinforce the basics.`,
          errorCount: errCount,
          threshold,
        };
      }

      // Posle N ukupnih grešaka → nivo odmah ispod u listi (1.6 → 1.5, 1.4 → 1.3, …)
      if (state.levelErrorCount >= dropThreshold) {
        const targetLevel = getLevelBelow(level);
        if (targetLevel) {
          state.currentLevel = targetLevel;
          state.streak = 0;
          state.operationCounts = {};
          state.consecutiveErrors = 0;
          state.levelErrorCount = 0;
          const targetConfig = getLevelConfig(targetLevel);
          return {
            type: "fallback_level",
            targetLevel,
            message: `You need a bit more practice. Moving to level ${targetLevel}: ${targetConfig.name}`,
            errorCount: errCount,
            threshold,
          };
        }
      }

      return {
        type: "retry",
        message: `Error ${state.levelErrorCount}/${threshold}. One more try!`,
        errorCount: state.levelErrorCount,
        threshold,
      };
    },
    getNextOperationType(): string {
      const config = getLevelConfig(state.currentLevel);
      let minCount = Infinity;
      let chosenOp = config.operations[0];
      for (const op of config.operations) {
        const count = state.operationCounts[op] || 0;
        if (count < minCount) {
          minCount = count;
          chosenOp = op;
        }
      }
      return chosenOp;
    },
    isLevelUnlocked(_levelId: string): boolean {
      if (APP_CONFIG.ALL_LEVELS_UNLOCKED) return true;
      if (_levelId === "1.1") return true;
      const idx = LEVEL_CONFIGS.findIndex((l) => l.id === _levelId);
      if (idx <= 0) return true;
      const prevLevel = LEVEL_CONFIGS[idx - 1].id;
      return state.completedLevels.includes(prevLevel);
    },
    isLevelCompleted(levelId: string): boolean {
      return state.completedLevels.includes(levelId);
    },
    reset(): void {
      state = { ...DEFAULT_STATE };
      manager.save();
    },
    getStreakProgress() {
      const config = getLevelConfig(state.currentLevel);
      return {
        current: state.streak,
        required: config.requiredStreak,
        percent: Math.min(100, (state.streak / config.requiredStreak) * 100),
      };
    },
  };

  return manager;
};

export const LevelManager = {
  load(): LevelManager {
    try {
      const parsed = AppStorage.getObject<LevelState>(STORAGE_KEY);
      if (parsed) {
        if (parsed.consecutiveErrors === undefined) parsed.consecutiveErrors = 0;
        if (parsed.levelErrorCount === undefined) parsed.levelErrorCount = 0;
        if (parsed.activeDays === undefined) parsed.activeDays = [];
        return createLevelManager(parsed);
      }
    } catch (e) {
      console.warn("Failed to load level state:", e);
    }
    return createLevelManager();
  },
};
