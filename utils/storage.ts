import { createMMKV } from "react-native-mmkv";

/**
 * AppStorage — global MMKV instance for the app.
 *
 * MMKV v4+ uses Nitro Modules and requires `createMMKV()`.
 * Also, `.delete()` was replaced with `.remove()`.
 */
export const storage = createMMKV({
  id: "math_tutor_storage",
});

/**
 * Helpers for working with storage.
 * Abstracts MMKV specifics and eases migration.
 */
export const AppStorage = {
  /**
   * Store a string value
   */
  setString: (key: string, value: string) => {
    storage.set(key, value);
  },

  /**
   * Get a string value
   */
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  /**
   * Store an object (serialized to JSON)
   */
  setObject: (key: string, value: any) => {
    storage.set(key, JSON.stringify(value));
  },

  /**
   * Get an object (deserialized from JSON)
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
   * Remove a specific key
   */
  remove: (key: string) => {
    storage.remove(key); // v4+ uses `.remove()` instead of `.delete()`
  },

  /**
   * Clear all storage
   */
  clearAll: () => {
    storage.clearAll();
  },
};
