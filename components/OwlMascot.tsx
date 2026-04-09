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

import { OwlMascotSvg } from "@/components/OwlMascotSvg";

/** viewBox width / height — owl art is portrait; `size` maps to drawing height */
const VIEW_ASPECT = 438 / 835;

interface OwlMascotProps {
  size?: number;
  isThinking?: boolean;
}

export function OwlMascot({ size = 80, isThinking = false }: OwlMascotProps) {
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
  /** Reserve box so float + scale (1.03) never clips the SVG at the edges */
  const outerH = size * (isThinking ? 1.12 : 1.26);
  const outerW = Math.max(imgW, size * 0.92);

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
