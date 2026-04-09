import { Platform, type ViewStyle } from "react-native";

/**
 * Senke za kartice na Learn ekranu.
 * iOS: shadowColor / offset / opacity / radius
 * Android: elevation (bez shadowOpacity da ne duple senku)
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
  /** Mini stat, roadmap, blage kartice */
  surface: Platform.select<ViewStyle>({
    ios: surfaceIos,
    android: { elevation: 4 },
    default: surfaceIos,
  }),

  /** Continue practice — jači lift (Weak Areas ima bojenu senku u komponenti) */
  raised: Platform.select<ViewStyle>({
    ios: raisedIos,
    android: { elevation: 6 },
    default: raisedIos,
  }),

  /** Rezervisano za zajedničke hero kartice (npr. budući reuse) */
  hero: Platform.select<ViewStyle>({
    ios: heroIos,
    android: { elevation: 12 },
    default: heroIos,
  }),
};
