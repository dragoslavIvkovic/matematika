/**
 * Learn (home) screen — dual entitlement logic: Premium vs Free.
 * Keeps router + paywall + daily-quota rules in one place so the UI stays declarative.
 */

import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { ROUTE_DAILY_PRACTICE_CLAIMED, ROUTE_WEAK_PRACTICE } from "@/constants/routes";
import {
  type PaywallBlockReason,
  type PresentPaywallResult,
  useSubscription,
} from "@/providers/SubscriptionProvider";
import { canFreeUserClaimDailyQuizSlot, claimFreeDailyQuizSlot } from "@/utils/dailyQuizLimit";
import { alertPaywallUnavailable } from "@/utils/paywallAlert";

async function paywallWithBillingAlert(
  presentPaywall: () => Promise<PresentPaywallResult>,
  paywallBlockReason: PaywallBlockReason,
): Promise<PresentPaywallResult> {
  const result = await presentPaywall();
  if (result.billingUnavailable) {
    alertPaywallUnavailable(result.unavailableReason ?? paywallBlockReason);
  }
  return result;
}

export function useLearnHomeEntitlements() {
  const { isPremium, presentPaywall, paywallBlockReason } = useSubscription();

  /** Storage-backed limit does not trigger React; bump on tab focus so UI matches quota. */
  const [, refreshDailyLimitUi] = useState(0);
  useFocusEffect(
    useCallback(() => {
      refreshDailyLimitUi((n) => n + 1);
    }, []),
  );

  const freeDailyPlayLocked = !isPremium && !canFreeUserClaimDailyQuizSlot();

  const openDailyPractice = useCallback(async () => {
    // ── Premium: unlimited daily sessions ──
    if (isPremium) {
      router.push(ROUTE_DAILY_PRACTICE_CLAIMED);
      return;
    }

    // ── Free: daily quota, then paywall ──
    if (canFreeUserClaimDailyQuizSlot()) {
      if (!claimFreeDailyQuizSlot()) {
        await paywallWithBillingAlert(presentPaywall, paywallBlockReason);
        return;
      }
      router.push(ROUTE_DAILY_PRACTICE_CLAIMED);
      return;
    }

    const { premiumActive, billingUnavailable } = await paywallWithBillingAlert(
      presentPaywall,
      paywallBlockReason,
    );
    if (billingUnavailable) return;
    if (premiumActive) {
      router.push(ROUTE_DAILY_PRACTICE_CLAIMED);
    }
  }, [isPremium, presentPaywall, paywallBlockReason]);

  const openWeakAreas = useCallback(async () => {
    if (isPremium) {
      router.push(ROUTE_WEAK_PRACTICE);
      return;
    }
    await paywallWithBillingAlert(presentPaywall, paywallBlockReason);
  }, [isPremium, presentPaywall, paywallBlockReason]);

  const openSubscriptionUpsell = useCallback(async () => {
    await paywallWithBillingAlert(presentPaywall, paywallBlockReason);
  }, [presentPaywall, paywallBlockReason]);

  return {
    isPremium,
    freeDailyPlayLocked,
    openDailyPractice,
    openWeakAreas,
    openSubscriptionUpsell,
  };
}
