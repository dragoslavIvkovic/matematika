/**
 * dailyPracticeGenerator — Generates a mixed practice session from selected levels.
 *
 * Rules:
 * - 1 area selected  → 10 tasks from that area
 * - 2+ areas selected → 2 tasks per area (minimum 10 total, can be more)
 * - Tasks are shuffled so different level types are interleaved.
 */

import {
  type GeneratedProblem,
  generateProblem,
  getLevelConfig,
  type LevelId,
} from "@/utils/ProblemGenerator";

const MIN_TASKS = 10;
const TASKS_PER_AREA = 2;

/** Fisher-Yates shuffle (in-place). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate N problems for a single level, cycling through its operations. */
function generateForLevel(levelId: LevelId, count: number): GeneratedProblem[] {
  const config = getLevelConfig(levelId);
  const ops = config.operations;
  const tasks: GeneratedProblem[] = [];
  for (let i = 0; i < count; i++) {
    tasks.push(generateProblem(levelId, ops[i % ops.length]));
  }
  return tasks;
}

/**
 * Compute how many tasks a selection will produce.
 * Useful for showing the count in the UI before generating.
 */
export function computeTaskCount(areaCount: number): number {
  if (areaCount <= 0) return 0;
  if (areaCount === 1) return MIN_TASKS;
  return Math.max(MIN_TASKS, areaCount * TASKS_PER_AREA);
}

/**
 * Generate a daily practice session.
 *
 * @param selectedLevels - Array of LevelId the user selected (>= 1).
 * @returns Shuffled array of GeneratedProblem (minimum 10).
 */
export function generateDailyPracticeTasks(selectedLevels: LevelId[]): GeneratedProblem[] {
  if (selectedLevels.length === 0) return [];

  // Single area → all 10 tasks from it
  if (selectedLevels.length === 1) {
    return shuffle(generateForLevel(selectedLevels[0], MIN_TASKS));
  }

  // Multiple areas → 2 per area (always >= 10 when areas >= 5, but also works for 2-4)
  const tasks: GeneratedProblem[] = [];
  for (const levelId of selectedLevels) {
    tasks.push(...generateForLevel(levelId, TASKS_PER_AREA));
  }

  // If fewer than MIN_TASKS (e.g. 2 areas = 4 tasks), top up by cycling through areas
  let idx = 0;
  while (tasks.length < MIN_TASKS) {
    const levelId = selectedLevels[idx % selectedLevels.length];
    const config = getLevelConfig(levelId);
    const ops = config.operations;
    tasks.push(generateProblem(levelId, ops[Math.floor(Math.random() * ops.length)]));
    idx++;
  }

  return shuffle(tasks);
}
