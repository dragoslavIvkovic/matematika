import { Alert } from "react-native";

/** Call when RevenueCat / store UI cannot be shown so the user gets feedback instead of a silent failure. */
export function alertPaywallUnavailable(): void {
  Alert.alert(
    "Purchase unavailable",
    "We couldn’t open the purchase screen. You can keep using the free version — try again later.",
    [{ text: "OK" }],
  );
}
