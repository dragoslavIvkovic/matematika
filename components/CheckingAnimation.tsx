import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

const C = Colors.light;

function BounceDot({ delay, color }: { delay: number; color: string }) {
  const translateY = useSharedValue(0);
  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(-12, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
    );
  }, [delay, translateY]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

interface CheckingAnimationProps {
  color?: string;
}

export function CheckingAnimation({ color = C.primary }: CheckingAnimationProps) {
  return (
    <View style={styles.container}>
      <BounceDot delay={0} color={color} />
      <BounceDot delay={200} color={color} />
      <BounceDot delay={400} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    justifyContent: "center",
    height: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
