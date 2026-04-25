/**
 * AppConfig — central configuration for the whole app.
 *
 * Change error, streak, and fallback parameters HERE only.
 * No need to hunt through other files.
 */

export const APP_CONFIG = {
  /**
   * How many consecutive wrong attempts before opening theory (learning).
   *
   * Example: 3 = after 3 mistakes in a row → link to theory, not "Try again"
   */
  ERRORS_BEFORE_FALLBACK: 3,

  /**
   * Nakon ovoliko **ukupnih** grešaka na trenutnom nivou → korisnik ide na nivo odmah ispod (1.1 nema nivo ispod).
   * 3 = posle 3. greške (levelErrorCount >= 3) → spuštanje.
   */
  ERRORS_BEFORE_LEVEL_DROP: 3,

  /**
   * Streak required to complete a level
   */
  STREAK_REQUIREMENTS: {
    "1.1": 10,
    "1.2": 10,
    "1.3": 6,
    "1.4": 6,
    "1.5": 6,
    "1.6": 6,
  } as Record<string, number>,

  /**
   * Operations per type that must be balanced
   */
  OPS_PER_TYPE: {
    "1.1": 5,
    "1.2": 5,
    "1.3": 3,
    "1.4": 3,
    "1.5": 3,
    "1.6": 3,
  } as Record<string, number>,

  /**
   * Whether all levels are unlocked (true = free access)
   */
  ALL_LEVELS_UNLOCKED: true,
};
