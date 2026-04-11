<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Math Tutor (Expo) app. Here is a summary of all changes made:

**New files created:**
- `utils/posthog.ts` — PostHog client singleton, configured via `expo-constants` extras with graceful disable when token is absent.
- `app.config.js` — Extends `app.json` to pass `EXPO_PUBLIC_POSTHOG_API_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` env vars into the Expo extras bundle at build time.

**Modified files:**
- `app/_layout.tsx` — Added `PostHogProvider` wrapping the whole app, manual screen tracking with `posthog.screen()` on every route change (Expo Router compatible), and error tracking via the `onError` callback of `ErrorBoundary`.
- `store/analyticsStore.ts` — Wired `posthog.capture()` into the central `trackEvent` dispatcher. All 8 existing events (`level_started`, `level_completed`, `level_dropped`, `quiz_answer_correct`, `quiz_answer_incorrect`, `daily_practice_started`, `daily_practice_completed`, `daily_practice_dropped`) now automatically flow to PostHog.
- `app/onboarding.tsx` — Added `onboarding_completed` and `onboarding_skipped` events.
- `app/(tabs)/index.tsx` — Added `subscription_upsell_tapped` event when a free user taps the upgrade badge.
- `app/weak-practice.tsx` — Added `weak_practice_started` (on mount, with level/task counts) and `weak_practice_completed` (when the session finishes).
- `.env` — Updated `EXPO_PUBLIC_POSTHOG_API_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` with correct values.

| Event | Description | File |
|---|---|---|
| `level_started` | User starts a level in practice mode | `store/analyticsStore.ts` |
| `level_completed` | User completes a level (full streak). Properties: `levelId`, `totalAnswers`, `correctAnswers` | `store/analyticsStore.ts` |
| `level_dropped` | User exits a level mid-session. Properties: `levelId`, `totalAnswers`, `correctAnswers` | `store/analyticsStore.ts` |
| `quiz_answer_correct` | User submits a correct answer. Properties: `levelId` | `store/analyticsStore.ts` |
| `quiz_answer_incorrect` | User submits an incorrect answer. Properties: `levelId` | `store/analyticsStore.ts` |
| `daily_practice_started` | User starts a daily practice session. Properties: `levelIds`, `taskCount` | `store/analyticsStore.ts` |
| `daily_practice_completed` | User finishes all daily practice tasks. Properties: `levelIds`, `totalAnswers`, `correctAnswers` | `store/analyticsStore.ts` |
| `daily_practice_dropped` | User exits daily practice early. Properties: `levelIds`, `totalAnswers`, `correctAnswers` | `store/analyticsStore.ts` |
| `onboarding_completed` | User taps "Start Learning" on the final onboarding slide | `app/onboarding.tsx` |
| `onboarding_skipped` | User taps "Skip" during onboarding. Properties: `slide_index` | `app/onboarding.tsx` |
| `subscription_upsell_tapped` | Free user taps the upgrade badge on the home screen. Properties: `source` | `app/(tabs)/index.tsx` |
| `weak_practice_started` | User begins a weak areas session. Properties: `task_count`, `level_count`, `levels` | `app/weak-practice.tsx` |
| `weak_practice_completed` | User finishes a weak areas session. Properties: `correct_count`, `total_tasks` | `app/weak-practice.tsx` |
| `$screen` | Automatic screen tracking on every route change | `app/_layout.tsx` |
| `$exception` | Unhandled React errors caught by ErrorBoundary | `app/_layout.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/377932/dashboard/1456041
- **Daily Practice Completion Funnel** — How many users who start daily practice actually finish it: https://us.posthog.com/project/377932/insights/zuMlqyAk
- **Level Completion Funnel** — Conversion from level_started to level_completed, revealing difficulty/churn points: https://us.posthog.com/project/377932/insights/SEkeDSkY
- **Level Activity: Started vs Completed vs Dropped** — Daily user counts across all three level outcomes: https://us.posthog.com/project/377932/insights/Tijwg4M9
- **Onboarding Completion vs Skipped** — Bar chart of users who complete vs skip onboarding: https://us.posthog.com/project/377932/insights/rmAaLkdm
- **Subscription Upsell Taps** — How often free users tap the upgrade button + weak practice engagement: https://us.posthog.com/project/377932/insights/owNmLwkX

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
