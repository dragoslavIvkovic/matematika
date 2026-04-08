import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getLocalDateString } from "@/utils/dateUtils";
import { storage } from "@/utils/storage";

const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.remove(name); // U v4+ je removed()
  },
};

interface UsageState {
  tasksCompletedToday: number;
  lastTaskDate: string;
  incrementTasksCompleted: () => void;
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set) => ({
      tasksCompletedToday: 0,
      lastTaskDate: getLocalDateString(),

      incrementTasksCompleted: () => {
        const today = getLocalDateString();
        set((state) => {
          if (state.lastTaskDate !== today) {
            // New day, reset counter and then increment
            return {
              tasksCompletedToday: 1,
              lastTaskDate: today,
            };
          }
          // Same day, increment
          return {
            tasksCompletedToday: state.tasksCompletedToday + 1,
          };
        });
      },
    }),
    {
      name: "math-usage-store",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
