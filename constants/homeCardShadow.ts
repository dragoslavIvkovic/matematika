import { Platform, type ViewStyle } from "react-native";

/**
 * Card shadows on the Learn screen.
 * iOS: shadowColor / offset / opacity / radius
 * Android: elevation (no shadowOpacity to avoid double shadow)
 */
const surfaceIos: ViewStyle = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 6,
};

const raisedIos: ViewStyle = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 10,
};

const heroIos: ViewStyle = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.18,
  shadowRadius: 22,
};

export const homeCardShadow = {
  /** Mini stats, roadmap, light cards */
  surface: Platform.select<ViewStyle>({
    ios: surfaceIos,
    android: { elevation: 4 },
    default: surfaceIos,
  }),

  /** Continue practice — stronger lift (Weak Areas uses its own colored shadow) */
  raised: Platform.select<ViewStyle>({
    ios: raisedIos,
    android: { elevation: 6 },
    default: raisedIos,
  }),

  /** Reserved for shared hero cards (e.g. future reuse) */
  hero: Platform.select<ViewStyle>({
    ios: heroIos,
    android: { elevation: 12 },
    default: heroIos,
  }),
};
