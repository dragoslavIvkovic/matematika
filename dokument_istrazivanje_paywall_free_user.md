# Research: free-user limits and paywall

This document summarizes the app state (math tutor / React Native–Expo), existing “analytics” in code, and concrete places to add free-user limits and paywall. In-app purchases are integrated via RevenueCat; extend analytics and entitlements as below.

---

## 1. What already exists as “analytics”

### Central module: `store/analyticsStore.ts`

- Zustand store with persistence (MMKV via `storage`).
- **All events go through one function** `trackEvent` — comments in code anticipate adding `posthog.capture(event.event, event.properties)` there (currently **not** wired in production).
- Typed events:
  - `level_started`, `level_completed`, `level_dropped`
  - `quiz_answer_correct`, `quiz_answer_incorrect`
  - `daily_practice_started`, `daily_practice_completed`, `daily_practice_dropped`
- The store keeps aggregates (starts per level, completion/drop-off, daily practice, etc.).

**Paywall takeaway:** Add events like `paywall_shown`, `paywall_dismissed`, `upgrade_tapped`, `purchase_completed` in the same `AnalyticsEventName` / `trackEvent` flow so PostHog stays in one place.

### Where `trackEvent` is called (funnel reference)

| Location | What is measured |
|----------|------------------|
| `app/(tabs)/practice.tsx` | Level start, session end / exit |
| `hooks/useQuizEngine.ts` | Correct / incorrect quiz answer |
| `app/daily-practice.tsx` | Daily practice start and end |

Natural points to measure how many free users reach the paywall and convert.

### Usage counting (still no hard limit): `store/usageStore.ts`

- `tasksCompletedToday` + `incrementTasksCompleted()` (reset per calendar day).
- Called from quiz logic (e.g. on correct answers) — **counts but does not block** anything.

**Takeaway:** This store (or an extension) can back “X tasks per day for free” without a new counter from scratch, with one clear rule module (e.g. `AppConfig` or new `entitlements`).

---

## 2. Current subscription / paywall state

- **RevenueCat** and IAP are integrated in the app; configure API keys and entitlements for production.
- UI: `app/(tabs)/index.tsx` has a **Free** / premium badge tied to subscription state.
- Level config: `utils/AppConfig.ts` has `ALL_LEVELS_UNLOCKED` — when `true`, all levels are treated as unlocked in `LevelManager`.
- `utils/LevelManager.ts` — `isLevelUnlocked`: when `ALL_LEVELS_UNLOCKED` is false, completing the previous level is required (except `1.1`).
- `components/LevelSelector.tsx` — `isUnlocked` may still need to match `LevelManager` + premium rules everywhere.

**Takeaway:** Align the single source of truth: `LevelManager` + premium rules, or a `subscriptionStore` / entitlement layer that `LevelSelector` and navigation use consistently.

---

## 3. Suggested places for free-user limits

Priority by monetization impact and ease (client-only, as the app is today).

### A. Levels and progression (high)

- **`utils/AppConfig.ts`** — constants for how many early levels are free, or replace `ALL_LEVELS_UNLOCKED` with “free through level Y”.
- **`utils/LevelManager.ts`** — extend `isLevelUnlocked` (or a parallel helper) with `isPremium` / purchased levels.
- **`components/LevelSelector.tsx`** — replace any hardcoded unlock with real `isUnlocked`; locked level → CTA to paywall.
- **`app/(tabs)/practice.tsx`** — entitlement check before starting a session, or centralize in one hook.

### B. Daily practice and session limits (high)

- **`app/daily-practice.tsx`** — on entry: if free and over daily limit, show paywall instead of the generator.
- **`utils/dailyPracticeGenerator.ts`** / **`store/dailyPracticeStore.ts`** — fewer tasks or levels for free (config in one place).

### C. Weak areas (weak practice)

- **`app/weak-practice.tsx`** and **`utils/weakPracticeGenerator.ts`** — common premium feature; same pattern: route guard + analytics event.

### D. Assessment test

- **`components/LevelSelector.tsx`** (Assessment card) and navigation to assessment — limit monthly runs for free or put behind paywall.

### E. Global task limit (medium)

- **`hooks/useQuizEngine.ts`** — before the next task or after `incrementTasksCompleted`, check daily/global free limit.
- Tie to **`store/usageStore.ts`** — daily counter exists; add `FREE_DAILY_TASK_CAP` in config.

### F. Home / Learn tab (UX entry)

- **`app/(tabs)/index.tsx`** — dynamic badge; Start buttons / theory links can show paywall when the feature is not in the free tier.

---

## 4. Where to add paywall UI

- **Modal / full-screen** as a new route in `app/_layout.tsx` stack or a component under `components/` (e.g. `PaywallModal.tsx`), invoked from section 3 touchpoints.
- **After purchase:** refresh entitlements and retry the pending action (e.g. `pendingAction` in a store).

---

## 5. Analytics and A/B testing (recommended)

1. Extend event types in `analyticsStore.ts` for paywall and subscription; in `trackEvent`, send to PostHog (or another provider).
2. Use existing events (`level_started`, `daily_practice_*`) as context: which level or screen preceded `paywall_shown`.
3. Useful from day one: `paywall_shown` (with `reason`, `feature`), `paywall_cta_tap`, `purchase_started`, `purchase_success`, `purchase_error`, `restore_purchases_tap`.

---

## 6. Short implementation checklist

| Step | Action |
|------|--------|
| 1 | Introduce or extend `subscriptionStore` / entitlements: `isPremium`, source of truth (local + later receipt sync). |
| 2 | Centralize “may this user use this feature” in one module or hook (`useEntitlements`). |
| 3 | Align `LevelSelector` unlock logic with `LevelManager` + premium rules. |
| 4 | Add paywall UI and navigation; guards on `daily-practice`, `weak-practice`, assessment, and optionally `useQuizEngine`. |
| 5 | Extend `trackEvent` and optionally `usageStore` with limits from `AppConfig`. |

---

## 7. Backend note

The app is **client-first**; on-device limits can be bypassed. For serious monetization long term, server-side receipt verification / accounts help — not in this repo’s scope, but the UX map above still shows where to surface the paywall and measure the funnel.

---

*Document reflects repository state; update when stores and events change.*
