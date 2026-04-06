import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { RobotMascot } from "@/components/RobotMascot";
import { MathKeyboard } from "@/components/MathKeyboard";
import {
  generateProblem,
  GeneratedProblem,
  LEVEL_CONFIGS,
  LevelId,
} from "@/utils/ProblemGenerator";
import { EquationStepValidator } from "@/utils/EquationStepValidator";

const C = Colors.light;

// Assessment: 2 problems per level, test from 1.1 up to 1.6
const PROBLEMS_PER_LEVEL = 2;

interface AssessmentResult {
  level: string;
  correct: number;
  total: number;
}

interface AssessmentModeProps {
  onComplete: (recommendedLevel: LevelId, results: AssessmentResult[]) => void;
  onCancel: () => void;
}

export function AssessmentMode({ onComplete, onCancel }: AssessmentModeProps) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<"intro" | "testing" | "results">("intro");
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [problemNum, setProblemNum] = useState(0);
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [typedAnswers, setTypedAnswers] = useState<string[]>([""]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [currentLevelCorrect, setCurrentLevelCorrect] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const startTest = useCallback(() => {
    setPhase("testing");
    const level = LEVEL_CONFIGS[0];
    const ops = level.operations;
    const op = ops[0];
    setProblem(generateProblem(level.id, op));
    setCurrentLevelIdx(0);
    setProblemNum(0);
    setCurrentLevelCorrect(0);
    setResults([]);
    setTypedAnswers([""]);
  }, []);

  const moveToNext = useCallback(
    (wasCorrect: boolean) => {
      const newCorrect = wasCorrect ? currentLevelCorrect + 1 : currentLevelCorrect;
      const nextProblemNum = problemNum + 1;

      if (nextProblemNum >= PROBLEMS_PER_LEVEL) {
        // Level done, record results
        const levelConfig = LEVEL_CONFIGS[currentLevelIdx];
        const newResults = [
          ...results,
          {
            level: levelConfig.id,
            correct: newCorrect,
            total: PROBLEMS_PER_LEVEL,
          },
        ];
        setResults(newResults);

        // Move to next level or finish
        const nextLevelIdx = currentLevelIdx + 1;
        if (nextLevelIdx >= LEVEL_CONFIGS.length) {
          // All levels tested — calculate recommended level
          let recommended: LevelId = "1.1";
          for (const r of newResults) {
            if (r.correct === r.total) {
              // Passed this level, recommend the next one
              const idx = LEVEL_CONFIGS.findIndex((l) => l.id === r.level);
              if (idx < LEVEL_CONFIGS.length - 1) {
                recommended = LEVEL_CONFIGS[idx + 1].id;
              }
            } else {
              break;
            }
          }
          setPhase("results");
          // Wait a moment for the results to render
          setTimeout(() => onComplete(recommended, newResults), 0);
          return;
        }

        setCurrentLevelIdx(nextLevelIdx);
        setProblemNum(0);
        setCurrentLevelCorrect(0);
        const nextLevel = LEVEL_CONFIGS[nextLevelIdx];
        const ops = nextLevel.operations;
        setProblem(generateProblem(nextLevel.id, ops[0]));
      } else {
        // Same level, next problem
        setProblemNum(nextProblemNum);
        setCurrentLevelCorrect(newCorrect);
        const levelConfig = LEVEL_CONFIGS[currentLevelIdx];
        const ops = levelConfig.operations;
        const nextOp = ops[nextProblemNum % ops.length];
        setProblem(generateProblem(levelConfig.id, nextOp));
      }
      setTypedAnswers([""]);
      setTimeout(() => inputRef.current?.focus(), 200);
    },
    [problemNum, currentLevelIdx, currentLevelCorrect, results, onComplete]
  );

  const handleCheck = useCallback(() => {
    if (!problem) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const validation = EquationStepValidator.validate(
      typedAnswers,
      problem.level,
      problem.type,
      problem.a,
      problem.b,
      problem.c,
      problem.variable
    );

    if (validation.isValid && validation.isComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      moveToNext(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      moveToNext(false);
    }
  }, [typedAnswers, problem, moveToNext]);

  const handleKeyboardKeyPress = (key: string) => {
    const newAns = [...typedAnswers];
    let char = key;
    if (key === "×") char = "*";
    if (key === "÷") char = "/";
    newAns[activeInputIndex] = (newAns[activeInputIndex] || "") + char;
    setTypedAnswers(newAns);
  };

  const handleKeyboardDelete = () => {
    const newAns = [...typedAnswers];
    if (newAns[activeInputIndex].length > 0) {
      newAns[activeInputIndex] = newAns[activeInputIndex].slice(0, -1);
      setTypedAnswers(newAns);
    }
  };

  const requiredLines = problem ? EquationStepValidator.getRequiredLines(problem.level) : 1;

  const handleKeyboardSubmit = () => {
    if (
      activeInputIndex === typedAnswers.length - 1 &&
      typedAnswers.length < requiredLines &&
      typedAnswers[activeInputIndex].trim()
    ) {
      setTypedAnswers((prev) => [...prev, ""]);
      setActiveInputIndex((prev) => prev + 1);
    } else {
      setIsKeyboardVisible(false);
      inputRef.current?.blur();
      handleCheck();
    }
  };

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    moveToNext(false);
  }, [moveToNext]);

  // ── Intro Phase ──
  if (phase === "intro") {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.introContent}>
          <RobotMascot size={90} />
          <Text style={styles.introTitle}>Assessment Test</Text>
          <Text style={styles.introSubtitle}>
            I'll give you a few problems from each level to find out where you
            should start. Don't worry — this is just to help you!
          </Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color={C.primary} />
              <Text style={styles.infoText}>
                {LEVEL_CONFIGS.length * PROBLEMS_PER_LEVEL} problems total
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="eye-off" size={16} color={C.primary} />
              <Text style={styles.infoText}>
                No hints or step-by-step help during the test
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="bar-chart" size={16} color={C.primary} />
              <Text style={styles.infoText}>
                Results shown at the end with your recommended level
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={startTest}
            activeOpacity={0.9}
          >
            <Text style={styles.startBtnText}>Start Assessment</Text>
            <Ionicons name="arrow-forward" size={18} color={C.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Skip, let me choose</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Results Phase ──
  if (phase === "results") {
    return (
      <ScrollView contentContainerStyle={styles.resultsContent}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.resultsHeader}>
          <RobotMascot size={70} />
          <Text style={styles.resultsTitle}>Assessment Complete!</Text>
          <Text style={styles.resultsSubtitle}>Here's how you did:</Text>
        </Animated.View>

        {results.map((r, i) => {
          const passed = r.correct === r.total;
          return (
            <Animated.View
              key={r.level}
              entering={FadeInDown.delay(100 + i * 60).duration(400)}
              style={[
                styles.resultCard,
                { borderLeftColor: passed ? C.accent : C.errorLight, borderLeftWidth: 4 },
              ]}
            >
              <View style={styles.resultCardLeft}>
                <Text style={styles.resultLevel}>Level {r.level}</Text>
                <Text style={styles.resultLevelName}>
                  {LEVEL_CONFIGS[i]?.name || ""}
                </Text>
              </View>
              <View style={styles.resultCardRight}>
                <View
                  style={[
                    styles.resultBadge,
                    {
                    backgroundColor: passed ? C.cardCorrect : C.errorLighter,
                    borderColor: passed ? C.cardCorrectBorder : C.errorLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.resultBadgeText,
                      { color: passed ? C.successDark : C.errorDark },
                    ]}
                  >
                    {r.correct}/{r.total}
                  </Text>
                </View>
                {passed ? (
                  <Ionicons name="checkmark-circle" size={20} color={C.accent} />
                ) : (
                  <Ionicons name="close-circle" size={20} color={C.errorLight} />
                )}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    );
  }

  // ── Testing Phase ──
  const currentLevel = LEVEL_CONFIGS[currentLevelIdx];
  const totalProblems = LEVEL_CONFIGS.length * PROBLEMS_PER_LEVEL;
  const currentProblemGlobal = currentLevelIdx * PROBLEMS_PER_LEVEL + problemNum + 1;

  return (
    <View style={styles.container}>
      <View style={styles.testContent}>
        {/* Progress header */}
        <View style={styles.testHeader}>
          <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <View style={styles.testProgress}>
            <Text style={styles.testProgressText}>
              {currentProblemGlobal} / {totalProblems}
            </Text>
          </View>
          <View style={styles.testLevelChip}>
            <Text style={styles.testLevelText}>Level {currentLevel.id}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentProblemGlobal / totalProblems) * 100}%` },
            ]}
          />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && { paddingBottom: 380 },
          ]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* Problem */}
          {problem && (
            <Animated.View
              key={`${problem.equation}-${currentProblemGlobal}`}
              entering={FadeIn.duration(300)}
              style={styles.testEquationCard}
            >
              <Text style={styles.testEquationLabel}>Solve</Text>
              <Text style={styles.testEquation}>{problem.equation}</Text>
            </Animated.View>
          )}

          {/* Input */}
          <Animated.View entering={SlideInDown.duration(300)} style={styles.testInputCard}>
            {typedAnswers.map((ans, idx) => (
              <TextInput
                key={`input-${idx}`}
                ref={idx === typedAnswers.length - 1 ? inputRef : undefined}
                style={styles.testInput}
                placeholder={`Step ${idx + 1}...`}
                placeholderTextColor={C.textMuted}
                value={ans}
                onFocus={() => {
                  setActiveInputIndex(idx);
                  setIsKeyboardVisible(true);
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                      y: idx * 40,
                      animated: true,
                    });
                  }, 100);
                }}
                showSoftInputOnFocus={false}
                caretHidden={false}
                onChangeText={(text) => {
                  const newAns = [...typedAnswers];
                  newAns[idx] = text;
                  setTypedAnswers(newAns);
                }}
                onSubmitEditing={() => {
                  if (
                    idx === typedAnswers.length - 1 &&
                    typedAnswers.length < requiredLines &&
                    ans.trim()
                  ) {
                    setTypedAnswers((prev) => [...prev, ""]);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }
                }}
                autoFocus={idx === typedAnswers.length - 1}
                autoCapitalize="none"
                autoCorrect={false}
              />
            ))}

            {typedAnswers.length < requiredLines && (
              <TouchableOpacity
                style={styles.addRowBtn}
                onPress={() => {
                  if (typedAnswers[typedAnswers.length - 1]?.trim()) {
                    setTypedAnswers((prev) => [...prev, ""]);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }
                }}
              >
                <Ionicons name="add" size={16} color={C.primary} />
                <Text style={styles.addRowText}>Add step</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Buttons */}
          <View style={styles.testActions}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkBtn}
              onPress={handleCheck}
              activeOpacity={0.9}
            >
              <Ionicons name="checkmark" size={18} color={C.white} />
              <Text style={styles.checkBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <MathKeyboard
        isVisible={isKeyboardVisible}
        onKeyPress={handleKeyboardKeyPress}
        onDelete={handleKeyboardDelete}
        onSubmit={handleKeyboardSubmit}
        onClose={() => {
          setIsKeyboardVisible(false);
          inputRef.current?.blur();
        }}
        bottomOffset={Platform.OS === "ios" ? 49 + insets.bottom : 60}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  introContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  introTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.text,
    textAlign: "center",
  },
  introSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  infoBox: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    width: "100%",
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.text,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignSelf: "stretch",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.white,
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.textSecondary,
  },
  // Results
  resultsContent: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  resultsHeader: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  resultsTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
  },
  resultsSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  resultCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resultCardLeft: {
    gap: 2,
  },
  resultLevel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.textSecondary,
  },
  resultLevelName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.textMuted,
  },
  resultCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  resultBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  // Testing
  testContent: {
    flex: 1,
    gap: 12,
  },
  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  testProgress: {
    backgroundColor: C.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  testProgressText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: C.primary,
  },
  testLevelChip: {
    backgroundColor: C.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.warningBorder,
  },
  testLevelText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.warning,
  },
  progressBar: {
    height: 4,
    backgroundColor: C.border,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.primary,
    borderRadius: 2,
  },
  testEquationCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 22,
    marginHorizontal: 16,
    gap: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  testEquationLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  testEquation: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: C.text,
    letterSpacing: 1,
  },
  testInputCard: {
    marginHorizontal: 16,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  testInput: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: C.text,
    backgroundColor: C.background,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: C.primaryLight,
  },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "center",
    paddingVertical: 6,
  },
  addRowText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.primary,
  },
  testActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.textSecondary,
  },
  checkBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.white,
  },
});
