import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  InputAccessoryView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorFeedbackModal } from "@/components/ErrorFeedbackModal";
import { MathKeyboard } from "@/components/MathKeyboard";
import { RobotMascot } from "@/components/RobotMascot";
import Colors from "@/constants/colors";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { useErrorStore } from "@/store/errorStore";
import { useLevelStatsStore } from "@/store/levelStatsStore";
import { useUsageStore } from "@/store/usageStore";
import { EquationStepValidator } from "@/utils/EquationStepValidator";
import { type ErrorAction, LevelManager } from "@/utils/LevelManager";
import { type GeneratedProblem, getLevelConfig, type LevelId } from "@/utils/ProblemGenerator";
import { generateWeakPracticeTasks } from "@/utils/weakPracticeGenerator";

const C = Colors.light;

const IOS_WEAK_INPUT_ACCESSORY_ID = "weakPracticeInputAccessory";

function BounceDot({ delay }: { delay: number }) {
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
  return <Animated.View style={[dotStyles.dot, style]} />;
}

function CheckingAnimation() {
  return (
    <View style={dotStyles.container}>
      <BounceDot delay={0} />
      <BounceDot delay={200} />
      <BounceDot delay={400} />
    </View>
  );
}

const dotStyles = StyleSheet.create({
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
    backgroundColor: C.error,
  },
});

export default function WeakPracticeScreen() {
  const insets = useSafeAreaInsets();
  const incrementTasksCompleted = useUsageStore((s) => s.incrementTasksCompleted);
  const syncStats = useLevelStatsStore((s) => s.syncFromManager);
  const trackEvent = useAnalyticsStore((s) => s.trackEvent);
  const errorsByLevel = useErrorStore((s) => s.errorsByLevel);
  const reduceError = useErrorStore((s) => s.reduceError);

  // Generate all tasks once on mount from weak levels
  const [tasks] = useState<GeneratedProblem[]>(() => generateWeakPracticeTasks(errorsByLevel));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const sessionAnswersRef = useRef({ total: 0, correct: 0 });

  // Current problem state
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

  const inputRef = useRef<TextInput>(null);
  const notebookScrollViewRef = useRef<ScrollView>(null);
  const resultScale = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(0);

  const managerRef = useRef<LevelManager>(LevelManager.load());

  const resultCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.min(resultScale.value, 1) }],
    opacity: resultOpacity.value,
  }));

  const problem = tasks[currentIndex] ?? null;
  const totalTasks = tasks.length;

  // ── Reset for next problem ──
  const goToNext = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= totalTasks) {
      setSessionDone(true);
      return;
    }
    setCurrentIndex(nextIdx);
    setTypedAnswers([""]);
    setIsChecking(false);
    setIsCorrect(null);
    setActiveInputIndex(0);
    resultScale.value = 0;
    resultOpacity.value = 0;
  }, [currentIndex, totalTasks, resultScale, resultOpacity]);

  // ── Check answer ──
  const handleCheck = useCallback(() => {
    if (!problem) return;
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
        problem.variable,
      );

      if (validation.isValid) {
        if (validation.isComplete) {
          setIsCorrect(true);
          setIsChecking(false);
          setCorrectCount((c) => c + 1);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          sessionAnswersRef.current.total++;
          sessionAnswersRef.current.correct++;
          trackEvent({
            event: "quiz_answer_correct",
            properties: { levelId: problem.level as LevelId },
          });

          // Reduce error count for this level on correct answer
          reduceError(problem.level as LevelId);

          const mgr = managerRef.current;
          mgr.recordCorrect(problem.type);
          mgr.save();
          syncStats(mgr.getState());
          incrementTasksCompleted();

          setIsKeyboardVisible(false);
          inputRef.current?.blur();

          resultScale.value = 0.92;
          resultOpacity.value = 0;
          resultScale.value = withTiming(1, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          });
          resultOpacity.value = withTiming(1, {
            duration: 280,
            easing: Easing.out(Easing.cubic),
          });
        } else {
          setIsChecking(false);
          Alert.alert("Keep going!", validation.message || "Correct so far, but add more steps.");
        }
      } else {
        setIsChecking(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        sessionAnswersRef.current.total++;
        trackEvent({
          event: "quiz_answer_incorrect",
          properties: { levelId: problem.level as LevelId },
        });

        const failedStep = validation.failedAtStep || 1;

        setIsKeyboardVisible(false);
        inputRef.current?.blur();

        setErrorModal({
          visible: true,
          message: validation.modalMessage || "That's not correct. Check your work.",
          procedure: validation.expectedProcedure || [],
          failedAtStep: failedStep,
          action: null,
        });
      }
    }, 800);
  }, [
    typedAnswers,
    problem,
    resultOpacity,
    resultScale,
    incrementTasksCompleted,
    syncStats,
    trackEvent,
    reduceError,
  ]);

  const handleKeyboardKeyPress = (key: string) => {
    const newAns = [...typedAnswers];
    newAns[activeInputIndex] = (newAns[activeInputIndex] || "") + key;
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
    if (!problem) return;
    const requiredSteps = problem.requiredSteps;

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

  const handleErrorDismiss = useCallback(() => {
    setErrorModal(null);
    setTypedAnswers([""]);
    setIsChecking(false);
    setIsCorrect(null);
    setActiveInputIndex(0);
    resultScale.value = 0;
    resultOpacity.value = 0;
  }, [resultScale, resultOpacity]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const isAnswered = isCorrect !== null;
  const requiredLines = problem ? EquationStepValidator.getRequiredLines(problem.level) : 1;
  const progressPercent =
    totalTasks > 0 ? ((currentIndex + (isAnswered ? 1 : 0)) / totalTasks) * 100 : 0;

  // ── Empty state (no errors to practice) ──
  if (tasks.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.completeCenter}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.completeContent}>
            <View style={[styles.celebrationIcon, { backgroundColor: C.accent }]}>
              <Ionicons name="checkmark-done" size={48} color={C.white} />
            </View>
            <Text style={styles.completeTitle}>No Weak Areas!</Text>
            <Text style={styles.completeMessage}>
              You have no recorded errors. Keep practicing and come back if you need to improve.
            </Text>
            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={() => router.back()}
              activeOpacity={0.9}
            >
              <Text style={styles.backHomeBtnText}>Back to Home</Text>
              <Ionicons name="home" size={18} color={C.white} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Session Complete ──
  if (sessionDone) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.completeCenter}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.completeContent}>
            <View style={styles.celebrationIcon}>
              <Ionicons name="fitness" size={48} color={C.white} />
            </View>
            <Text style={styles.completeTitle}>Weak Areas Done!</Text>
            <Text style={styles.completeMessage}>
              You got {correctCount}/{totalTasks} correct. Each correct answer reduces your error
              count!
            </Text>
            <View style={styles.completeStats}>
              <View style={styles.cStatItem}>
                <Text style={styles.cStatValue}>{correctCount}</Text>
                <Text style={styles.cStatLabel}>Correct</Text>
              </View>
              <View style={styles.cStatDivider} />
              <View style={styles.cStatItem}>
                <Text style={styles.cStatValue}>{totalTasks}</Text>
                <Text style={styles.cStatLabel}>Total</Text>
              </View>
              <View style={styles.cStatDivider} />
              <View style={styles.cStatItem}>
                <Text style={styles.cStatValue}>{correctCount}</Text>
                <Text style={styles.cStatLabel}>Cleared</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.backHomeBtn}
              onPress={() => router.back()}
              activeOpacity={0.9}
            >
              <Text style={styles.backHomeBtnText}>Back to Home</Text>
              <Ionicons name="home" size={18} color={C.white} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Practice UI ──
  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={IOS_WEAK_INPUT_ACCESSORY_ID}>
          <View style={{ height: 0 }} />
        </InputAccessoryView>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={C.error} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Weak Areas · {currentIndex + 1}/{totalTasks}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          {problem && (
            <Text style={styles.headerSub}>
              Level {problem.level} – {getLevelConfig(problem.level as LevelId).name}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        ref={notebookScrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isKeyboardVisible && { paddingBottom: 380 }]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Problem card */}
        {problem && (
          <Animated.View
            key={`wp-${currentIndex}`}
            entering={FadeInDown.delay(120).duration(400)}
            style={styles.equationCard}
          >
            <View style={styles.levelChip}>
              <View
                style={[
                  styles.levelChipDot,
                  { backgroundColor: C.levels[problem.level] || C.error },
                ]}
              />
              <Text style={styles.levelChipText}>Level {problem.level}</Text>
            </View>
            <Text style={styles.equationLabel}>
              {problem.requiredSteps === 1 ? "Calculate" : "Solve step by step"}
            </Text>
            <Text style={styles.equationText}>{problem.equation}</Text>
          </Animated.View>
        )}

        {/* Notebook input */}
        {!isAnswered && !isChecking && problem && (
          <Animated.View
            entering={SlideInDown.duration(350)}
            exiting={SlideOutDown.duration(250)}
            style={styles.notebookCard}
          >
            {Array.from({ length: Math.max(8, requiredLines + 1) }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Static lines
              <View key={`nb-line-${i}`} style={[styles.nbLine, { top: 40 + i * 46 }]} />
            ))}
            <View style={styles.marginLine} />
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>
                {requiredLines === 1 ? "Your answer" : "Solve step by step"}
              </Text>
            </View>
            <View style={{ gap: 0, paddingTop: 10 }}>
              {typedAnswers.map((ans, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Rows correspond to index
                <View key={`row-${idx}`} style={styles.inputRow}>
                  {(typedAnswers.length > 1 || ans.length > 0) && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
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
                      <Ionicons name="close-circle" size={18} color={C.errorLight} />
                    </TouchableOpacity>
                  )}
                  <TextInput
                    ref={idx === typedAnswers.length - 1 ? inputRef : undefined}
                    style={styles.textInput}
                    inputAccessoryViewID={
                      Platform.OS === "ios" ? IOS_WEAK_INPUT_ACCESSORY_ID : undefined
                    }
                    placeholder={requiredLines === 1 ? "Type your answer..." : `Step ${idx + 1}...`}
                    placeholderTextColor={C.textMuted}
                    value={ans}
                    onFocus={() => {
                      setActiveInputIndex(idx);
                      setIsKeyboardVisible(true);
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
                    returnKeyType={idx === typedAnswers.length - 1 ? "done" : "next"}
                    keyboardType={requiredLines === 1 ? "number-pad" : "default"}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                  />
                  {idx === typedAnswers.length - 1 && typedAnswers.length < requiredLines && (
                    <TouchableOpacity
                      style={[styles.addBtn, !ans.trim() && styles.addBtnDisabled]}
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
            <View style={styles.nbActions}>
              <TouchableOpacity
                style={[styles.checkBtn, { flex: 1, justifyContent: "center" }]}
                onPress={handleCheck}
                activeOpacity={0.9}
              >
                <Ionicons name="checkmark-circle" size={20} color={C.white} />
                <Text style={styles.checkBtnText}>Check Answer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Checking animation */}
        {isChecking && (
          <View style={styles.middleArea}>
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.checkingArea}
            >
              <View style={styles.robotSlot}>
                <RobotMascot size={70} isThinking />
              </View>
              <Text style={styles.checkingLabel}>Checking your answer...</Text>
              <CheckingAnimation />
            </Animated.View>
          </View>
        )}

        {/* Correct result */}
        {isAnswered && isCorrect && problem && (
          <View style={styles.middleArea}>
            <Animated.View
              style={[
                styles.resultCard,
                resultCardStyle,
                { backgroundColor: C.cardCorrect, borderColor: C.cardCorrectBorder },
              ]}
            >
              <View style={styles.resultHeader}>
                <View style={[styles.resultIconCircle, { backgroundColor: C.accent }]}>
                  <Ionicons name="checkmark" size={24} color={C.white} />
                </View>
                <View style={styles.resultTextBlock}>
                  <Text style={styles.resultTitle}>Correct!</Text>
                  <Text style={styles.resultMessage}>
                    {currentIndex + 1 < totalTasks
                      ? `${totalTasks - currentIndex - 1} tasks remaining`
                      : "Last one — well done!"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  goToNext();
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.nextBtnText}>
                  {currentIndex + 1 < totalTasks ? "Next Task" : "Finish"}
                </Text>
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
        bottomOffset={Platform.OS === "ios" ? insets.bottom : 0}
      />

      {/* Error modal */}
      {errorModal?.visible && (
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
  container: { flex: 1, backgroundColor: C.background },

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
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.errorLighter,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.text },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary },
  progressBar: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.error,
    borderRadius: 2,
  },

  equationCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 22,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: C.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    gap: 10,
  },
  levelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: C.errorLighter,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelChipDot: { width: 8, height: 8, borderRadius: 4 },
  levelChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: C.textSecondary,
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

  notebookCard: {
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
  nbLine: {
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
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    marginLeft: 4,
    position: "relative",
  },
  deleteBtn: {
    position: "absolute",
    left: -34,
    zIndex: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 22,
    color: C.text,
    letterSpacing: 0.5,
    padding: 0,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.error,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnDisabled: {
    backgroundColor: C.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  nbActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 16,
  },
  checkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: C.error,
    borderRadius: 100,
    shadowColor: C.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.white },

  middleArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 200,
  },
  checkingArea: { alignItems: "center", gap: 12, width: "100%", paddingHorizontal: 4 },
  robotSlot: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 96,
    paddingVertical: 4,
    marginBottom: 4,
  },
  checkingLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },

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
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  resultIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultTextBlock: { flex: 1, gap: 2 },
  resultTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text },
  resultMessage: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.error,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: C.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.white },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  completeCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  completeContent: { alignItems: "center", gap: 16, width: "100%" },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.error,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  completeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.text,
    textAlign: "center",
  },
  completeMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  completeStats: {
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
  cStatItem: { flex: 1, alignItems: "center", gap: 4 },
  cStatDivider: { width: 1, backgroundColor: C.border },
  cStatValue: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  cStatLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textMuted },
  backHomeBtn: {
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
  backHomeBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.white },
});
