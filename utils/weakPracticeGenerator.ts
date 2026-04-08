/**
 * weakPracticeGenerator — Generates a 10-task quiz from weak (errored) levels.
 *
 * Distribution: tasks are spread proportionally across weak levels,
 * weighted by error count. Minimum 1 task per weak level.
 */

import {
  type GeneratedProblem,
  generateProblem,
  getLevelConfig,
  type LevelId,
} from "@/utils/ProblemGenerator";

const TOTAL_TASKS = 10;

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
 * Generate a weak-areas practice session.
 *
 * @param errorsByLevel - Record of levelId → error count (only entries with count > 0).
 * @returns Shuffled array of 10 GeneratedProblem from weak levels.
 */
export function generateWeakPracticeTasks(
  errorsByLevel: Record<string, number>,
): GeneratedProblem[] {
  const entries = (Object.entries(errorsByLevel) as [LevelId, number][]).filter(
    ([, count]) => count > 0,
  );

  if (entries.length === 0) return [];

  // Sort by most errors first
  entries.sort(([, a], [, b]) => b - a);

  const totalErrors = entries.reduce((sum, [, c]) => sum + c, 0);

  // Allocate tasks proportionally, minimum 1 per level
  const allocation: [LevelId, number][] = entries.map(([levelId, count]) => [
    levelId,
    Math.max(1, Math.round((count / totalErrors) * TOTAL_TASKS)),
  ]);

  // Adjust total to exactly TOTAL_TASKS
  let currentTotal = allocation.reduce((s, [, n]) => s + n, 0);

  // Trim excess from the level with the most allocation
  while (currentTotal > TOTAL_TASKS) {
    // Find the level with the highest allocation (that has more than 1)
    let maxIdx = 0;
    for (let i = 1; i < allocation.length; i++) {
      if (allocation[i][1] > allocation[maxIdx][1]) maxIdx = i;
    }
    if (allocation[maxIdx][1] > 1) {
      allocation[maxIdx][1]--;
      currentTotal--;
    } else {
      break;
    }
  }

  // Add more to the weakest level if under budget
  while (currentTotal < TOTAL_TASKS) {
    allocation[0][1]++;
    currentTotal++;
  }

  const tasks: GeneratedProblem[] = [];
  for (const [levelId, count] of allocation) {
    tasks.push(...generateForLevel(levelId, count));
  }

  return shuffle(tasks);
}
