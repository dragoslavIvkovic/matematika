import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

import Colors from "@/constants/colors";
import type { ErrorAction } from "@/utils/LevelManager";

const C = Colors.light;

interface ErrorFeedbackModalProps {
  visible: boolean;
  errorMessage: string;
  failedAtStep: number;
  expectedProcedure: string[];
  errorAction: ErrorAction | null;
  onDismiss: () => void;
}

export function ErrorFeedbackModal({
  visible,
  errorMessage,
  failedAtStep,
  expectedProcedure,
  errorAction,
  onDismiss,
}: ErrorFeedbackModalProps) {
  if (!visible) return null;

  const getActionColor = () => {
    if (!errorAction) return C.orange;
    switch (errorAction.type) {
      case "fallback_level":
        return C.error;
      case "show_theory":
        return C.orange;
      default:
        return C.primary;
    }
  };

  const getActionIcon = (): string => {
    if (!errorAction) return "alert-circle";
    switch (errorAction.type) {
      case "fallback_level":
        return "arrow-back-circle";
      case "show_theory":
        return "book";
      default:
        return "refresh";
    }
  };

  const getActionLabel = (): string => {
    if (!errorAction) return "Try Again";
    switch (errorAction.type) {
      case "fallback_level":
        return `Go to Level ${errorAction.targetLevel}`;
      case "show_theory":
        return "Review Theory";
      default:
        return "Try Again";
    }
  };

  const actionColor = getActionColor();

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
      <Animated.View entering={SlideInDown.duration(350)} style={styles.card}>
        {/* Error icon */}
        <View style={[styles.iconCircle, { backgroundColor: actionColor }]}>
          <Ionicons name={getActionIcon() as any} size={32} color={C.white} />
        </View>

        {/* Error text */}
        <Text style={styles.title}>
          {errorAction?.type === "fallback_level"
            ? "Let's go back"
            : errorAction?.type === "show_theory"
              ? "Let's review"
              : "Not quite right"}
        </Text>
        <Text style={styles.message}>{errorMessage}</Text>

        {/* Error count + step info */}
        <View style={styles.stepIndicator}>
          <MaterialCommunityIcons name="alert-circle" size={16} color={actionColor} />
          <Text style={[styles.stepIndicatorText, { color: actionColor }]}>
            Greška {errorAction?.errorCount ?? 1}/{errorAction?.threshold ?? 2}
            {failedAtStep > 0 ? ` · Korak ${failedAtStep}` : ""}
          </Text>
        </View>

        {/* Expected steps */}
        {expectedProcedure.length > 0 && (
          <View style={styles.procedureBox}>
            <Text style={styles.procedureTitle}>Correct procedure:</Text>
            {expectedProcedure.map((step, idx) => (
              <View key={step} style={styles.procedureRow}>
                <View
                  style={[
                    styles.procedureNum,
                    idx + 1 === failedAtStep && {
                      backgroundColor: actionColor,
                    },
                  ]}
                >
                  <Text style={styles.procedureNumText}>{idx + 1}</Text>
                </View>
                <Text
                  style={[
                    styles.procedureStep,
                    idx + 1 === failedAtStep && {
                      color: actionColor,
                      fontFamily: "Inter_700Bold",
                    },
                  ]}
                >
                  {step}
                </Text>
                {idx + 1 === failedAtStep && (
                  <Ionicons name="arrow-back" size={14} color={actionColor} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action info */}
        {errorAction && errorAction.type !== "retry" && (
          <View style={[styles.actionInfo, { borderColor: actionColor }]}>
            <Ionicons
              name={errorAction.type === "fallback_level" ? "arrow-down-circle" : "book"}
              size={18}
              color={actionColor}
            />
            <Text style={[styles.actionInfoText, { color: actionColor }]}>
              {errorAction.message}
            </Text>
          </View>
        )}

        {/* Dismiss button */}
        <TouchableOpacity
          style={[styles.dismissBtn, { backgroundColor: actionColor }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDismiss();
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.dismissBtnText}>{getActionLabel()}</Text>
          <Ionicons name="arrow-forward" size={16} color={C.white} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 24,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: 12,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.text,
    textAlign: "center",
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.cardWrong,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  stepIndicatorText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  procedureBox: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    width: "100%",
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  procedureTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  procedureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  procedureNum: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  procedureNumText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: C.white,
  },
  procedureStep: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.text,
    flex: 1,
  },
  actionInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    width: "100%",
    borderWidth: 1.5,
  },
  actionInfoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  dismissBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: "100%",
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dismissBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.white,
  },
});
