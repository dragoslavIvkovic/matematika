import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { RobotMascot } from "@/components/RobotMascot";
import { TheorySection } from "@/utils/TheoryContent";

const C = Colors.light;

interface TheoryScreenProps {
  theory: TheorySection;
  levelId: string;
  onDismiss: () => void;
}

export function TheoryScreen({ theory, levelId, onDismiss }: TheoryScreenProps) {
  return (
    <View style={styles.overlay}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.levelChip}>
            <MaterialCommunityIcons name="school" size={14} color={C.primary} />
            <Text style={styles.levelChipText}>Level {levelId}</Text>
          </View>
          <Text style={styles.title}>{theory.title}</Text>
          <Text style={styles.subtitle}>{theory.subtitle}</Text>
        </Animated.View>

        {/* Concept — compact, no robot */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.conceptCard}>
          <Text style={styles.conceptText}>{theory.concept}</Text>
        </Animated.View>

        {/* Rules */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.rulesCard}>
          <Text style={styles.sectionTitle}>📐 Key Rules</Text>
          {theory.rules.map((rule, i) => (
            <View
              key={i}
              style={[
                styles.ruleRow,
                rule.highlight && styles.ruleRowHighlight,
              ]}
            >
              <View
                style={[
                  styles.ruleIcon,
                  { backgroundColor: rule.highlight ? C.primary : C.border },
                ]}
              >
                <Ionicons
                  name={rule.icon as any}
                  size={16}
                  color={rule.highlight ? C.white : C.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.ruleText,
                  rule.highlight && styles.ruleTextHighlight,
                ]}
              >
                {rule.text}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Examples */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.examplesSection}>
          <Text style={styles.sectionTitle}>✏️ Examples</Text>
          {theory.examples.map((example, i) => (
            <View key={i} style={styles.exampleCard}>
              <Text style={styles.exampleEquation}>{example.equation}</Text>
              <View style={styles.stepsContainer}>
                {example.steps.map((step, j) => (
                  <View key={j} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepNum,
                        j === example.steps.length - 1 && styles.stepNumFinal,
                      ]}
                    >
                      <Text style={styles.stepNumText}>{j + 1}</Text>
                    </View>
                    <Text
                      style={[
                        styles.stepText,
                        j === example.steps.length - 1 && styles.stepTextFinal,
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.explanationBox}>
                <Ionicons name="bulb" size={14} color={C.warning} />
                <Text style={styles.explanationText}>{example.explanation}</Text>
              </View>
            </View>
          ))}
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
  conceptCard: {
    backgroundColor: C.backgroundAlt,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.primaryLight,
  },
  robotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  conceptBubble: {
    flex: 1,
    backgroundColor: C.backgroundAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.primaryLight,
  },
  conceptText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.primaryDark,
    lineHeight: 20,
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
    fontSize: 17,
    color: C.text,
    marginBottom: 4,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  ruleRowHighlight: {
    backgroundColor: C.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  ruleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.text,
    flex: 1,
    lineHeight: 20,
  },
  ruleTextHighlight: {
    fontFamily: "Inter_600SemiBold",
    color: C.primaryDark,
  },
  examplesSection: {
    gap: 12,
  },
  exampleCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  exampleEquation: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
    textAlign: "center",
    letterSpacing: 1,
  },
  stepsContainer: {
    gap: 6,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumFinal: {
    backgroundColor: C.accent,
  },
  stepNumText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.white,
  },
  stepText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: C.text,
  },
  stepTextFinal: {
    fontFamily: "Inter_700Bold",
    color: C.successDark,
  },
  explanationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.warningLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.warningBorder,
  },
  explanationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.warning,
    flex: 1,
    lineHeight: 18,
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
    fontSize: 14,
    color: C.orangeDark,
    flex: 1,
    lineHeight: 20,
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
