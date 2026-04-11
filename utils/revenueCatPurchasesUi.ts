/**
 * Loads RevenueCat Paywalls UI without `import()` — async chunks can throw
 * "Requiring unknown module …" in Metro when the split bundle is missing or stale.
 * Synchronous `require` stays in the main graph and failures are catchable.
 */

export type RevenueCatUiModule = {
  presentPaywall: (...args: unknown[]) => Promise<unknown>;
};

let cached: RevenueCatUiModule | null | undefined;

export function loadRevenueCatPurchasesUi():
  | { ok: true; ui: RevenueCatUiModule }
  | { ok: false; error: unknown } {
  if (cached !== undefined) {
    if (cached === null) {
      return { ok: false, error: new Error("react-native-purchases-ui failed to load earlier") };
    }
    return { ok: true, ui: cached };
  }
  try {
    const mod = require("react-native-purchases-ui") as { default: RevenueCatUiModule };
    const ui = mod.default;
    if (ui == null || typeof ui.presentPaywall !== "function") {
      cached = null;
      return { ok: false, error: new Error("react-native-purchases-ui: presentPaywall missing") };
    }
    cached = ui;
    return { ok: true, ui };
  } catch (error) {
    cached = null;
    return { ok: false, error };
  }
}
