/**
 * Calendar dates in the user's local timezone (YYYY-MM-DD).
 * Avoid `toISOString().split("T")[0]` — that is UTC and breaks streaks/UI off UTC.
 */

export function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysToLocalDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + deltaDays);
  return getLocalDateString(date);
}

/**
 * Consecutive calendar days with at least one practice, counting back from the most recent
 * qualifying day (today if practiced, else yesterday if the streak is still alive).
 */
export function computeDailyStreak(activeDays: string[]): number {
  if (!activeDays.length) return 0;
  const set = new Set(activeDays);
  const today = getLocalDateString();
  const yesterday = addDaysToLocalDateString(today, -1);

  let anchor = today;
  if (!set.has(today)) {
    if (!set.has(yesterday)) {
      return 0;
    }
    anchor = yesterday;
  }

  let count = 0;
  let d = anchor;
  while (set.has(d)) {
    count++;
    d = addDaysToLocalDateString(d, -1);
  }
  return count;
}
