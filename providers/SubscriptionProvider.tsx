import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo, LOG_LEVEL } from "react-native-purchases";

import { REVENUECAT_ENTITLEMENT_ID } from "@/constants/revenuecat";

type SubscriptionContextValue = {
  /** RevenueCat finished first fetch (native), or true on web. */
  isReady: boolean;
  /** Active premium entitlement. On web, treated as true so the app stays usable without IAP. */
  isPremium: boolean;
  /** True when Purchases SDK runs on this platform (iOS/Android). */
  purchasesSupported: boolean;
  /** True when native IAP modules are linked (false in Expo Go / broken prebuild). */
  revenueCatNativeAvailable: boolean;
  refreshCustomerInfo: () => Promise<void>;
  /** Native RevenueCat paywall sheet. Resolves after dismiss; refreshes entitlement state. Returns whether premium is active after close. */
  presentPaywall: () => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function entitlementActive(info: CustomerInfo): boolean {
  return info.entitlements.active[REVENUECAT_ENTITLEMENT_ID] != null;
}

function isNativeModuleError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("Native module") ||
    msg.includes("not found") ||
    msg.includes("not available") ||
    msg.includes("RevenueCatUI")
  );
}

/**
 * Paywall UI is loaded dynamically so Metro does not eagerly resolve
 * react-native-purchases-ui (avoids intermittent "unknown module" bundler errors).
 */
async function presentNativePaywall(): Promise<void> {
  const RevenueCatUI = (await import("react-native-purchases-ui")).default;
  await RevenueCatUI.presentPaywall();
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const purchasesSupported = Platform.OS === "ios" || Platform.OS === "android";

  const [isReady, setIsReady] = useState(!purchasesSupported);
  const [isPremium, setIsPremium] = useState(!purchasesSupported);
  /** Stays true until we detect a native link/configure failure. */
  const [revenueCatNativeAvailable, setRevenueCatNativeAvailable] = useState(true);

  const refreshCustomerInfo = useCallback(async () => {
    if (!purchasesSupported) {
      setIsPremium(true);
      return;
    }
    try {
      const info = await Purchases.getCustomerInfo();
      setIsPremium(entitlementActive(info));
    } catch (e) {
      console.warn("RevenueCat: getCustomerInfo failed", e);
      if (__DEV__ && isNativeModuleError(e)) {
        setRevenueCatNativeAvailable(false);
        setIsPremium(true);
        return;
      }
      setIsPremium(false);
    }
  }, [purchasesSupported]);

  useEffect(() => {
    if (!purchasesSupported) return;

    const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    const apiKey =
      Platform.OS === "ios" ? iosKey : Platform.OS === "android" ? androidKey : undefined;

    if (!apiKey) {
      console.warn(
        "RevenueCat: missing EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / ANDROID_API_KEY — add them to .env and restart Metro (expo start -c).",
      );
      setIsReady(true);
      if (__DEV__) {
        setRevenueCatNativeAvailable(false);
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
      return;
    }

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.WARN);
    try {
      Purchases.configure({ apiKey });
    } catch (e) {
      console.warn("RevenueCat: configure failed", e);
      setRevenueCatNativeAvailable(false);
      setIsReady(true);
      if (__DEV__) setIsPremium(true);
      else setIsPremium(false);
      return;
    }

    const onCustomerInfoUpdate = (next: CustomerInfo) => {
      setIsPremium(entitlementActive(next));
    };

    let listenerRegistered = false;

    void (async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        setIsPremium(entitlementActive(info));
        setRevenueCatNativeAvailable(true);
        Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdate);
        listenerRegistered = true;
      } catch (e) {
        console.warn("RevenueCat: configure / initial getCustomerInfo failed", e);
        setRevenueCatNativeAvailable(false);
        if (__DEV__ && isNativeModuleError(e)) {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
      } finally {
        setIsReady(true);
      }
    })();

    return () => {
      if (listenerRegistered) {
        Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdate);
      }
    };
  }, [purchasesSupported]);

  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (!purchasesSupported) return true;
    if (!revenueCatNativeAvailable && __DEV__) {
      console.warn(
        "RevenueCat: paywall skipped — native module unavailable. Rebuild: npx expo prebuild && npx pod-install && npx expo run:ios",
      );
      return false;
    }
    if (!revenueCatNativeAvailable) {
      return false;
    }
    try {
      await presentNativePaywall();
    } catch (e) {
      console.warn("RevenueCat: presentPaywall failed", e);
      if (__DEV__ && isNativeModuleError(e)) {
        setRevenueCatNativeAvailable(false);
        setIsPremium(true);
        return true;
      }
    }
    try {
      const info = await Purchases.getCustomerInfo();
      const next = entitlementActive(info);
      setIsPremium(next);
      return next;
    } catch {
      return false;
    }
  }, [purchasesSupported, revenueCatNativeAvailable]);

  const value = useMemo(
    () => ({
      isReady,
      isPremium,
      purchasesSupported,
      revenueCatNativeAvailable,
      refreshCustomerInfo,
      presentPaywall,
    }),
    [
      isReady,
      isPremium,
      purchasesSupported,
      revenueCatNativeAvailable,
      refreshCustomerInfo,
      presentPaywall,
    ],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
