import { Platform, type ViewStyle } from "react-native";

import Colors from "@/constants/colors";

/**
 * Base tab bar style for classic (non–liquid-glass) bottom tabs. Shared by the
 * tab layout and Practice when restoring after temporarily hiding the bar.
 */
export function getDefaultClassicTabBarStyle(): ViewStyle {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const C = Colors.light;
  return {
    position: "absolute",
    backgroundColor: isIOS ? C.transparent : C.white,
    borderTopWidth: isWeb ? 1 : 0,
    borderTopColor: C.border,
    elevation: 0,
    ...(isWeb ? { height: 84 } : {}),
  };
}
