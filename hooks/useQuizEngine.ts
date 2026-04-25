import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, type ScrollView, type TextInput } from "react-native";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useAnalyticsStore } from "@/store/analyticsStore";
import { useErrorStore } from "@/store/errorStore";
import { useLevelStatsStore } from "@/store/levelStatsStore";
import { useUsageStore } from "@/store/usageStore";
import { EquationStepValidator } from "@/utils/EquationStepValidator";
import { type ErrorAction, LevelManager } from "@/utils/LevelManager";
import type { GeneratedProblem, LevelId } from "@/utils/ProblemGenerator";

/**
 * Samo čisto sabiranje/oduzimanje (1.1, 1.3): kratka poruka, bez "Correct procedure".
 * Ne koristiti `type` — nivoi 1.5/1.6 imaju +/− u jednačini, ali im treba i korak i postupak.
 */
function shouldHideErrorProcedure(p: GeneratedProblem): boolean {
  return p.level === "1.1" || p.level === "1.3";
}

export interface CorrectResult {
  levelComplete: boolean;
  newLevel?: LevelId;
}

export interface QuizEngineConfig {
  /** Called after a correct answer is recorded. Receives the result from manager.recordCorrect(). */
  onCorrect?: (problem: GeneratedProblem, manager: LevelManager, result: CorrectResult) => void;
  /** Called after an error is recorded (before modal shown). */
  onError?: (problem: GeneratedProblem, manager: LevelManager) => void;
  /** Whether to use LevelManager.recordError for fallback logic (practice screen only). */
  useLevelFallback?: boolean;
  /** Whether to call reduceError on correct answer (weak practice only). */
  reduceErrorOnCorrect?: boolean;
  /** Whether to call recordError from errorStore on wrong answer. Defaults to true. */
  recordErrorOnWrong?: boolean;
}

export interface ErrorModalState {
  visible: boolean;
  message: string;
  procedure: string[];
  failedAtStep: number;
  action: ErrorAction | null;
}

export function useQuizEngine(config: QuizEngineConfig = {}) {
  const {
    useLevelFallback = false,
    reduceErrorOnCorrect = false,
    recordErrorOnWrong = true,
  } = config;

  // Store callbacks in refs so they don't cause dependency changes
  const onCorrectRef = useRef(config.onCorrect);
  const onErrorRef = useRef(config.onError);
  useEffect(() => {
    onCorrectRef.current = config.onCorrect;
    onErrorRef.current = config.onError;
  });

  // Stores
  const incrementTasksCompleted = useUsageStore((s) => s.incrementTasksCompleted);
  const syncStats = useLevelStatsStore((s) => s.syncFromManager);
  const trackEvent = useAnalyticsStore((s) => s.trackEvent);
  const recordError = useErrorStore((s) => s.recordError);
  const reduceError = useErrorStore((s) => s.reduceError);

  // State
  const [typedAnswers, setTypedAnswers] = useState<string[]>([""]);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorModal, setErrorModal] = useState<ErrorModalState | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(0);

  // Refs
  const inputRef = useRef<TextInput>(null);
  const notebookScrollViewRef = useRef<ScrollView>(null);
  const managerRef = useRef<LevelManager>(LevelManager.load());
  const sessionAnswersRef = useRef({ total: 0, correct: 0 });

  // Animations
  const resultScale = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const resultCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.min(resultScale.value, 1) }],
    opacity: resultOpacity.value,
  }));

  const isAnswered = isCorrect !== null;

  // ── Animate result card ──
  const animateResultCard = useCallback(() => {
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
  }, [resultScale, resultOpacity]);

  // ── Dismiss keyboard ──
  const dismissKeyboard = useCallback(() => {
    setIsKeyboardVisible(false);
    inputRef.current?.blur();
  }, []);

  // ── Reset quiz state (for retrying / next problem) ──
  const resetQuizState = useCallback(() => {
    setTypedAnswers([""]);
    setIsChecking(false);
    setIsCorrect(null);
    setActiveInputIndex(0);
    resultScale.value = 0;
    resultOpacity.value = 0;
  }, [resultScale, resultOpacity]);

  // ── Check answer ──
  const handleCheck = useCallback(
    (problem: GeneratedProblem | null) => {
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
            // ✅ Correct!
            setIsCorrect(true);
            setIsChecking(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            sessionAnswersRef.current.total++;
            sessionAnswersRef.current.correct++;
            trackEvent({
              event: "quiz_answer_correct",
              properties: { levelId: problem.level as LevelId },
            });

            if (reduceErrorOnCorrect) {
              reduceError(problem.level as LevelId);
            }

            const mgr = managerRef.current;
            const correctResult = mgr.recordCorrect(problem.type);
            mgr.save();
            syncStats(mgr.getState());
            incrementTasksCompleted();

            dismissKeyboard();
            animateResultCard();

            onCorrectRef.current?.(problem, mgr, correctResult);
          } else {
            // Partially correct
            setIsChecking(false);
            Alert.alert("Keep going!", validation.message || "Correct so far, but add more steps.");
          }
        } else {
          // ❌ Error
          setIsChecking(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          sessionAnswersRef.current.total++;
          trackEvent({
            event: "quiz_answer_incorrect",
            properties: { levelId: problem.level as LevelId },
          });

          if (recordErrorOnWrong) {
            recordError(problem.level as LevelId);
          }

          const failedStep = validation.failedAtStep || 1;
          let errorAction: ErrorAction | null = null;

          if (useLevelFallback) {
            const mgr = managerRef.current;
            errorAction = mgr.recordError(failedStep);
            mgr.save();
            syncStats(mgr.getState());
          }

          dismissKeyboard();

          const hideProcedure = shouldHideErrorProcedure(problem);
          const mainMessage =
            errorAction?.type === "show_theory" || errorAction?.type === "fallback_level"
              ? errorAction.message
              : hideProcedure
                ? "Not quite right. Try again."
                : validation.modalMessage || "That's not correct. Check your work.";

          setErrorModal({
            visible: true,
            message: mainMessage,
            procedure: hideProcedure ? [] : validation.expectedProcedure || [],
            failedAtStep: failedStep,
            action: errorAction,
          });

          onErrorRef.current?.(problem, managerRef.current);
        }
      }, 800);
    },
    [
      typedAnswers,
      trackEvent,
      recordError,
      reduceError,
      incrementTasksCompleted,
      syncStats,
      dismissKeyboard,
      animateResultCard,
      useLevelFallback,
      reduceErrorOnCorrect,
      recordErrorOnWrong,
    ],
  );

  // ── Keyboard handlers ──
  const handleKeyboardKeyPress = useCallback(
    (key: string) => {
      const newAns = [...typedAnswers];
      newAns[activeInputIndex] = (newAns[activeInputIndex] || "") + key;
      setTypedAnswers(newAns);
    },
    [typedAnswers, activeInputIndex],
  );

  const handleKeyboardDelete = useCallback(() => {
    const newAns = [...typedAnswers];
    if (newAns[activeInputIndex].length > 0) {
      newAns[activeInputIndex] = newAns[activeInputIndex].slice(0, -1);
      setTypedAnswers(newAns);
    }
  }, [typedAnswers, activeInputIndex]);

  const handleKeyboardSubmit = useCallback(
    (problem: GeneratedProblem | null) => {
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
        handleCheck(problem);
      }
    },
    [typedAnswers, activeInputIndex, handleCheck],
  );

  // ── Error modal dismiss ──
  const handleErrorDismiss = useCallback(() => {
    setErrorModal(null);
  }, []);

  return {
    // State
    typedAnswers,
    setTypedAnswers,
    isChecking,
    isCorrect,
    isAnswered,
    errorModal,
    isKeyboardVisible,
    setIsKeyboardVisible,
    activeInputIndex,
    setActiveInputIndex,

    // Refs
    inputRef,
    notebookScrollViewRef,
    managerRef,
    sessionAnswersRef,

    // Animations
    resultScale,
    resultOpacity,
    resultCardStyle,

    // Actions
    handleCheck,
    handleKeyboardKeyPress,
    handleKeyboardDelete,
    handleKeyboardSubmit,
    handleErrorDismiss,
    resetQuizState,
    animateResultCard,

    // Store actions (re-exposed for convenience)
    syncStats,
    trackEvent,
  };
}
