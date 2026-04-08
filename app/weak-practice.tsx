import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useState } from "react";
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
import { RobotMascot } from "@/components/RobotMascot";
import Colors from "@/constants/colors";
import { useQuizEngine } from "@/hooks/useQuizEngine";
import { useErrorStore } from "@/store/errorStore";
import { EquationStepValidator } from "@/utils/EquationStepValidator";
import type { GeneratedProblem, LevelId } from "@/utils/ProblemGenerator";
import { getLevelConfig } from "@/utils/ProblemGenerator";
import { generateWeakPracticeTasks } from "@/utils/weakPracticeGenerator";

const C = Colors.light;

const IOS_WEAK_INPUT_ACCESSORY_ID = "weakPracticeInputAccessory";

export default function WeakPracticeScreen() {
  const insets = useSafeAreaInsets();
  const errorsByLevel = useErrorStore((s) => s.errorsByLevel);

  // Generate all tasks once on mount from weak levels
  const [tasks] = useState<GeneratedProblem[]>(() => generateWeakPracticeTasks(errorsByLevel));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  const totalTasks = tasks.length;

  const engine = useQuizEngine({
    reduceErrorOnCorrect: true,
    onCorrect: () => {
      setCorrectCount((c) => c + 1);
    },
  });

  // Destructure stable parts from engine
  const {
    resetQuizState,
    handleCheck: engineHandleCheck,
    handleErrorDismiss: engineHandleErrorDismiss,
    isAnswered,
  } = engine;

  const problem = tasks[currentIndex] ?? null;

  // ── Go to next problem or finish ──
  const goToNext = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= totalTasks) {
      setSessionDone(true);
      return;
    }
    setCurrentIndex(nextIdx);
    resetQuizState();
  }, [currentIndex, totalTasks, resetQuizState]);

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
        ref={engine.notebookScrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          engine.isKeyboardVisible && { paddingBottom: 380 },
        ]}
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
        {!engine.isAnswered && !engine.isChecking && problem && (
          <NotebookInput
            typedAnswers={engine.typedAnswers}
            setTypedAnswers={engine.setTypedAnswers}
            activeInputIndex={engine.activeInputIndex}
            setActiveInputIndex={engine.setActiveInputIndex}
            setIsKeyboardVisible={engine.setIsKeyboardVisible}
            requiredLines={requiredLines}
            inputRef={engine.inputRef}
            notebookScrollViewRef={engine.notebookScrollViewRef}
            onCheck={handleCheck}
            iosAccessoryId={IOS_WEAK_INPUT_ACCESSORY_ID}
            accentColor={C.error}
          />
        )}

        {/* Checking animation */}
        {engine.isChecking && (
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
              <CheckingAnimation color={C.error} />
            </Animated.View>
          </View>
        )}

        {/* Correct result */}
        {engine.isAnswered && engine.isCorrect && problem && (
          <View style={styles.middleArea}>
            <Animated.View
              style={[
                styles.resultCard,
                engine.resultCardStyle,
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
        isVisible={engine.isKeyboardVisible}
        onKeyPress={engine.handleKeyboardKeyPress}
        onDelete={engine.handleKeyboardDelete}
        onSubmit={() => engine.handleKeyboardSubmit(problem)}
        onClose={engine.dismissKeyboard}
        bottomOffset={Platform.OS === "ios" ? insets.bottom : 0}
      />

      {/* Error modal */}
      {engine.errorModal?.visible && (
        <ErrorFeedbackModal
          visible={engine.errorModal.visible}
          errorMessage={engine.errorModal.message}
          failedAtStep={engine.errorModal.failedAtStep}
          expectedProcedure={engine.errorModal.procedure}
          errorAction={engine.errorModal.action}
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
