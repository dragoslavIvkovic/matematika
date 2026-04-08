import type { Href } from "expo-router";

/**
 * Centrally defined application routes for Expo Router.
 * Using constants ensures type safety and prevents typos when using router.push() or <Link />.
 */
export const ROUTES = {
  HOME: "/" as Href,
  PRACTICE: "/(tabs)/practice" as Href,
  PROGRESS: "/(tabs)/progress" as Href,
  ONBOARDING: "/onboarding" as Href,
  DAILY_PRACTICE: "/daily-practice" as Href,
} as const;

export const ROUTE_HOME: Href = "/";
export const ROUTE_PRACTICE: Href = "/(tabs)/practice";
export const ROUTE_PROGRESS: Href = "/(tabs)/progress";
export const ROUTE_ONBOARDING: Href = "/onboarding";
export const ROUTE_DAILY_PRACTICE: Href = "/daily-practice";
