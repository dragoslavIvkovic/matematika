/**
 * LevelManager — Manages level progression, streak tracking, and error-based fallback.
 *
 * Error logic (controlled by AppConfig.ERRORS_BEFORE_FALLBACK):
 * - 1st error on equation level → just retry, show correct procedure
 * - 2nd error (reaches ERRORS_BEFORE_FALLBACK) → show theory
 * - After ERRORS_BEFORE_LEVEL_DROP total errors on level → cascade to lower level
 *
 * All thresholds are in utils/AppConfig.ts — change there, applies everywhere.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LevelId, getLevelConfig, LEVEL_CONFIGS } from "./ProblemGenerator";
import { APP_CONFIG } from "./AppConfig";

const STORAGE_KEY = "math_tutor_level_state_v3";

export interface LevelState {
  currentLevel: LevelId;
  streak: number;
  operationCounts: Record<string, number>;
  consecutiveErrors: number; // errors in a row without a correct answer
  levelErrorCount: number;   // total errors on current level (resets on level change)
  completedLevels: string[];
  totalSolved: number;
  totalErrors: number;
  levelStats: Record<string, { solved: number; errors: number; bestStreak: number }>;
  theoryShownForLevel: string[];
  needsTheory: boolean;
  activeDays: string[]; // ISO date strings (YYYY-MM-DD)
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

/**
 * Fallback map: which level to send the student to when they fail
 * at a specific step in an equation.
 */
const FALLBACK_TARGETS: Record<string, LevelId> = {
  "1.3": "1.1",
  "1.4": "1.2",
  "1.5": "1.3",
  "1.6": "1.3",
};

export interface ErrorAction {
  type: "show_theory" | "fallback_level" | "retry";
  targetLevel?: LevelId;
  message: string;
  errorCount: number;    // how many consecutive errors so far
  threshold: number;     // how many needed before action
}

export class LevelManager {
  private state: LevelState;

  constructor(state?: LevelState) {
    this.state = state || { ...DEFAULT_STATE };
  }

  static async load(): Promise<LevelManager> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LevelState;
        // Migration: add new fields if missing
        if (parsed.consecutiveErrors === undefined) parsed.consecutiveErrors = 0;
        if (parsed.levelErrorCount === undefined) parsed.levelErrorCount = 0;
        if (parsed.activeDays === undefined) parsed.activeDays = [];
        return new LevelManager(parsed);
      }
    } catch (e) {
      console.warn("Failed to load level state:", e);
    }
    return new LevelManager();
  }

  async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Failed to save level state:", e);
    }
  }

  getState(): Readonly<LevelState> {
    return { ...this.state };
  }

  getCurrentLevel(): LevelId {
    return this.state.currentLevel;
  }

  setCurrentLevel(level: LevelId): void {
    this.state.currentLevel = level;
    this.state.streak = 0;
    this.state.operationCounts = {};
    this.state.consecutiveErrors = 0;
    this.state.levelErrorCount = 0;
    // Show theory on first visit for equation levels
    const config = getLevelConfig(level);
    if (config.hasTheory && !this.state.theoryShownForLevel.includes(level)) {
      this.state.needsTheory = true;
    }
  }

  markTheoryShown(): void {
    const level = this.state.currentLevel;
    if (!this.state.theoryShownForLevel.includes(level)) {
      this.state.theoryShownForLevel.push(level);
    }
    this.state.needsTheory = false;
  }

  needsTheoryDisplay(): boolean {
    return this.state.needsTheory;
  }

  /**
   * Record a correct answer.
   */
  recordCorrect(operationType: string): { levelComplete: boolean; newLevel?: LevelId } {
    const config = getLevelConfig(this.state.currentLevel);

    this.state.streak++;
    this.state.operationCounts[operationType] =
      (this.state.operationCounts[operationType] || 0) + 1;
    this.state.totalSolved++;
    this.state.consecutiveErrors = 0; // Reset consecutive errors on correct

    // Track active day
    const today = new Date().toISOString().split("T")[0];
    if (!this.state.activeDays.includes(today)) {
      this.state.activeDays.push(today);
    }

    // Update stats
    const levelKey = this.state.currentLevel;
    if (!this.state.levelStats[levelKey]) {
      this.state.levelStats[levelKey] = { solved: 0, errors: 0, bestStreak: 0 };
    }
    this.state.levelStats[levelKey].solved++;
    if (this.state.streak > this.state.levelStats[levelKey].bestStreak) {
      this.state.levelStats[levelKey].bestStreak = this.state.streak;
    }

    // Check if all operation types have enough
    let allOpsMet = true;
    for (const op of config.operations) {
      if ((this.state.operationCounts[op] || 0) < config.operationsPerType) {
        allOpsMet = false;
        break;
      }
    }

    // Level complete when streak >= required AND balanced ops met
    if (this.state.streak >= config.requiredStreak && allOpsMet) {
      if (!this.state.completedLevels.includes(this.state.currentLevel)) {
        this.state.completedLevels.push(this.state.currentLevel);
      }

      const currentIdx = LEVEL_CONFIGS.findIndex((l) => l.id === this.state.currentLevel);
      if (currentIdx < LEVEL_CONFIGS.length - 1) {
        const nextLevel = LEVEL_CONFIGS[currentIdx + 1].id;
        this.state.currentLevel = nextLevel;
        this.state.streak = 0;
        this.state.operationCounts = {};
        this.state.consecutiveErrors = 0;
        this.state.levelErrorCount = 0;

        const nextConfig = getLevelConfig(nextLevel);
        if (nextConfig.hasTheory && !this.state.theoryShownForLevel.includes(nextLevel)) {
          this.state.needsTheory = true;
        }

        return { levelComplete: true, newLevel: nextLevel };
      }

      return { levelComplete: true };
    }

    return { levelComplete: false };
  }

  /**
   * Record an error. Uses AppConfig thresholds.
   *
   * Flow:
   * - Error 1...(N-1): just retry, show correct procedure
   * - Error N (ERRORS_BEFORE_FALLBACK): show theory for equation levels
   * - Error N+1... or ERRORS_BEFORE_LEVEL_DROP: fallback to lower level
   * - Basic levels (1.1, 1.2): always just retry (no theory/fallback)
   */
  recordError(failedAtStep: number): ErrorAction {
    const level = this.state.currentLevel;
    const threshold = APP_CONFIG.ERRORS_BEFORE_FALLBACK;
    const dropThreshold = APP_CONFIG.ERRORS_BEFORE_LEVEL_DROP;

    this.state.totalErrors++;
    this.state.consecutiveErrors++;
    this.state.levelErrorCount++;

    // Update stats
    if (!this.state.levelStats[level]) {
      this.state.levelStats[level] = { solved: 0, errors: 0, bestStreak: 0 };
    }
    this.state.levelStats[level].errors++;

    // Reset streak
    this.state.streak = 0;
    this.state.operationCounts = {};

    const errCount = this.state.consecutiveErrors;

    // For basic levels (1.1, 1.2), always just retry
    if (level === "1.1" || level === "1.2") {
      return {
        type: "retry",
        message: "Nije tačno. Pokušaj ponovo!",
        errorCount: errCount,
        threshold,
      };
    }

    // Check if total level errors reached drop threshold → fallback to lower level
    if (this.state.levelErrorCount >= dropThreshold) {
      const targetLevel = FALLBACK_TARGETS[level];
      if (targetLevel) {
        this.state.currentLevel = targetLevel;
        this.state.streak = 0;
        this.state.operationCounts = {};
        this.state.consecutiveErrors = 0;
        this.state.levelErrorCount = 0;
        const targetConfig = getLevelConfig(targetLevel);
        return {
          type: "fallback_level",
          targetLevel,
          message: `Potrebno je više vežbe. Idemo na nivo ${targetLevel}: ${targetConfig.name}`,
          errorCount: errCount,
          threshold,
        };
      }
    }

    // Consecutive errors reached threshold → show theory
    if (errCount >= threshold) {
      this.state.needsTheory = true;
      this.state.consecutiveErrors = 0; // Reset so they get fresh tries after theory
      return {
        type: "show_theory",
        message: `Pogrešio si ${errCount} puta. Hajde da pregledamo teoriju.`,
        errorCount: errCount,
        threshold,
      };
    }

    // Below threshold → just retry, show the correct procedure
    return {
      type: "retry",
      message: `Greška ${errCount}/${threshold}. Pokušaj ponovo!`,
      errorCount: errCount,
      threshold,
    };
  }

  getNextOperationType(): string {
    const config = getLevelConfig(this.state.currentLevel);
    let minCount = Infinity;
    let chosenOp = config.operations[0];
    for (const op of config.operations) {
      const count = this.state.operationCounts[op] || 0;
      if (count < minCount) {
        minCount = count;
        chosenOp = op;
      }
    }
    return chosenOp;
  }

  isLevelUnlocked(_levelId: string): boolean {
    return APP_CONFIG.ALL_LEVELS_UNLOCKED ? true : this._checkUnlock(_levelId);
  }

  private _checkUnlock(levelId: string): boolean {
    if (levelId === "1.1") return true;
    const idx = LEVEL_CONFIGS.findIndex((l) => l.id === levelId);
    if (idx <= 0) return true;
    const prevLevel = LEVEL_CONFIGS[idx - 1].id;
    return this.state.completedLevels.includes(prevLevel);
  }

  isLevelCompleted(levelId: string): boolean {
    return this.state.completedLevels.includes(levelId);
  }

  async reset(): Promise<void> {
    this.state = { ...DEFAULT_STATE };
    await this.save();
  }

  getStreakProgress(): { current: number; required: number; percent: number } {
    const config = getLevelConfig(this.state.currentLevel);
    return {
      current: this.state.streak,
      required: config.requiredStreak,
      percent: Math.min(100, (this.state.streak / config.requiredStreak) * 100),
    };
  }
}
