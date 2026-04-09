import { AppStorage } from "@/utils/storage";

const STORAGE_KEY = "math_tutor_free_daily_quiz_starts_v1";

function localDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readCount(): { day: string; count: number } {
  const raw = AppStorage.getObject<{ day: string; count: number }>(STORAGE_KEY);
  if (!raw || typeof raw.count !== "number") {
    return { day: localDateKey(), count: 0 };
  }
  return raw;
}

/** How many daily quiz sessions a free user has started today (local calendar day). */
export function getFreeDailyQuizStartsToday(): number {
  const today = localDateKey();
  const { day, count } = readCount();
  if (day !== today) return 0;
  return count;
}

/** Free users may start at most this many daily quizzes per day. */
export const FREE_DAILY_QUIZ_LIMIT = 2;

export function canFreeUserClaimDailyQuizSlot(): boolean {
  return getFreeDailyQuizStartsToday() < FREE_DAILY_QUIZ_LIMIT;
}

/**
 * Atomically consumes one free daily quiz slot. Call once when navigating from the app entry flow.
 * Returns false if the user is already at the daily limit.
 */
export function claimFreeDailyQuizSlot(): boolean {
  const today = localDateKey();
  const { day, count } = readCount();
  const n = day !== today ? 0 : count;
  if (n >= FREE_DAILY_QUIZ_LIMIT) return false;
  AppStorage.setObject(STORAGE_KEY, { day: today, count: n + 1 });
  return true;
}
