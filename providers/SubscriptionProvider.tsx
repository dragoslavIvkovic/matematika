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
import type { PAYWALL_RESULT } from "react-native-purchases-ui";

import { REVENUECAT_ANDROID_API_KEY, REVENUECAT_IOS_API_KEY } from "@/constants/revenuecat";
import {
  type ProductAnalyticsEvent,
  type RevenueCatPaywallResultCode,
  useAnalyticsStore,
} from "@/store/analyticsStore";
import { loadRevenueCatPurchasesUi } from "@/utils/revenueCatPurchasesUi";

/** Why the native paywall cannot open — drives clearer in-app alerts. */
export type PaywallBlockReason =
  | "missing_env"
  | "native_unavailable"
  | "paywall_ui_load_failed"
  | null;

export type PresentPaywallResult = {
  /** Whether the user has premium after this flow. */
  premiumActive: boolean;
  /** Store / RevenueCat could not run (missing keys, native error, paywall failed to open). */
  billingUnavailable: boolean;
  /**
   * When `billingUnavailable` is true, why — set in the same tick as the return value
   * so alerts are correct before React re-renders (avoids stale context).
   */
  unavailableReason?: PaywallBlockReason;
};

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
  /** Native RevenueCat paywall. After dismiss, refreshes entitlement state. */
  presentPaywall: () => Promise<PresentPaywallResult>;
  /** When purchases are blocked, explains whether env or native IAP is the cause. */
  paywallBlockReason: PaywallBlockReason;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

/** True if RevenueCat reports any active entitlement (data comes from SDK / backend, not app env). */
function entitlementActive(info: CustomerInfo): boolean {
  const active = info.entitlements.active;
  return active != null && Object.keys(active).length > 0;
}

function snapshotPaywallBlockReason(
  purchasesSupported: boolean,
  revenueCatNativeAvailable: boolean,
  paywallUiModuleFailed: boolean,
): PaywallBlockReason {
  if (!purchasesSupported) return null;
  const apiKey =
    Platform.OS === "ios"
      ? REVENUECAT_IOS_API_KEY
      : Platform.OS === "android"
        ? REVENUECAT_ANDROID_API_KEY
        : undefined;
  if (!apiKey) return "missing_env";
  if (paywallUiModuleFailed) return "paywall_ui_load_failed";
  if (!revenueCatNativeAvailable) return "native_unavailable";
  return null;
}

function trackRevenueCatPaywall(
  properties: Extract<ProductAnalyticsEvent, { event: "revenuecat_paywall" }>["properties"],
) {
  useAnalyticsStore.getState().trackProductEvent({
    event: "revenuecat_paywall",
    properties,
  });
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

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const purchasesSupported = Platform.OS === "ios" || Platform.OS === "android";

  const [isReady, setIsReady] = useState(() => !purchasesSupported);
  const [isPremium, setIsPremium] = useState(() => !purchasesSupported);
  /** Stays true until we detect a native link/configure failure. */
  const [revenueCatNativeAvailable, setRevenueCatNativeAvailable] = useState(true);
  /** Set when `react-native-purchases-ui` fails to load (Metro chunk / missing native build). */
  const [paywallUiModuleFailed, setPaywallUiModuleFailed] = useState(false);

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
      if (isNativeModuleError(e)) {
        setRevenueCatNativeAvailable(false);
      }
      setIsPremium(false);
    }
  }, [purchasesSupported]);

  useEffect(() => {
    if (!purchasesSupported) return;

    const apiKey =
      Platform.OS === "ios"
        ? REVENUECAT_IOS_API_KEY
        : Platform.OS === "android"
          ? REVENUECAT_ANDROID_API_KEY
          : undefined;

    if (!apiKey) {
      console.warn(
        "RevenueCat: missing EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / ANDROID_API_KEY — add them to .env and restart Metro (expo start -c).",
      );
      setRevenueCatNativeAvailable(false);
      setIsReady(true);
      setIsPremium(false);
      return;
    }

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.WARN);
    try {
      Purchases.configure({ apiKey });
    } catch (e) {
      console.warn("RevenueCat: configure failed", e);
      setRevenueCatNativeAvailable(false);
      setIsReady(true);
      setIsPremium(false);
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
        setIsPremium(false);
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

  const paywallBlockReason = useMemo(
    (): PaywallBlockReason =>
      snapshotPaywallBlockReason(
        purchasesSupported,
        revenueCatNativeAvailable,
        paywallUiModuleFailed,
      ),
    [purchasesSupported, revenueCatNativeAvailable, paywallUiModuleFailed],
  );

  const presentPaywall = useCallback(async (): Promise<PresentPaywallResult> => {
    try {
      if (!purchasesSupported) {
        return { premiumActive: true, billingUnavailable: false };
      }
      if (!revenueCatNativeAvailable) {
        if (__DEV__) {
          if (!REVENUECAT_IOS_API_KEY && Platform.OS === "ios") {
            console.warn(
              "RevenueCat: missing EXPO_PUBLIC_REVENUECAT_IOS_API_KEY — copy .env.example to .env, add your public SDK key, then npx expo start -c and rebuild (npx expo run:ios).",
            );
          } else if (!REVENUECAT_ANDROID_API_KEY && Platform.OS === "android") {
            console.warn(
              "RevenueCat: missing EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY — copy .env.example to .env, add your key, restart Metro, rebuild.",
            );
          } else {
            console.warn(
              "RevenueCat: paywall skipped — Purchases UI / native module unavailable. Use a dev build: npx expo prebuild && npx expo run:ios (not Expo Go).",
            );
          }
        }
        const blockedReason = snapshotPaywallBlockReason(
          purchasesSupported,
          revenueCatNativeAvailable,
          paywallUiModuleFailed,
        );
        trackRevenueCatPaywall({
          rc_result: "billing_blocked",
          block_reason: blockedReason,
        });
        return {
          premiumActive: false,
          billingUnavailable: true,
          unavailableReason: blockedReason,
        };
      }
      const uiLoad = loadRevenueCatPurchasesUi();
      if (!uiLoad.ok) {
        console.warn("RevenueCat: purchases-ui module could not load", uiLoad.error);
        setPaywallUiModuleFailed(true);
        setRevenueCatNativeAvailable(false);
        trackRevenueCatPaywall({
          rc_result: "billing_blocked",
          block_reason: "paywall_ui_load_failed",
        });
        return {
          premiumActive: false,
          billingUnavailable: true,
          unavailableReason: "paywall_ui_load_failed",
        };
      }
      let paywallResult: PAYWALL_RESULT;
      try {
        useAnalyticsStore.getState().trackProductEvent({
          event: "paywall_shown",
          properties: { source: "revenuecat_native" },
        });
        paywallResult = (await uiLoad.ui.presentPaywall()) as PAYWALL_RESULT;
      } catch (e) {
        console.warn("RevenueCat: presentPaywall failed", e);
        setRevenueCatNativeAvailable(false);
        trackRevenueCatPaywall({ rc_result: "present_threw" });
        return {
          premiumActive: false,
          billingUnavailable: true,
          unavailableReason: snapshotPaywallBlockReason(
            purchasesSupported,
            false,
            paywallUiModuleFailed,
          ),
        };
      }
      try {
        let info: CustomerInfo;
        try {
          info = await Purchases.getCustomerInfo();
        } catch (first) {
          console.warn(
            "RevenueCat: getCustomerInfo after paywall failed, syncing purchases with store…",
            first,
          );
          const { customerInfo } = await Purchases.syncPurchasesForResult();
          info = customerInfo;
        }
        const next = entitlementActive(info);
        setIsPremium(next);
        trackRevenueCatPaywall({
          rc_result: paywallResult as RevenueCatPaywallResultCode,
          premium_after: next,
        });
        return { premiumActive: next, billingUnavailable: false };
      } catch (e) {
        console.warn("RevenueCat: could not resolve customer info after paywall", e);
        trackRevenueCatPaywall({
          rc_result: paywallResult as RevenueCatPaywallResultCode,
          premium_after: false,
          block_reason: snapshotPaywallBlockReason(
            purchasesSupported,
            revenueCatNativeAvailable,
            paywallUiModuleFailed,
          ),
          customer_info_failed: true,
        });
        return {
          premiumActive: false,
          billingUnavailable: true,
          unavailableReason: snapshotPaywallBlockReason(
            purchasesSupported,
            revenueCatNativeAvailable,
            paywallUiModuleFailed,
          ),
        };
      }
    } catch (e) {
      console.warn("RevenueCat: presentPaywall unexpected error", e);
      trackRevenueCatPaywall({ rc_result: "unexpected_exception" });
      setRevenueCatNativeAvailable(false);
      return {
        premiumActive: false,
        billingUnavailable: true,
        unavailableReason: snapshotPaywallBlockReason(
          purchasesSupported,
          false,
          paywallUiModuleFailed,
        ),
      };
    }
  }, [purchasesSupported, revenueCatNativeAvailable, paywallUiModuleFailed]);

  const value = useMemo(
    () => ({
      isReady,
      isPremium,
      purchasesSupported,
      revenueCatNativeAvailable,
      refreshCustomerInfo,
      presentPaywall,
      paywallBlockReason,
    }),
    [
      isReady,
      isPremium,
      purchasesSupported,
      revenueCatNativeAvailable,
      refreshCustomerInfo,
      presentPaywall,
      paywallBlockReason,
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
