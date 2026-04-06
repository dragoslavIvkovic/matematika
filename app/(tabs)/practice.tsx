import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { RobotMascot } from "@/components/RobotMascot";
import { TheoryScreen } from "@/components/TheoryScreen";
import { LevelSelector } from "@/components/LevelSelector";
import { AssessmentMode } from "@/components/AssessmentMode";
import { ErrorFeedbackModal } from "@/components/ErrorFeedbackModal";
import { MathKeyboard } from "@/components/MathKeyboard";
import { EquationStepValidator } from "@/utils/EquationStepValidator";
import {
  generateProblem,
  GeneratedProblem,
  LevelId,
  getLevelConfig,
  LEVEL_CONFIGS,
} from "@/utils/ProblemGenerator";
import { LevelManager, ErrorAction } from "@/utils/LevelManager";
import { getTheoryContent } from "@/utils/TheoryContent";

const C = Colors.light;

type ScreenMode =
  | "loading"
  | "level_select"
  | "assessment"
  | "theory"
  | "practice"
  | "level_complete";

// ── Bounce Dot for checking animation ──
function BounceDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);
  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(-12, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) })
      ),
      -1
    );
  }, [delay]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return <Animated.View style={[checkStyles.dot, style]} />;
}

function CheckingAnimation() {
  return (
    <View style={checkStyles.container}>
      <BounceDot delay={0} />
      <BounceDot delay={200} />
      <BounceDot delay={400} />
    </View>
  );
}

const checkStyles = StyleSheet.create({
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
    backgroundColor: C.primary,
  },
});

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { action } = useLocalSearchParams();
  const [mode, setMode] = useState<ScreenMode>("loading");
  // Use ref for manager (mutable class) + counter to force re-renders
  const managerRef = useRef<LevelManager | null>(null);
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [typedAnswers, setTypedAnswers] = useState<string[]>([""]);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    message: string;
    procedure: string[];
    failedAtStep: number;
    action: ErrorAction | null;
  } | null>(null);
  const [levelCompleteInfo, setLevelCompleteInfo] = useState<{
    fromLevel: string;
    toLevel?: string;
  } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const resultScale = useSharedValue(0);
  const resultOpacity = useSharedValue(0);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(0);

  const notebookScrollViewRef = useRef<ScrollView>(null);

  const resultCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultOpacity.value,
  }));

  // ── Generate new problem ──
  const generateNew = useCallback(
    (mgr: LevelManager) => {
      const level = mgr.getCurrentLevel();
      const op = mgr.getNextOperationType();
      const newProblem = generateProblem(level, op);
      setProblem(newProblem);
      setTypedAnswers([""]);
      setIsChecking(false);
      setIsCorrect(null);
      resultScale.value = 0;
      resultOpacity.value = 0;
      rerender();
    },
    [rerender]
  );

  // ── Start practicing a level ──
  const startPractice = useCallback(
    (mgr: LevelManager) => {
      if (mgr.needsTheoryDisplay()) {
        setMode("theory");
      } else {
        generateNew(mgr);
        setMode("practice");
      }
    },
    [generateNew]
  );

  // ── Load manager on focus ──
  useFocusEffect(
    useCallback(() => {
      LevelManager.load().then((mgr) => {
        managerRef.current = mgr;
        rerender();
        if (action === "start") {
          router.setParams({ action: "" }); // Consume the action so we don't loop
          startPractice(mgr);
        } else {
          setMode((prev) => (prev === "loading" ? "level_select" : prev));
        }
      });
    }, [rerender, action, startPractice])
  );

  // ── Handle level selection ──
  const handleSelectLevel = useCallback(
    (level: LevelId) => {
      const mgr = managerRef.current;
      if (!mgr) return;
      mgr.setCurrentLevel(level);
      mgr.save();
      rerender();
      startPractice(mgr);
    },
    [startPractice, rerender]
  );

  // ── Handle theory dismiss ──
  const handleTheoryDismiss = useCallback(() => {
    const mgr = managerRef.current;
    if (!mgr) return;
    mgr.markTheoryShown();
    mgr.save();
    generateNew(mgr);
    setMode("practice");
  }, [generateNew]);

  // ── Handle assessment complete ──
  const handleAssessmentComplete = useCallback(
    (recommendedLevel: LevelId) => {
      const mgr = managerRef.current;
      if (!mgr) return;
      Alert.alert(
        "Assessment Complete!",
        `Based on your results, we recommend starting at Level ${recommendedLevel}: ${getLevelConfig(recommendedLevel).name}`,
        [
          {
            text: `Start Level ${recommendedLevel}`,
            onPress: () => {
              mgr.setCurrentLevel(recommendedLevel);
              mgr.save();
              rerender();
              startPractice(mgr);
            },
          },
          {
            text: "Choose My Own",
            style: "cancel",
            onPress: () => setMode("level_select"),
          },
        ]
      );
    },
    [startPractice, rerender]
  );

  // ── Check answer ──
  const handleCheck = useCallback(() => {
    const mgr = managerRef.current;
    if (!problem || !mgr) return;
    const lastInput = typedAnswers[typedAnswers.length - 1];
    if (!lastInput?.trim() && typedAnswers.length === 1) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsChecking(true);

    setTimeout(() => {
      const validation = EquationStepValidator.validate(
        typedAnswers,
        problem.level,
        problem.type,
        problem.a,
        problem.b,
        problem.c,
        problem.variable
      );

      if (validation.isValid) {
        if (validation.isComplete) {
          // ✅ Correct!
          setIsCorrect(true);
          setIsChecking(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          const result = mgr.recordCorrect(problem.type);
          mgr.save();
          rerender();

          if (result.levelComplete) {
            setLevelCompleteInfo({
              fromLevel: problem.level,
              toLevel: result.newLevel,
            });
            setTimeout(() => setMode("level_complete"), 1500);
          }

          resultScale.value = withSpring(1, { damping: 12, stiffness: 180 });
          resultOpacity.value = withTiming(1, { duration: 250 });
        } else {
          // Partially correct, need more steps
          setIsChecking(false);
          Alert.alert(
            "Keep going!",
            validation.message || "Correct so far, but the solution isn't complete. Add more steps."
          );
        }
      } else {
        // ❌ Error
        setIsChecking(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        const failedStep = validation.failedAtStep || 1;
        const errorAction = mgr.recordError(failedStep);
        mgr.save();
        rerender();

        setErrorModal({
          visible: true,
          message:
            validation.modalMessage || "That's not correct. Check your work.",
          procedure: validation.expectedProcedure || [],
          failedAtStep: failedStep,
          action: errorAction,
        });
      }
    }, 800);
  }, [typedAnswers, problem, rerender]);

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

  const handleKeyboardSubmit = () => {
    const problem_ = problem;
    if (!problem_) return;

    const requiredSteps = problem_.requiredSteps;

    if (
      activeInputIndex === typedAnswers.length - 1 &&
      typedAnswers.length < requiredSteps &&
      typedAnswers[activeInputIndex].trim()
    ) {
      setTypedAnswers((prev) => [...prev, ""]);
      setActiveInputIndex((prev) => prev + 1);
    } else {
      setIsKeyboardVisible(false);
      handleCheck();
    }
  };

  // ── Handle error modal dismiss ──
  const handleErrorDismiss = useCallback(() => {
    const mgr = managerRef.current;
    if (!mgr || !errorModal) return;
    const action = errorModal.action;
    setErrorModal(null);

    if (action?.type === "show_theory") {
      setMode("theory");
    } else if (action?.type === "fallback_level") {
      rerender();
      startPractice(mgr);
    } else {
      // Just retry
      generateNew(mgr);
    }
  }, [errorModal, startPractice, generateNew, rerender]);

  // ── Handle next problem ──
  const handleNextProblem = useCallback(() => {
    const mgr = managerRef.current;
    if (!mgr) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    generateNew(mgr);
  }, [generateNew]);

  // ── Handle level complete dismiss ──
  const handleLevelCompleteDismiss = useCallback(() => {
    const mgr = managerRef.current;
    if (!mgr) return;
    setLevelCompleteInfo(null);
    const config = getLevelConfig(mgr.getCurrentLevel());
    if (config.hasTheory && mgr.needsTheoryDisplay()) {
      setMode("theory");
    } else {
      generateNew(mgr);
      setMode("practice");
    }
  }, [generateNew]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 84 : insets.bottom;

  // ── Loading ──
  if (mode === "loading" || !managerRef.current) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.loadingCenter}>
          <RobotMascot size={80} isThinking />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const manager = managerRef.current;
  const state = manager.getState();

  // ── Level Select ──
  if (mode === "level_select") {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <LevelSelector
          completedLevels={state.completedLevels}
          currentLevel={state.currentLevel}
          onSelectLevel={handleSelectLevel}
          onStartAssessment={() => setMode("assessment")}
          levelStats={state.levelStats}
        />
      </View>
    );
  }

  // ── Assessment ──
  if (mode === "assessment") {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <AssessmentMode
          onComplete={handleAssessmentComplete}
          onCancel={() => setMode("level_select")}
        />
      </View>
    );
  }

  // ── Theory ──
  if (mode === "theory") {
    const theory = getTheoryContent(state.currentLevel);
    if (theory) {
      return (
        <View style={[styles.container, { paddingTop: topPad }]}>
          <TheoryScreen
            theory={theory}
            levelId={state.currentLevel}
            onDismiss={handleTheoryDismiss}
          />
        </View>
      );
    }
    // If no theory, go directly to practice
    handleTheoryDismiss();
    return null;
  }

  // ── Level Complete ──
  if (mode === "level_complete") {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.levelCompleteCenter}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.levelCompleteContent}>
            <View style={styles.celebrationIcon}>
              <Ionicons name="trophy" size={48} color={C.white} />
            </View>
            <Text style={styles.levelCompleteTitle}>Level Complete! 🎉</Text>
            <Text style={styles.levelCompleteMessage}>
              You've mastered Level {levelCompleteInfo?.fromLevel}!
              {levelCompleteInfo?.toLevel
                ? `\n\nNext up: Level ${levelCompleteInfo.toLevel} — ${getLevelConfig(levelCompleteInfo.toLevel as LevelId).name}`
                : "\n\nYou've completed all levels! Amazing work!"}
            </Text>

            <View style={styles.levelCompleteStats}>
              <View style={styles.lcStatItem}>
                <Text style={styles.lcStatValue}>{state.totalSolved}</Text>
                <Text style={styles.lcStatLabel}>Total Solved</Text>
              </View>
              <View style={styles.lcStatDivider} />
              <View style={styles.lcStatItem}>
                <Text style={styles.lcStatValue}>
                  {state.completedLevels.length}/{LEVEL_CONFIGS.length}
                </Text>
                <Text style={styles.lcStatLabel}>Levels Done</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.lcContinueBtn}
              onPress={handleLevelCompleteDismiss}
              activeOpacity={0.9}
            >
              <Text style={styles.lcContinueBtnText}>
                {levelCompleteInfo?.toLevel ? "Continue" : "Back to Levels"}
              </Text>
              <Ionicons
                name={levelCompleteInfo?.toLevel ? "arrow-forward" : "grid"}
                size={18}
                color={C.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lcBackBtn}
              onPress={() => setMode("level_select")}
              activeOpacity={0.7}
            >
              <Text style={styles.lcBackBtnText}>Choose a different level</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Practice Mode ──
  const currentConfig = getLevelConfig(state.currentLevel);
  const isAnswered = isCorrect !== null;
  const streakProgress = manager.getStreakProgress();
  const requiredLines = problem
    ? EquationStepValidator.getRequiredLines(problem.level)
    : 1;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* ── Compact Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backToLevelsBtn}
          onPress={() => setMode("level_select")}
          activeOpacity={0.7}
        >
          <Ionicons name="grid" size={16} color={C.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {state.currentLevel} · {currentConfig.name}
          </Text>
          <View style={styles.miniProgressBar}>
            <View
              style={[
                styles.miniProgressFill,
                { width: `${streakProgress.percent}%` },
              ]}
            />
          </View>
          <Text style={styles.headerSub}>
            {streakProgress.current}/{streakProgress.required} correct
          </Text>
        </View>
        {state.consecutiveErrors > 0 && (
          <View style={styles.errorBadge}>
            <Ionicons name="alert-circle" size={12} color={C.errorDark} />
            <Text style={styles.errorBadgeText}>{state.consecutiveErrors}</Text>
          </View>
        )}
      </View>

      <ScrollView
        ref={notebookScrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isKeyboardVisible && { paddingBottom: 380 },
        ]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Problem ── */}
        {problem && (
          <Animated.View
            key={`problem-${problem.equation}`}
            entering={FadeInDown.delay(120).duration(400)}
            style={styles.equationCard}
          >
            <Text style={styles.equationLabel}>
              {problem.requiredSteps === 1 ? "Calculate" : "Solve step by step"}
            </Text>
            <Text style={styles.equationText}>{problem.equation}</Text>
          </Animated.View>
        )}

        {/* ── Notebook Input ── */}
        {!isAnswered && !isChecking && problem && (
          <Animated.View
            entering={SlideInDown.duration(350)}
            exiting={SlideOutDown.duration(250)}
            style={styles.notebookInputCard}
          >
            {/* Notebook lines */}
            {Array.from({
              length: Math.max(8, requiredLines + 1),
            }).map((_, i) => (
              <View
                key={`nb-line-${i}`}
                style={[styles.notebookLine, { top: 40 + i * 46 }]}
              />
            ))}
            {/* Red margin line */}
            <View style={styles.marginLine} />

            <View style={styles.typeInputHeader}>
              <Text style={styles.typeInputLabel}>
                {requiredLines === 1 ? "Your answer" : "Solve step by step"}
              </Text>
            </View>
            <View style={{ gap: 0, paddingTop: 10 }}>
              {typedAnswers.map((ans, idx) => (
                <View key={`row-${idx}`} style={styles.notebookInputRow}>
                  {(typedAnswers.length > 1 || ans.length > 0) && (
                    <TouchableOpacity
                      style={styles.deleteRowBtn}
                      onPress={() => {
                        if (typedAnswers.length === 1) {
                          setTypedAnswers([""]);
                        } else {
                          const newAns = [...typedAnswers];
                          newAns.splice(idx, 1);
                          setTypedAnswers(newAns);
                        }
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={C.errorLight}
                      />
                    </TouchableOpacity>
                  )}
                  <TextInput
                    ref={idx === typedAnswers.length - 1 ? inputRef : undefined}
                    style={styles.notebookTextInput}
                    placeholder={
                      requiredLines === 1
                        ? "Type your answer..."
                        : `Step ${idx + 1}...`
                    }
                    placeholderTextColor={C.textMuted}
                    value={ans}
                    onFocus={() => {
                      setActiveInputIndex(idx);
                      setIsKeyboardVisible(true);
                      // Scroll to ensure the input is visible above keyboard
                      setTimeout(() => {
                        notebookScrollViewRef.current?.scrollTo({
                          y: 200 + idx * 46,
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
                      } else {
                        handleCheck();
                      }
                    }}
                    autoFocus={idx === typedAnswers.length - 1}
                    returnKeyType={
                      idx === typedAnswers.length - 1 ? "done" : "next"
                    }
                    keyboardType={
                      requiredLines === 1 ? "number-pad" : "default"
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                  />
                  {idx === typedAnswers.length - 1 &&
                    typedAnswers.length < requiredLines && (
                      <TouchableOpacity
                        style={[
                          styles.notebookAddBtn,
                          !ans.trim() && styles.notebookAddBtnDisabled,
                        ]}
                        onPress={() => {
                          setTypedAnswers((prev) => [...prev, ""]);
                          setTimeout(() => inputRef.current?.focus(), 100);
                        }}
                        disabled={!ans.trim()}
                        activeOpacity={0.9}
                      >
                        <Ionicons name="arrow-down" size={18} color={C.white} />
                      </TouchableOpacity>
                    )}
                </View>
              ))}
            </View>

            {/* Check Button */}
            <View style={styles.notebookActions}>
              <TouchableOpacity
                style={[
                  styles.checkAnswerBtn,
                  { flex: 1, justifyContent: "center" },
                ]}
                onPress={handleCheck}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={C.white}
                />
                <Text style={styles.checkAnswerBtnText}>Check Answer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Checking Animation ── */}
        {isChecking && (
          <View style={styles.middleArea}>
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.checkingArea}
            >
              <RobotMascot size={70} isThinking />
              <Text style={styles.checkingLabel}>Checking your answer...</Text>
              <CheckingAnimation />
            </Animated.View>
          </View>
        )}

        {/* ── Correct Result ── */}
        {isAnswered && isCorrect && problem && (
          <View style={styles.middleArea}>
            <Animated.View
              style={[
                styles.resultCard,
                resultCardStyle,
                {
                  backgroundColor: C.cardCorrect,
                  borderColor: C.cardCorrectBorder,
                },
              ]}
            >
              <View style={styles.resultHeader}>
                <View
                  style={[
                    styles.resultIconCircle,
                    { backgroundColor: C.accent },
                  ]}
                >
                  <Ionicons name="checkmark" size={24} color={C.white} />
                </View>
                <View style={styles.resultTextBlock}>
                  <Text style={styles.resultTitle}>Correct! 🎉</Text>
                  <Text style={styles.resultMessage}>
                    Great work — you solved it!
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.nextProblemBtn}
                onPress={handleNextProblem}
                activeOpacity={0.9}
              >
                <Text style={styles.nextProblemBtnText}>Next Problem</Text>
                <Ionicons name="arrow-forward" size={16} color={C.white} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </ScrollView>

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

      {/* ── Error Modal ── */}
      {errorModal && errorModal.visible && (
        <ErrorFeedbackModal
          visible={errorModal.visible}
          errorMessage={errorModal.message}
          failedAtStep={errorModal.failedAtStep}
          expectedProcedure={errorModal.procedure}
          errorAction={errorModal.action}
          onDismiss={handleErrorDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  inner: {
    flex: 1,
    flexDirection: "column",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: C.textSecondary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    gap: 10,
  },
  backToLevelsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.text,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textSecondary,
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: "hidden" as const,
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.errorLighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.errorLight,
  },
  errorBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: C.errorDark,
  },

  // Equation
  equationCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 22,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    gap: 10,
  },
  equationLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  equationText: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: C.text,
    letterSpacing: 1,
    lineHeight: 46,
  },

  // Notebook
  notebookInputCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingRight: 16,
    paddingLeft: 48,
    paddingTop: 16,
    paddingBottom: 24,
    minHeight: 160,
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
    backgroundColor: C.infoLight,
  },
  marginLine: {
    position: "absolute",
    left: 40,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: C.errorLight,
    opacity: 0.6,
  },
  typeInputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeInputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.text,
  },
  notebookInputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    marginLeft: 4,
    position: "relative",
  },
  deleteRowBtn: {
    position: "absolute",
    left: -34,
    zIndex: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notebookTextInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 22,
    color: C.text,
    letterSpacing: 0.5,
    padding: 0,
  },
  notebookAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  notebookAddBtnDisabled: {
    backgroundColor: C.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  notebookActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 16,
  },
  checkAnswerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: C.primary,
    borderRadius: 100,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkAnswerBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: C.white,
  },

  // Middle area
  middleArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  checkingArea: {
    alignItems: "center",
    gap: 16,
  },
  checkingLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.textSecondary,
  },

  // Result card
  resultCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    gap: 14,
    width: "100%",
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  resultIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultTextBlock: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.text,
  },
  resultMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  nextProblemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextProblemBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.white,
  },

  // Level complete
  levelCompleteCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  levelCompleteContent: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  levelCompleteTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.text,
    textAlign: "center",
  },
  levelCompleteMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  levelCompleteStats: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    gap: 0,
    width: "100%",
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lcStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  lcStatDivider: {
    width: 1,
    backgroundColor: C.border,
  },
  lcStatValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.text,
  },
  lcStatLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  lcContinueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignSelf: "stretch",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  lcContinueBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.white,
  },
  lcBackBtn: {
    paddingVertical: 8,
  },
  lcBackBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.textSecondary,
  },
});
