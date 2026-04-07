import { createMMKV } from "react-native-mmkv";

/**
 * AppStorage — Globalni MMKV instance za aplikaciju.
 *
 * MMKV v4+ koristi Nitro Modules i zahteva `createMMKV()`.
 * Takođe, `.delete()` je zamenjen sa `.remove()`.
 */
export const storage = createMMKV({
  id: "math_tutor_storage",
});

/**
 * Pomoćne funkcije za rad sa storidžom.
 * Ovo apstrahuje specifičnosti MMKV-a i olakšava migraciju.
 */
export const AppStorage = {
  /**
   * Čuva string vrednost
   */
  setString: (key: string, value: string) => {
    storage.set(key, value);
  },

  /**
   * Vraća string vrednost
   */
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  /**
   * Čuva objekat (automatski ga serijalizuje u JSON)
   */
  setObject: (key: string, value: any) => {
    storage.set(key, JSON.stringify(value));
  },

  /**
   * Vraća objekat (automatski ga deserijalizuje)
   */
  getObject: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`Failed to parse storage object for key: ${key}`, e);
      return null;
    }
  },

  /**
   * Brisanje specifičnog ključa
   */
  remove: (key: string) => {
    storage.remove(key); // U v4+ je `.remove()` umesto `.delete()`
  },

  /**
   * Čišćenje celog storidža
   */
  clearAll: () => {
    storage.clearAll();
  },
};
