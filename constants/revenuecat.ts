/**
 * RevenueCat public SDK keys (Expo `EXPO_PUBLIC_*` → inlined at build time).
 *
 * @see https://www.revenuecat.com/docs/getting-started/installation/expo
 *
 * Subscription access is **not** keyed off a hardcoded entitlement id in this repo: after
 * `Purchases.configure`, use `CustomerInfo` from `getCustomerInfo()` and inspect
 * `customerInfo.entitlements.active` (see `SubscriptionProvider`).
 */
export const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

export const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
