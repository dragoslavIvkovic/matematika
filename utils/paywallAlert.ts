import { Alert } from "react-native";

import type { PaywallBlockReason } from "@/providers/SubscriptionProvider";

/** Call when RevenueCat / store UI cannot be shown so the user gets feedback instead of a silent failure. */
export function alertPaywallUnavailable(reason: PaywallBlockReason = null): void {
  if (reason === "missing_env") {
    Alert.alert(
      "Purchases not configured",
      "Create a .env file in the project root (you can copy .env.example), set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY to your RevenueCat public SDK key, then stop Metro and run: npx expo start -c. Rebuild the app with npx expo run:ios so the key is embedded.",
      [{ text: "OK" }],
    );
    return;
  }

  if (reason === "native_unavailable") {
    Alert.alert(
      "Purchase screen unavailable",
      "RevenueCat needs a development build with native in-app purchases (not Expo Go). From the project folder run: npx expo prebuild then npx expo run:ios — or use EAS Build. After that, the paywall can open when your RevenueCat project and App Store products are set up.",
      [{ text: "OK" }],
    );
    return;
  }

  if (reason === "paywall_ui_load_failed") {
    Alert.alert(
      "Purchase screen couldn’t load",
      "The paywall module failed to load (often a Metro cache issue). Try: stop Metro, run npx expo start -c, then rebuild the app (npx expo run:ios). You can keep using the free version meanwhile.",
      [{ text: "OK" }],
    );
    return;
  }

  Alert.alert(
    "Purchase unavailable",
    "We couldn’t open the purchase screen. You can keep using the free version — try again later.",
    [{ text: "OK" }],
  );
}
