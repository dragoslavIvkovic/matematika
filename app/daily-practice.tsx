import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  InputAccessoryView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CheckingAnimation } from "@/components/CheckingAnimation";
import { ErrorFeedbackModal } from "@/components/ErrorFeedbackModal";
import { MathKeyboard } from "@/components/MathKeyboard";
import { NotebookInput } from "@/components/NotebookInput";
import { OwlMascot } from "@/components/OwlMascot";
import Colors from "@/constants/colors";
import { useQuizEngine } from "@/hooks/useQuizEngine";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { useDailyPracticeStore } from "@/store/dailyPracticeStore";
import { generateDailyPracticeTasks } from "@/utils/dailyPracticeGenerator";
import { claimFreeDailyQuizSlot } from "@/utils/dailyQuizLimit";
import { EquationStepValidator } from "@/utils/EquationStepValidator";
import type { GeneratedProblem, LevelId } from "@/utils/ProblemGenerator";
import { getLevelConfig } from "@/utils/ProblemGenerator";
import { alertPaywallUnavailable } from "@/utils/paywallAlert";

const C = Colors.light;

const IOS_DAILY_INPUT_ACCESSORY_ID = "dailyPracticeInputAccessory";

export default function DailyPracticeScreen() {
  const insets = useSafeAreaInsets();
  const { dailyClaimed } = useLocalSearchParams<{ dailyClaimed?: string }>();
  const { isPremium, presentPaywall, paywallBlockReason } = useSubscription();
  const selectedLevels = useDailyPracticeStore((s) => s.selectedLevels);

  useEffect(() => {
    if (Platform.OS === "web" || isPremium) return;
    if (dailyClaimed === "1") return;
    if (claimFreeDailyQuizSlot()) return;
    void (async () => {
      try {
        const { billingUnavailable, unavailableReason } = await presentPaywall();
        if (billingUnavailable) alertPaywallUnavailable(unavailableReason ?? paywallBlockReason);
      } finally {
        router.back();
      }
    })();
  }, [dailyClaimed, isPremium, presentPaywall, paywallBlockReason]);

  // Generate all tasks once on mount
  const [tasks] = useState<GeneratedProblem[]>(() => generateDailyPracticeTasks(selectedLevels));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const totalTasks = tasks.length;

  // Track session start once on mount
  const hasTrackedStartRef = useRef(false);

  const engine = useQuizEngine({
    onCorrect: () => {
      setCorrectCount((c) => c + 1);
    },
  });

  // Destructure stable parts from engine — never put `engine` itself in deps
  const {
    resetQuizState,
    handleCheck: engineHandleCheck,
    handleErrorDismiss: engineHandleErrorDismiss,
    sessionAnswersRef,
    trackEvent,
    notebookScrollViewRef,
    inputRef,
    typedAnswers,
    setTypedAnswers,
    activeInputIndex,
    setActiveInputIndex,
    isKeyboardVisible,
    setIsKeyboardVisible,
    isChecking,
    isCorrect,
    isAnswered,
    errorModal,
    resultCardStyle,
    handleKeyboardKeyPress,
    handleKeyboardDelete,
    handleKeyboardSubmit,
    dismissKeyboard,
  } = engine;

  // Track start event once
  if (!hasTrackedStartRef.current) {
    hasTrackedStartRef.current = true;
    trackEvent({
      event: "daily_practice_started",
      properties: { levelIds: selectedLevels, taskCount: tasks.length },
    });
  }

  const problem = tasks[currentIndex] ?? null;

  // ── Go to next problem or finish ──
  const goToNext = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= totalTasks) {
      const { total, correct } = sessionAnswersRef.current;
      trackEvent({
        event: "daily_practice_completed",
        properties: {
          levelIds: selectedLevels,
          totalAnswers: total,
          correctAnswers: correct,
        },
      });
      setSessionDone(true);
      return;
    }
    setCurrentIndex(nextIdx);
    resetQuizState();
  }, [currentIndex, totalTasks, resetQuizState, trackEvent, selectedLevels, sessionAnswersRef]);

  const handleCheck = useCallback(() => {
    engineHandleCheck(problem);
  }, [problem, engineHandleCheck]);

  const handleErrorDismiss = useCallback(() => {
    engineHandleErrorDismiss();
    resetQuizState();
  }, [engineHandleErrorDismiss, resetQuizState]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const requiredLines = problem ? EquationStepValidator.getRequiredLines(problem.level) : 1;
  const progressPercent =
    totalTasks > 0 ? ((currentIndex + (isAnswered ? 1 : 0)) / totalTasks) * 100 : 0;

  // ── Session Complete ──
  if (sessionDone) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.completeCenter}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.completeContent}>
            <View style={styles.celebrationIcon}>
              <Ionicons name="star" size={48} color={C.white} />
            </View>
            <Text style={styles.completeTitle}>Daily Practice Done!</Text>
            <Text style={styles.completeMessage}>
              You got {correctCount}/{totalTasks} correct. Great job keeping your skills sharp!
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
                <Text style={styles.cStatValue}>{selectedLevels.length}</Text>
                <Text style={styles.cStatLabel}>Areas</Text>
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
        <InputAccessoryView nativeID={IOS_DAILY_INPUT_ACCESSORY_ID}>
          <View style={{ height: 0 }} />
        </InputAccessoryView>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            const { total, correct } = sessionAnswersRef.current;
            if (total > 0) {
              trackEvent({
                event: "daily_practice_dropped",
                properties: {
                  levelIds: selectedLevels,
                  totalAnswers: total,
                  correctAnswers: correct,
                },
              });
            }
            router.back();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={C.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Daily Practice · {currentIndex + 1}/{totalTasks}
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
            key={`dp-${currentIndex}`}
            entering={FadeInDown.delay(120).duration(400)}
            style={styles.equationCard}
          >
            <View style={styles.levelChip}>
              <View
                style={[
                  styles.levelChipDot,
                  { backgroundColor: C.levels[problem.level] || C.primary },
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
          <NotebookInput
            typedAnswers={typedAnswers}
            setTypedAnswers={setTypedAnswers}
            activeInputIndex={activeInputIndex}
            setActiveInputIndex={setActiveInputIndex}
            setIsKeyboardVisible={setIsKeyboardVisible}
            requiredLines={requiredLines}
            inputRef={inputRef}
            notebookScrollViewRef={notebookScrollViewRef}
            onCheck={handleCheck}
            iosAccessoryId={IOS_DAILY_INPUT_ACCESSORY_ID}
          />
        )}

        {/* Checking animation */}
        {isChecking && (
          <View style={styles.middleArea}>
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.checkingArea}
            >
              <View style={styles.mascotSlot}>
                <OwlMascot size={78} isThinking />
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
                {
                  backgroundColor: C.cardCorrect,
                  borderColor: C.cardCorrectBorder,
                },
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
        onSubmit={() => handleKeyboardSubmit(problem)}
        onClose={dismissKeyboard}
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
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.text },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.accent,
    borderRadius: 2,
  },

  // Problem card
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
  levelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: C.backgroundAlt,
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

  // Middle area
  middleArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 200,
  },
  checkingArea: {
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingHorizontal: 4,
  },
  mascotSlot: {
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

  // Result
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
  resultMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  nextBtn: {
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
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.white },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Session complete
  completeCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  completeContent: { alignItems: "center", gap: 16, width: "100%" },
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
  cStatLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.textMuted,
  },
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
  backHomeBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.white,
  },
});
