// app.config.js — extends app.json with runtime extras loaded from env vars.
// PostHog keys are read here (build time) and exposed via expo-constants.
const base = require("./app.json");

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    extra: {
      ...base.expo.extra,
      posthogProjectToken: process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "",
      posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST || "",
    },
  },
};
