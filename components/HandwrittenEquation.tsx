import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
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

export interface EquationStep {
  id: string;
  text: string;
  isHighlighted?: boolean;
  isCompleted?: boolean;
  isPending?: boolean;
}

interface HandwrittenEquationProps {
  steps: EquationStep[];
}

function HighlightedStep({ step }: { step: EquationStep }) {
  const glowOpacity = useSharedValue(0.5);
  const scale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [scale, glowOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.highlightedContainer, animStyle]}>
      <View style={styles.exclamationBadge}>
        <Text style={styles.exclamationText}>!</Text>
      </View>
      <Text style={[styles.stepText, styles.highlightedText]}>{step.text}</Text>
    </Animated.View>
  );
}

export function HandwrittenEquation({ steps }: HandwrittenEquationProps) {
  return (
    <View style={styles.notebookPage}>
      {/* Notebook lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={[styles.notebookLine, { top: 36 + i * 32 }]} />
      ))}

      {/* Red margin line */}
      <View style={styles.marginLine} />

      {/* Content */}
      <View style={styles.content}>
        {steps.map((step, _index) => {
          if (step.isHighlighted) {
            return <HighlightedStep key={step.id} step={step} />;
          }

          return (
            <View key={step.id} style={styles.stepRow}>
              <Text
                style={[
                  styles.stepText,
                  step.isCompleted && styles.completedText,
                  step.isPending && styles.pendingText,
                ]}
              >
                {step.text}
              </Text>
              {step.isCompleted && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notebookPage: {
    backgroundColor: C.notebook,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 48,
    minHeight: 200,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
    position: "relative",
  },
  notebookLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.cardNeutralBorder,
  },
  marginLine: {
    position: "absolute",
    left: 40,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: C.cardWrongBorder,
    opacity: 0.6,
  },
  content: {
    gap: 14,
    paddingTop: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepText: {
    fontFamily: "Inter_500Medium",
    fontSize: 22,
    color: C.text,
    letterSpacing: 0.5,
  },
  completedText: {
    color: C.textSecondary,
    textDecorationLine: "line-through",
  },
  pendingText: {
    color: C.textMuted,
  },
  highlightedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.orangeGlow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: C.orange,
    marginHorizontal: -8,
    shadowColor: C.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  highlightedText: {
    color: C.warning,
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
  exclamationBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  exclamationText: {
    color: C.white,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    lineHeight: 16,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: C.white,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
});
