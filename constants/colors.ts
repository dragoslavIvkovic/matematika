/** Soft pastels with enough chroma to feel lively — school-friendly, not muddy or neon. */
const primary = "#4F8FD9";
const primaryLight = "#7BAEEB";
const primaryDark = "#3A6BB5";
const accent = "#3DB88C";
const accentLight = "#6DD4AE";
/** Warm accent: coral-peach (not classic orange) — pairs cleanly with sky blue primary. */
const orange = "#E8847A";
const orangeLight = "#F0B0A6";
const orangeGlow = "rgba(232, 132, 122, 0.28)";

/** Shared primitives — single literal per value */
const white = "#FFFFFF";
const black = "#000000";
const notebookPaper = "#FFFCF5";
const slateMuted = "#64748B";
const errorLight = "#FECACA";
const errorLighter = "#FEE8E8";

const darkSurface = "#1C1D22";
const darkLink = "#7CB3FF";

export default {
  light: {
    white,
    black,
    transparent: "transparent",
    overlay: "rgba(0, 0, 0, 0.45)",
    sheen: "rgba(255, 255, 255, 0.12)",
    whiteOverlay: "rgba(255, 255, 255, 0.85)",
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: slateMuted,
    /** App shell; keep in sync with `app.json` → `expo.splash.backgroundColor` (JSON cannot import this module). */
    background: "#F3F7FB",
    backgroundAlt: "#E3EEF8",
    notebook: notebookPaper,
    surface: white,
    surfaceAlt: "#F1F5F9",
    border: "#E2E8F0",
    /** Unfilled progress rings / bars — darker than `border` for contrast on white/light bg */
    progressEmpty: "#CBD5E1",
    /** Stat card gradients (Progress) */
    gradientSuccessEnd: "#22A67A",
    gradientErrorEnd: "#DC4A4A",
    /** Weak-areas card when locked */
    errorLockedSurface: "#C23D3D",
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
    textShadowSoft: "rgba(0, 0, 0, 0.12)",
    /** Subtle tinted surfaces */
    primaryTintSurface: "rgba(79, 143, 217, 0.09)",
    errorTintSurface: "rgba(239, 68, 68, 0.07)",
    primaryBorderMuted: "rgba(79, 143, 217, 0.28)",
    /** Owl mascot SVG (`OwlMascotSvg`) — eyes use `white` */
    mascotBlue: "#4A56A8",
    mascotEyeWhiteR: "#F7F8F8",
    mascotHighlight: "#FFF9F0",
    mascotBeak: "#F07171",
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
    orangeLighter: "#FFF5F3",
    orangeSubtle: "#F3D4CE",
    orangeDark: "#B8554A",
    orangeGlow,
    backgroundSecondary: "#E8EDF4",
    link: "#2563C8",
    buttonText: white,
    borderSubtle: "rgba(0, 0, 0, 0.09)",
    /** Same hue as `accent` — use for success UI */
    success: accent,
    successDark: "#047857",
    warning: "#E8A52E",
    warningLight: "#FEF3C7",
    warningBorder: "#FCD34D",
    /** Amber lock / crown on yellow pills (premium badges) */
    warningDark: "#B45309",
    error: "#EF4444",
    errorDark: "#B91C1C",
    errorLight,
    errorLighter,
    /** Same as `primaryLight` */
    info: primaryLight,
    infoLight: "#DBEAFE",
    tint: primary,
    tabIconSelected: primary,
    cardCorrect: "#D8F3E6",
    cardCorrectBorder: "#6EE7B7",
    cardNeutral: "#E0F0FE",
    cardNeutralBorder: "#93C5FD",
    levels: {
      "1.1": accent,
      "1.2": primaryLight,
      "1.3": orange,
      "1.4": "#A78BFA",
      "1.5": "#F472B6",
      "1.6": "#22D3EE",
    } as Record<string, string>,
  },
  dark: {
    white,
    black,
    transparent: "transparent",
    overlay: "rgba(0, 0, 0, 0.65)",
    text: "#F8FAFC",
    textSecondary: "rgba(248, 250, 252, 0.72)",
    background: "#0C0D10",
    backgroundAlt: darkSurface,
    backgroundSecondary: darkSurface,
    surface: darkSurface,
    surfaceAlt: "#2A2B32",
    border: "#3D3F48",
    primary,
    accent,
    orange,
    error: "#F87171",
    warning: "#FBBF24",
    info: darkLink,
    link: darkLink,
    buttonText: white,
    borderSubtle: "rgba(255, 255, 255, 0.1)",
  },
};
