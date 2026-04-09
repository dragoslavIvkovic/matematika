import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";

import { AppStorage } from "@/utils/storage";

const REVIEW_PROMPT_KEY = "math_tutor_in_app_review_prompted_v1";

/** Da li smo već jednom prikazali nativni dijalog za ocenu (iOS/Android ne javljaju da li je korisnik zaista ocenio). */
export function hasAlreadyBeenAskedToRate(): boolean {
  return AppStorage.getString(REVIEW_PROMPT_KEY) === "1";
}

function markReviewPromptShown(): void {
  AppStorage.setString(REVIEW_PROMPT_KEY, "1");
}

let reviewRequestInFlight = false;

/**
 * Jednokratni nativni in-app review (SKStoreReview / Play In-App Review).
 * Poziva se nakon savršenog nivoa; ako nema dostupne akcije, ne beležimo da je prikazano.
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
    // Prompt je već markiran kao prikazan da ne gnjavimo korisnika ponovo
  } finally {
    reviewRequestInFlight = false;
  }
}
