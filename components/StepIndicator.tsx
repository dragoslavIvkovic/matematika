import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.light;

interface Step {
  id: string;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  onStepPress?: (stepId: string) => void;
}

export function StepIndicator({ steps, onStepPress }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <TouchableOpacity
            style={[
              styles.step,
              step.isActive && styles.stepActive,
              step.isCompleted && styles.stepCompleted,
            ]}
            onPress={() => onStepPress?.(step.id)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.dot,
                step.isActive && styles.dotActive,
                step.isCompleted && styles.dotCompleted,
              ]}
            >
              {step.isCompleted ? (
                <Text style={styles.dotCheckmark}>✓</Text>
              ) : (
                <Text style={[styles.dotNumber, step.isActive && styles.dotNumberActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                step.isActive && styles.stepLabelActive,
                step.isCompleted && styles.stepLabelCompleted,
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </TouchableOpacity>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.connector,
                steps[index + 1].isCompleted || steps[index + 1].isActive
                  ? styles.connectorActive
                  : {},
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: C.border,
    marginHorizontal: 4,
  },
  connectorActive: {
    backgroundColor: C.accent,
  },
  step: {
    alignItems: "center",
    gap: 4,
    minWidth: 52,
  },
  stepActive: {},
  stepCompleted: {},
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  dotCompleted: {
    backgroundColor: C.accent,
  },
  dotNumber: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.textMuted,
  },
  dotNumberActive: {
    color: C.white,
  },
  dotCheckmark: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.white,
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: C.textMuted,
    textAlign: "center",
  },
  stepLabelActive: {
    fontFamily: "Inter_600SemiBold",
    color: C.primary,
  },
  stepLabelCompleted: {
    color: C.accent,
  },
});
