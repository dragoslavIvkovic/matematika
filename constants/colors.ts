const primary = "#2563EB";
const primaryLight = "#3B82F6";
const primaryDark = "#1D4ED8";
const accent = "#10B981";
const accentLight = "#34D399";
const orange = "#F97316";
const orangeLight = "#FB923C";
const orangeGlow = "rgba(249, 115, 22, 0.25)";

/** Shared primitives — single literal per value */
const white = "#FFFFFF";
const black = "#000000";
const notebookPaper = "#FFFEF7";
const slateMuted = "#94A3B8";
const errorLight = "#FCA5A5";
const errorLighter = "#FEE2E2";

const darkSurface = "#1C1C1E";
const darkLink = "#0A84FF";

export default {
  light: {
    white,
    black,
    transparent: "transparent",
    overlay: "rgba(0, 0, 0, 0.5)",
    sheen: "rgba(255, 255, 255, 0.12)",
    whiteOverlay: "rgba(255, 255, 255, 0.8)",
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: slateMuted,
    /** App shell; keep in sync with `app.json` → `expo.splash.backgroundColor` (JSON cannot import this module). */
    background: "#F0F9FF",
    backgroundAlt: "#E0F2FE",
    notebook: notebookPaper,
    surface: white,
    surfaceAlt: "#F8FAFC",
    border: "#E2E8F0",
    /** Unfilled progress rings / bars — darker than `border` for contrast on white/light bg */
    progressEmpty: "#CBD5E1",
    /** Stat card gradients (Progress) */
    gradientSuccessEnd: "#059669",
    gradientErrorEnd: "#dc2626",
    /** Weak-areas card when locked — deeper red */
    errorLockedSurface: "#B91C1C",
    /** White at alpha — text/icons on solid color buttons & hero cards */
    onColorWhite14: "rgba(255, 255, 255, 0.14)",
    onColorWhite15: "rgba(255, 255, 255, 0.15)",
    onColorWhite20: "rgba(255, 255, 255, 0.2)",
    onColorWhite70: "rgba(255, 255, 255, 0.7)",
    onColorWhite75: "rgba(255, 255, 255, 0.75)",
    onColorWhite82: "rgba(255, 255, 255, 0.82)",
    onColorWhite88: "rgba(255, 255, 255, 0.88)",
    onColorWhite90: "rgba(255, 255, 255, 0.9)",
    onColorWhite92: "rgba(255, 255, 255, 0.92)",
    onColorWhite95: "rgba(255, 255, 255, 0.95)",
    textShadowSoft: "rgba(0, 0, 0, 0.15)",
    /** Subtle tinted surfaces */
    primaryTintSurface: "rgba(37, 99, 235, 0.05)",
    errorTintSurface: "rgba(239, 68, 68, 0.05)",
    primaryBorderMuted: "rgba(37, 99, 235, 0.2)",
    /** Owl mascot SVG (`OwlMascotSvg`) — eyes use `white` */
    mascotBlue: "#262784",
    mascotEyeWhiteR: "#F6F7F7",
    mascotHighlight: "#FEFCF0",
    mascotBeak: "#FB2525",
    /** Android notification channel LED color */
    notificationChannelLight: "#FF231F7C",
    borderLight: "#F1F5F9",
    primary,
    primaryLight,
    primaryDark,
    accent,
    accentLight,
    orange,
    orangeLight,
    orangeLighter: "#FFF7ED",
    orangeSubtle: "#FED7AA",
    orangeDark: "#9A3412",
    orangeGlow,
    backgroundSecondary: "#F2F2F7",
    link: "#007AFF",
    buttonText: white,
    borderSubtle: "rgba(0, 0, 0, 0.1)",
    /** Same hue as `accent` — use for success UI */
    success: accent,
    successDark: "#166534",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    warningBorder: "#FCD34D",
    /** Amber lock / crown on yellow pills (premium badges) */
    warningDark: "#B45309",
    error: "#EF4444",
    errorDark: "#991B1B",
    errorLight,
    errorLighter,
    /** Same as `primaryLight` */
    info: primaryLight,
    infoLight: "#DBEAFE",
    tint: primary,
    tabIconSelected: primary,
    cardCorrect: "#DCFCE7",
    cardCorrectBorder: "#86EFAC",
    cardNeutral: "#EFF6FF",
    cardNeutralBorder: "#BFDBFE",
    levels: {
      "1.1": accent,
      "1.2": primaryLight,
      "1.3": orange,
      "1.4": "#8B5CF6",
      "1.5": "#EC4899",
      "1.6": "#06B6D4",
    } as Record<string, string>,
  },
  dark: {
    white,
    black,
    transparent: "transparent",
    overlay: "rgba(0, 0, 0, 0.7)",
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    background: "#000000",
    backgroundAlt: darkSurface,
    backgroundSecondary: darkSurface,
    surface: darkSurface,
    surfaceAlt: "#2C2C2E",
    border: "#38383A",
    primary,
    accent,
    orange,
    error: "#FF453A",
    warning: "#FF9F0A",
    info: darkLink,
    link: darkLink,
    buttonText: white,
    borderSubtle: "rgba(255, 255, 255, 0.1)",
  },
};
