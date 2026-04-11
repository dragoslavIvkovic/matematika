import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

const C = Colors.light;

interface ProgressBarProps {
  progress: number;
  color: string;
  delay?: number;
  height?: number;
}

export function ProgressBar({ progress, color, delay = 0, height = 6 }: ProgressBarProps) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, delay, width]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));
  const borderRadius = height / 2;
  return (
    <View style={[styles.track, { height, borderRadius }]}>
      <Animated.View style={[styles.fill, barStyle, { backgroundColor: color, borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: C.progressEmpty,
    overflow: "hidden",
    flex: 1,
  },
  fill: { height: "100%" },
});
