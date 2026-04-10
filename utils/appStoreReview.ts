import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

import { AppStorage } from "@/utils/storage";

const REVIEW_PROMPT_KEY = "math_tutor_in_app_review_prompted_v1";

/** Whether we already showed the native rating dialog once (iOS/Android do not report if the user actually rated). */
export function hasAlreadyBeenAskedToRate(): boolean {
  return AppStorage.getString(REVIEW_PROMPT_KEY) === "1";
}

function markReviewPromptShown(): void {
  AppStorage.setString(REVIEW_PROMPT_KEY, "1");
}

let reviewRequestInFlight = false;

/**
 * One-time native in-app review (SKStoreReview / Play In-App Review).
 * Called after a perfect level; if no action is available, we do not mark it as shown.
 */
export async function requestReviewIfFirstTime(): Promise<void> {
  if (Platform.OS === "web") return;
  if (hasAlreadyBeenAskedToRate() || reviewRequestInFlight) return;
  reviewRequestInFlight = true;
  try {
    if (!(await StoreReview.hasAction())) return;
    markReviewPromptShown();
    await StoreReview.requestReview();
  } catch {
    // Prompt already marked as shown so we do not nag the user again
  } finally {
    reviewRequestInFlight = false;
  }
}
