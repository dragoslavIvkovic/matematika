import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const C = Colors.light;

interface StreakCounterProps {
  current: number;
  required: number;
  level: string;
  operationCounts: Record<string, number>;
  operations: string[];
  operationsPerType: number;
}

const OP_LABELS: Record<string, string> = {
  "+": "Add",
  "-": "Sub",
  "*": "Mul",
  "/": "Div",
};

export function StreakCounter({
  current,
  required,
  level,
  operationCounts,
  operations,
  operationsPerType,
}: StreakCounterProps) {
  const progressWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const percent = Math.min(100, (current / required) * 100);

  useEffect(() => {
    progressWidth.value = withTiming(percent, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [percent]);

  useEffect(() => {
    if (current > 0) {
      pulseScale.value = withSequence(
        withSpring(1.08, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [current]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, counterStyle]}>
      <View style={styles.topRow}>
        <View style={styles.levelBadge}>
          <MaterialCommunityIcons name="fire" size={14} color="#F97316" />
          <Text style={styles.levelText}>Level {level}</Text>
        </View>
        <View style={styles.streakPill}>
          <Ionicons name="checkmark-circle" size={14} color={C.accent} />
          <Text style={styles.streakText}>
            {current}/{required}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            barStyle,
            {
              backgroundColor:
                percent >= 100 ? C.accent : percent >= 60 ? C.primary : C.orange,
            },
          ]}
        />
        {/* Tick marks for required streak */}
        {Array.from({ length: required }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.tick,
              {
                left: `${((i + 1) / required) * 100}%`,
                backgroundColor: i < current ? "transparent" : "#CBD5E1",
              },
            ]}
          />
        ))}
      </View>

      {/* Operation balance */}
      <View style={styles.opsRow}>
        {operations.map((op) => {
          const count = operationCounts[op] || 0;
          const filled = count >= operationsPerType;
          return (
            <View key={op} style={styles.opItem}>
              <View
                style={[
                  styles.opDot,
                  { backgroundColor: filled ? C.accent : "#E2E8F0" },
                ]}
              >
                {filled && (
                  <Ionicons name="checkmark" size={8} color="#FFF" />
                )}
              </View>
              <Text
                style={[
                  styles.opLabel,
                  filled && { color: C.accent, fontFamily: "Inter_700Bold" },
                ]}
              >
                {OP_LABELS[op] || op} {count}/{operationsPerType}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  levelText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#92400E",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  streakText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#166534",
  },
  barTrack: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  tick: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  opsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  opItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  opDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  opLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#94A3B8",
  },
});
