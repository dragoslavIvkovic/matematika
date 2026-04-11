import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { OWL_MASCOT_VIEW_ASPECT, OwlMascotSvg } from "@/components/OwlMascotSvg";

/** viewBox width / height — owl art; `size` maps to drawing height */
const VIEW_ASPECT = OWL_MASCOT_VIEW_ASPECT;

interface OwlMascotProps {
  size?: number;
  isThinking?: boolean;
  /**
   * Minimal wrapper — only for hero / marketing (default reserves ~42% extra height for float).
   * Use on onboarding slide 1 so the SVG isn’t swimming in empty padding.
   */
  compactLayout?: boolean;
}

export function OwlMascot({
  size = 80,
  isThinking = false,
  compactLayout = false,
}: OwlMascotProps) {
  const scale = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (isThinking) {
      scale.value = 1;
      floatY.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(2, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
    } else {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );

      floatY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
    }
  }, [scale, floatY, isThinking]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  const imgH = size;
  const imgW = size * VIEW_ASPECT;
  /** Default: roomy box for float/scale. Compact: ~10% vertical slack only; width = art width (no forced bar). */
  const outerH = compactLayout && !isThinking ? size * 1.1 : size * (isThinking ? 1.28 : 1.42);
  const outerW = compactLayout && !isThinking ? imgW : Math.max(imgW, size * 0.92);

  const outerStyle = isThinking
    ? {
        width: outerW,
        height: outerH,
        alignItems: "center" as const,
        overflow: "hidden" as const,
      }
    : {
        width: outerW,
        height: outerH,
        alignItems: "center" as const,
      };

  return (
    <View style={outerStyle}>
      <Animated.View style={[{ alignItems: "center" }, bodyStyle]}>
        <OwlMascotSvg width={imgW} height={imgH} />
      </Animated.View>
    </View>
  );
}
