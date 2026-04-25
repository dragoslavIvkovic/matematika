import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useContext, useMemo } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Bottom offset for a full-width panel that must sit *above* the bottom tab bar.
 * The tab bar uses `position: "absolute"` and paints over the screen; the keyboard
 * is positioned with `bottom: this` so the bar and keys are both visible.
 */
export function useMathKeyboardTabOffset(): number {
  const insets = useSafeAreaInsets();
  const measured = useContext(BottomTabBarHeightContext);

  return useMemo(() => {
    if (measured != null && measured > 0) {
      return measured;
    }
    if (Platform.OS === "web") {
      return 84;
    }
    if (Platform.OS === "android") {
      return 56 + insets.bottom;
    }
    if (isLiquidGlassAvailable()) {
      return 88 + insets.bottom;
    }
    return 49 + insets.bottom;
  }, [measured, insets.bottom]);
}
