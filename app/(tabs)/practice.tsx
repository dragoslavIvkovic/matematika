import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
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
import { AssessmentMode } from "@/components/AssessmentMode";
import { CheckingAnimation } from "@/components/CheckingAnimation";
import { ErrorFeedbackModal } from "@/components/ErrorFeedbackModal";
import { LevelSelector } from "@/components/LevelSelector";
import { MathKeyboard } from "@/components/MathKeyboard";
import { NotebookInput } from "@/components/NotebookInput";
import { OwlMascot } from "@/components/OwlMascot";
import { TheoryScreen } from "@/components/TheoryScreen";
import Colors from "@/constants/colors";
import { useQuizEngine } from "@/hooks/useQuizEngine";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { EquationStepValidator } from "@/utils/EquationStepValidator";
import { LevelManager } from "@/utils/LevelManager";
import {
  type GeneratedProblem,
  generateProblem,
  getLevelConfig,
  LEVEL_CONFIGS,
  type LevelId,
} from "@/utils/ProblemGenerator";
import { getTheoryContent } from "@/utils/TheoryContent";

const C = Colors.light;

/** iOS: prazan accessory uklanja podrazumevanu traku sa „Done" iznad number-pad-a. */
const IOS_MATH_INPUT_ACCESSORY_ID = "mathPracticeInputAccessory";

type ScreenMode =
  | "loading"
  | "level_select"
  | "assessment"
  | "theory"
  | "practice"
  | "level_complete";

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { action, level } = useLocalSearchParams();

  const [mode, setMode] = useState<ScreenMode>("loading");
  const [isTheoryOnly, setIsTheoryOnly] = useState(false);
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [levelCompleteInfo, setLevelCompleteInfo] = useState<{
    fromLevel: string;
    toLevel?: string;
  } | null>(null);

  // Use ref for manager (mutable class) + counter to force re-renders
  const localManagerRef = useRef<LevelManager | null>(null);
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  // Session-level counters for drop-off/completion tracking
  const sessionAnswersRef = useRef({ total: 0, correct: 0 });
  const trackEvent = useAnalyticsStore((s) => s.trackEvent);

  const engine = useQuizEngine({
    useLevelFallback: true,
    onCorrect: (prob, _mgr, result) => {
      rerender();
      if (result.levelComplete) {
        const { total, correct } = sessionAnswersRef.current;
        trackEvent({
          event: "level_completed",
          properties: {
            levelId: prob.level as LevelId,
            totalAnswers: total,
            correctAnswers: correct,
          },
        });
        sessionAnswersRef.current = { total: 0, correct: 0 };
        setLevelCompleteInfo({
          fromLevel: prob.level,
          toLevel: result.newLevel,
        });
        setTimeout(() => setMode("level_complete"), 1500);
      }
    },
  });

  // Destructure stable refs/functions from engine once — never put `engine` in deps
  const managerRef = engine.managerRef;
  const syncStats = engine.syncStats;
  const {
    resetQuizState,
    handleCheck: engineHandleCheck,
    handleErrorDismiss: engineHandleErrorDismiss,
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

  // ── Generate new problem ──
  const generateNew = useCallback(
    (mgr: LevelManager) => {
      const level = mgr.getCurrentLevel();
      const op = mgr.getNextOperationType();
      const newProblem = generateProblem(level, op);
      setProblem(newProblem);
      resetQuizState();
      rerender();
    },
    [rerender, resetQuizState],
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
    [generateNew],
  );

  // ── Load manager on focus ──
  useFocusEffect(
    useCallback(() => {
      const mgr = LevelManager.load();
      localManagerRef.current = mgr;
      managerRef.current = mgr;
      syncStats(mgr.getState());
      rerender();
      if (action === "start") {
        router.setParams({ action: "" });
        startPractice(mgr);
      } else if (action === "theory" && level) {
        mgr.setCurrentLevel(level as LevelId);
        mgr.save();
        syncStats(mgr.getState());
        setIsTheoryOnly(true);
        setMode("theory");
        router.setParams({ action: "", level: "" });
      } else {
        setMode((prev) => (prev === "loading" ? "level_select" : prev));
      }
    }, [rerender, action, level, startPractice, syncStats, managerRef]),
  );

  // ── Handle level selection ──
  const handleSelectLevel = useCallback(
    (level: LevelId) => {
      const mgr = managerRef.current;
      if (!mgr) return;
      mgr.setCurrentLevel(level);
      mgr.save();
      syncStats(mgr.getState());
      rerender();
      sessionAnswersRef.current = { total: 0, correct: 0 };
      trackEvent({ event: "level_started", properties: { levelId: level } });
      startPractice(mgr);
    },
    [startPractice, rerender, syncStats, managerRef, trackEvent],
  );

  // ── Handle theory dismiss ──
  const handleTheoryDismiss = useCallback(() => {
    const mgr = managerRef.current;
    if (!mgr) return;

    if (isTheoryOnly) {
      setIsTheoryOnly(false);
      router.back();
      return;
    }

    mgr.markTheoryShown();
    mgr.save();
    syncStats(mgr.getState());
    generateNew(mgr);
    setMode("practice");
  }, [generateNew, isTheoryOnly, syncStats, managerRef]);

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
              syncStats(mgr.getState());
              rerender();
              startPractice(mgr);
            },
          },
          {
            text: "Choose My Own",
            style: "cancel",
            onPress: () => setMode("level_select"),
          },
        ],
      );
    },
    [startPractice, rerender, syncStats, managerRef],
  );

  const handleCheck = useCallback(() => {
    engineHandleCheck(problem);
  }, [problem, engineHandleCheck]);

  // ── Handle error modal dismiss ──
  const handleErrorDismiss = useCallback(() => {
    const mgr = managerRef.current;
    if (!mgr || !errorModal) return;
    const action = errorModal.action;
    engineHandleErrorDismiss();

    if (action?.type === "show_theory") {
      setMode("theory");
    } else if (action?.type === "fallback_level") {
      rerender();
      startPractice(mgr);
    } else {
      generateNew(mgr);
    }
  }, [errorModal, engineHandleErrorDismiss, startPractice, generateNew, rerender, managerRef]);

  // ── Handle next problem ──
  const handleNextProblem = useCallback(() => {
    const mgr = managerRef.current;
    if (!mgr) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    generateNew(mgr);
  }, [generateNew, managerRef]);

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
  }, [generateNew, managerRef]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // ── Loading ──
  if (mode === "loading" || !managerRef.current) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.loadingCenter}>
          <OwlMascot size={88} isThinking />
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
  const streakProgress = manager.getStreakProgress();
  const requiredLines = problem ? EquationStepValidator.getRequiredLines(problem.level) : 1;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={IOS_MATH_INPUT_ACCESSORY_ID}>
          <View style={{ height: 0 }} />
        </InputAccessoryView>
      )}
      {/* ── Compact Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backToLevelsBtn}
          onPress={() => {
            const { total, correct } = sessionAnswersRef.current;
            if (total > 0) {
              trackEvent({
                event: "level_dropped",
                properties: {
                  levelId: state.currentLevel,
                  totalAnswers: total,
                  correctAnswers: correct,
                },
              });
            }
            sessionAnswersRef.current = { total: 0, correct: 0 };
            setMode("level_select");
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="home" size={18} color={C.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {state.currentLevel} · {currentConfig.name}
          </Text>
          <View style={styles.miniProgressBar}>
            <View style={[styles.miniProgressFill, { width: `${streakProgress.percent}%` }]} />
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
        contentContainerStyle={[styles.scrollContent, isKeyboardVisible && { paddingBottom: 380 }]}
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
            iosAccessoryId={IOS_MATH_INPUT_ACCESSORY_ID}
          />
        )}

        {/* ── Checking Animation ── */}
        {isChecking && (
          <View style={styles.middleArea}>
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.checkingArea}
            >
              <View style={styles.mascotCheckingSlot}>
                <OwlMascot size={78} isThinking />
              </View>
              <Text style={[styles.checkingLabel, styles.checkingLabelBelowMascot]}>
                Checking your answer...
              </Text>
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
                <View style={[styles.resultIconCircle, { backgroundColor: C.accent }]}>
                  <Ionicons name="checkmark" size={24} color={C.white} />
                </View>
                <View style={styles.resultTextBlock}>
                  <Text style={styles.resultTitle}>Correct! 🎉</Text>
                  <Text style={styles.resultMessage}>Great work — you solved it!</Text>
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
        onSubmit={() => handleKeyboardSubmit(problem)}
        onClose={dismissKeyboard}
        bottomOffset={Platform.OS === "ios" ? 49 + insets.bottom : 60}
      />

      {/* ── Error Modal ── */}
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
  container: {
    flex: 1,
    backgroundColor: C.background,
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
  mascotCheckingSlot: {
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
  },
  checkingLabelBelowMascot: {
    marginTop: 8,
    textAlign: "center",
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
