import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import Colors from "@/constants/colors";
import type { TheorySection } from "@/utils/TheoryContent";

const C = Colors.light;

/** Splits "general form" steps from the numeric example when data uses an "Example:" line. */
function splitExampleSteps(steps: string[]): { formSteps: string[]; workedSteps: string[] } {
  const idx = steps.findIndex((s) => s.trim() === "Example:");
  if (idx === -1) {
    return { formSteps: steps, workedSteps: [] };
  }
  return {
    formSteps: steps.slice(0, idx),
    workedSteps: steps.slice(idx + 1),
  };
}

function StepList({
  steps,
  startIndex,
  listKey,
  highlightLast = true,
}: {
  steps: string[];
  startIndex: number;
  /** Stable prefix for row keys (avoids index-only keys). */
  listKey: string;
  /** Green accent on the last line (e.g. final x = answer). */
  highlightLast?: boolean;
}) {
  return (
    <View style={styles.stepList}>
      {steps.map((step, j) => {
        const isLast = j === steps.length - 1;
        const showSuccess = highlightLast && isLast;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: steps are static ordered content; j disambiguates duplicate lines
          <View key={`${listKey}-${j}`} style={styles.stepRow}>
            <View style={[styles.stepNum, showSuccess && styles.stepNumFinal]}>
              <Text style={styles.stepNumText}>{startIndex + j + 1}</Text>
            </View>
            <Text style={[styles.stepText, showSuccess && styles.stepTextFinal]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}

interface TheoryScreenProps {
  theory: TheorySection;
  levelId: string;
  onDismiss: () => void;
}

export function TheoryScreen({ theory, levelId, onDismiss }: TheoryScreenProps) {
  return (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.levelChip}>
            <MaterialCommunityIcons name="school" size={14} color={C.primary} />
            <Text style={styles.levelChipText}>Level {levelId}</Text>
          </View>
          <Text style={styles.title}>{theory.title}</Text>
          <Text style={styles.subtitle}>{theory.subtitle}</Text>
        </Animated.View>

        {/* Concept — short cards so text isn’t one long block */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.conceptGroup}>
          <Text style={styles.sectionLabel}>Idea</Text>
          {theory.concept
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((paragraph) => (
              <View key={paragraph} style={styles.conceptCard}>
                <Text style={styles.conceptText}>{paragraph}</Text>
              </View>
            ))}
        </Animated.View>

        {/* Rules */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.rulesCard}>
          <Text style={styles.sectionTitle}>📐 Key Rules</Text>
          {theory.rules.map((rule) => (
            <View
              key={rule.text}
              style={[styles.ruleRow, rule.highlight && styles.ruleRowHighlight]}
            >
              <View
                style={[
                  styles.ruleIcon,
                  { backgroundColor: rule.highlight ? C.primary : C.border },
                ]}
              >
                <Ionicons
                  // biome-ignore lint/suspicious/noExplicitAny: dynamic rule icons from data
                  name={rule.icon as any}
                  size={16}
                  color={rule.highlight ? C.white : C.textSecondary}
                />
              </View>
              <Text style={[styles.ruleText, rule.highlight && styles.ruleTextHighlight]}>
                {rule.text}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Examples */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.examplesSection}
        >
          <Text style={styles.sectionTitle}>✏️ Examples</Text>
          {theory.examples.map((example) => {
            const { formSteps, workedSteps } = splitExampleSteps(example.steps);
            const hasSplit = workedSteps.length > 0;
            return (
              <View key={example.equation} style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>{example.equation}</Text>

                {hasSplit ? (
                  <View style={styles.splitBlocks}>
                    <View style={styles.insetBlock}>
                      <Text style={styles.insetLabel}>In symbols</Text>
                      <View style={styles.insetCard}>
                        <StepList
                          listKey={`${example.equation}-form`}
                          steps={formSteps}
                          startIndex={0}
                          highlightLast={false}
                        />
                      </View>
                    </View>
                    <View style={styles.insetBlock}>
                      <Text style={styles.insetLabel}>With numbers</Text>
                      <View style={[styles.insetCard, styles.insetCardNumbered]}>
                        <StepList
                          listKey={`${example.equation}-worked`}
                          steps={workedSteps}
                          startIndex={formSteps.length}
                          highlightLast
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.insetCard}>
                    <StepList
                      listKey={`${example.equation}-all`}
                      steps={formSteps}
                      startIndex={0}
                      highlightLast
                    />
                  </View>
                )}

                <View style={styles.explanationBox}>
                  <Ionicons name="bulb" size={14} color={C.warning} />
                  <Text style={styles.explanationText}>{example.explanation}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Tip */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.tipCard}>
          <Ionicons name="sparkles" size={18} color={C.orange} />
          <Text style={styles.tipText}>{theory.tip}</Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDismiss();
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>Got it, let's practice!</Text>
            <Ionicons name="arrow-forward" size={18} color={C.white} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 12,
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
  },
  levelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.primaryLight,
  },
  levelChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.primary,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: C.textSecondary,
    textAlign: "center",
  },
  conceptGroup: {
    alignSelf: "stretch",
    gap: 8,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  conceptCard: {
    backgroundColor: C.backgroundAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: C.primaryLight,
  },
  conceptText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.primaryDark,
    lineHeight: 24,
  },
  rulesCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: C.text,
    marginBottom: 8,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
  },
  ruleRowHighlight: {
    backgroundColor: C.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: -10,
  },
  ruleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  ruleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.text,
    flex: 1,
    flexShrink: 1,
    lineHeight: 24,
  },
  ruleTextHighlight: {
    fontFamily: "Inter_600SemiBold",
    color: C.primaryDark,
  },
  examplesSection: {
    alignSelf: "stretch",
    gap: 12,
  },
  exampleCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  exampleTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    lineHeight: 24,
    color: C.text,
    textAlign: "left" as const,
  },
  splitBlocks: {
    gap: 14,
  },
  insetBlock: {
    gap: 6,
  },
  insetLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  insetCard: {
    backgroundColor: C.backgroundAlt,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  insetCardNumbered: {
    backgroundColor: C.surface,
    borderColor: C.accent,
    borderWidth: 1.5,
  },
  stepList: {
    gap: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNum: {
    minWidth: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumFinal: {
    backgroundColor: C.accent,
  },
  stepNumText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: C.white,
  },
  stepText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.text,
    lineHeight: 24,
    flex: 1,
    flexShrink: 1,
  },
  stepTextFinal: {
    fontFamily: "Inter_700Bold",
    color: C.successDark,
  },
  explanationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.warningLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.warningBorder,
  },
  explanationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.warning,
    flex: 1,
    flexShrink: 1,
    lineHeight: 22,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.orangeLighter,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: C.orangeSubtle,
  },
  tipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.orangeDark,
    flex: 1,
    flexShrink: 1,
    lineHeight: 24,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.accent,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.white,
  },
});
