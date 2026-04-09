/**
 * AppConfig — Centralna konfiguracija za celu aplikaciju.
 *
 * Sve parametre gresaka, streak-ova i fallback-a menjaj OVDE.
 * Nema potrebe da pretrazujes ostale fajlove.
 */

export const APP_CONFIG = {
  /**
   * Koliko uzastopnih pogrešnih pokušaja pre nego što se otvara teorija (učenje).
   *
   * Primer: 3 = posle 3 greške zaredom → link na teoriju, ne "Pokušaj ponovo"
   */
  ERRORS_BEFORE_FALLBACK: 3,

  /**
   * Koliko pogresnih pokusaja ukupno (kumulativno na nivou)
   * pre nego sto se korisnik salje na prethodni nivo.
   *
   * Primer: 3 = posle 3 ukupne greske na nivou → nazad
   */
  ERRORS_BEFORE_LEVEL_DROP: 3,

  /**
   * Streak potreban za zavrsetak nivoa
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
   * Operacije po tipu koje moraju da budu balansirane
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
   * Da li su svi nivoi otklucani (true = slobodan pristup)
   */
  ALL_LEVELS_UNLOCKED: true,
};
