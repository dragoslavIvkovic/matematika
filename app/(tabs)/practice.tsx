import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { RobotMascot } from "@/components/RobotMascot";
import { EquationStepValidator } from "@/utils/EquationStepValidator";

const C = Colors.light;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Problem {
  id: string;
  equation: string;
  hint: string;
  answer: string[];
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  steps: string[];
  level: string;
  op: string;
  valA: number;
  valB: number;
  valC: number | null;
}

const PROBLEMS: Problem[] = [
  {
    id: "p1",
    equation: "2x + 1 = 5",
    hint: "Move the constant to the right side, then divide",
    answer: ["x=2", "x = 2", "2"],
    topic: "Algebra",
    difficulty: "Easy",
    steps: ["2x = 5 − 1", "2x = 4", "x = 4 ÷ 2", "x = 2"],
    level: "1.5", op: "+", valA: 2, valB: 1, valC: 5,
  },
  {
    id: "p2",
    equation: "3y − 4 = 11",
    hint: "Add 4 to both sides, then divide by 3",
    answer: ["y=5", "y = 5", "5"],
    topic: "Algebra",
    difficulty: "Easy",
    steps: ["3y = 11 + 4", "3y = 15", "y = 15 ÷ 3", "y = 5"],
    level: "1.5", op: "-", valA: 3, valB: 4, valC: 11,
  },
  {
    id: "p3",
    equation: "4z + 6 = 22",
    hint: "Subtract 6, then divide by 4",
    answer: ["z=4", "z = 4", "4"],
    topic: "Algebra",
    difficulty: "Easy",
    steps: ["4z = 22 − 6", "4z = 16", "z = 16 ÷ 4", "z = 4"],
    level: "1.5", op: "+", valA: 4, valB: 6, valC: 22,
  },
  {
    id: "p4",
    equation: "5a − 3 = 17",
    hint: "Add 3 to both sides, then divide by 5",
    answer: ["a=4", "a = 4", "4"],
    topic: "Algebra",
    difficulty: "Medium",
    steps: ["5a = 17 + 3", "5a = 20", "a = 20 ÷ 5", "a = 4"],
    level: "1.5", op: "-", valA: 5, valB: 3, valC: 17,
  },
  {
    id: "p5",
    equation: "2b + 8 = 14",
    hint: "Subtract 8 from both sides, then halve it",
    answer: ["b=3", "b = 3", "3"],
    topic: "Algebra",
    difficulty: "Medium",
    steps: ["2b = 14 − 8", "2b = 6", "b = 6 ÷ 2", "b = 3"],
    level: "1.5", op: "+", valA: 2, valB: 8, valC: 14,
  },
];

type ResultState = "idle" | "checking" | "correct" | "incorrect";

function DifficultyBadge({ level }: { level: Problem["difficulty"] }) {
  const colors = {
    Easy: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
    Medium: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
    Hard: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  };
  const c = colors[level];
  return (
    <View style={[diffStyles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[diffStyles.text, { color: c.text }]}>{level}</Text>
    </View>
  );
}
const diffStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  text: { fontFamily: "Inter_700Bold", fontSize: 11 },
});

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
  const [problemIndex, setProblemIndex] = useState(0);
  const [typedAnswers, setTypedAnswers] = useState<string[]>([""]);
  const [errorModal, setErrorModal] = useState<{ visible: boolean, message: string, procedure: string[], failedAtStep: number } | null>(null);
  const [result, setResult] = useState<ResultState>("idle");
  const [showHint, setShowHint] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const problem = PROBLEMS[problemIndex];
  const isLast = problemIndex === PROBLEMS.length - 1;

  const btnScale = useSharedValue(1);
  const resultScale = useSharedValue(0);
  const resultOpacity = useSharedValue(0);

  const resultCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultOpacity.value,
  }));

  const showResult = useCallback(
    (isCorrect: boolean) => {
      const state: ResultState = isCorrect ? "correct" : "incorrect";
      setResult(state);
      if (isCorrect) {
        setSolvedCount((c) => c + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      resultScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      resultOpacity.value = withTiming(1, { duration: 250 });
    },
    []
  );

  const handleCheckText = useCallback(() => {
    const lastInput = typedAnswers[typedAnswers.length - 1];
    if (!lastInput?.trim() && typedAnswers.length === 1) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setResult("checking");
    setTimeout(() => {
      const validation = EquationStepValidator.validate(
        typedAnswers,
        problem.level,
        problem.op,
        problem.valA,
        problem.valB,
        problem.valC
      );

      if (validation.isValid) {
        if (validation.isComplete) {
          showResult(true);
        } else {
          setResult("idle");
          Alert.alert("Задатак није завршен", validation.message || "За сада је све тачно, али задатак није комплетан. Настави да куцаш још корака.");
        }
      } else {
        setResult("idle");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorModal({
          visible: true,
          message: validation.modalMessage || "Error",
          procedure: validation.expectedProcedure || [],
          failedAtStep: validation.failedAtStep || 1
        });
      }
    }, 800);
  }, [typedAnswers, problem, showResult]);

  const handleNextProblem = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult("idle");
    setTypedAnswers([""]);
    setShowHint(false);
    setErrorModal(null);
    resultScale.value = 0;
    resultOpacity.value = 0;
    if (!isLast) {
      setProblemIndex((i) => i + 1);
    } else {
      setProblemIndex(0);
    }
  }, [isLast]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 84 : insets.bottom;

  const isAnswered = result === "correct" || result === "incorrect";
  const isChecking = result === "checking";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.inner, { paddingTop: topPad }]}>

        {/* ── Top header ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.solvedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={C.accent} />
              <Text style={styles.solvedText}>{solvedCount} solved</Text>
            </View>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Practice</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.problemCounter}>
              {problemIndex + 1} / {PROBLEMS.length}
            </Text>
          </View>
        </Animated.View>

        {/* ── Problem Area ── */}
        <Animated.View
          key={`problem-${problem.id}`}
          entering={FadeInDown.delay(80).duration(400)}
          style={styles.problemSection}
        >
          <View style={styles.problemMeta}>
            <View style={styles.topicBadge}>
              <Text style={styles.topicText}>{problem.topic}</Text>
            </View>
            <DifficultyBadge level={problem.difficulty} />
          </View>

          <View style={styles.equationCard}>
            <Text style={styles.equationLabel}>Solve for the variable</Text>
            <Text style={styles.equationText}>{problem.equation}</Text>

            {showHint && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.hintBox}>
                <Ionicons name="bulb" size={14} color="#92400E" />
                <Text style={styles.hintText}>{problem.hint}</Text>
              </Animated.View>
            )}

            {!showHint && !isAnswered && (
              <TouchableOpacity
                style={styles.hintBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowHint(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="bulb-outline" size={14} color={C.textMuted} />
                <Text style={styles.hintBtnText}>Show hint</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Text input (Notebook style) ── */}
        {!isAnswered && !isChecking && (
          <Animated.View entering={SlideInDown.duration(350)} exiting={SlideOutDown.duration(250)} style={styles.notebookInputCard}>
            {/* Notebook lines */}
            {Array.from({ length: Math.max(8, EquationStepValidator.getRequiredLines(problem.level) + 1) }).map((_, i) => (
              <View key={`nb-line-${i}`} style={[styles.notebookLine, { top: 40 + i * 46 }]} />
            ))}
            {/* Red margin line */}
            <View style={styles.marginLine} />

            <View style={styles.typeInputHeader}>
              <Text style={styles.typeInputLabel}>Solve step by step</Text>
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
                      <Ionicons name="close-circle" size={18} color="#FCA5A5" />
                    </TouchableOpacity>
                  )}
                  <TextInput
                    ref={idx === typedAnswers.length - 1 ? inputRef : undefined}
                    style={styles.notebookTextInput}
                    placeholder={`Step ${idx + 1}...`}
                    placeholderTextColor="#94A3B8"
                    value={ans}
                    onChangeText={(text) => {
                      const newAns = [...typedAnswers];
                      newAns[idx] = text;
                      setTypedAnswers(newAns);
                    }}
                    onSubmitEditing={() => {
                      if (idx === typedAnswers.length - 1 && typedAnswers.length < EquationStepValidator.getRequiredLines(problem.level) && ans.trim()) {
                        setTypedAnswers(prev => [...prev, ""]);
                        setTimeout(() => inputRef.current?.focus(), 100);
                      } else {
                        handleCheckText();
                      }
                    }}
                    autoFocus={idx === typedAnswers.length - 1}
                    returnKeyType={idx === typedAnswers.length - 1 ? "done" : "next"}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                  />
                  {idx === typedAnswers.length - 1 && typedAnswers.length < EquationStepValidator.getRequiredLines(problem.level) && (
                    <TouchableOpacity
                      style={[
                        styles.notebookSubmitBtn,
                        !ans.trim() && styles.notebookSubmitBtnDisabled,
                      ]}
                      onPress={() => {
                        setTypedAnswers(prev => [...prev, ""]);
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }}
                      disabled={!ans.trim()}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="arrow-down" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Check Button */}
            <View style={styles.notebookActions}>
              <TouchableOpacity
                style={[styles.checkAnswerBtn, { flex: 1, justifyContent: "center" }]}
                onPress={handleCheckText}
                activeOpacity={0.9}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.checkAnswerBtnText}>Check Answer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Spacer / Result / Robot ── */}
        <View style={styles.middleArea}>
          {result === "checking" && (
            <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.checkingArea}>
              <RobotMascot size={70} isThinking />
              <Text style={styles.checkingLabel}>Checking your answer...</Text>
              <CheckingAnimation />
            </Animated.View>
          )}

          {isAnswered && (
            <Animated.View style={[styles.resultCard, resultCardStyle, {
              backgroundColor: result === "correct" ? "#DCFCE7" : "#FEF3C7",
              borderColor: result === "correct" ? "#86EFAC" : "#FCD34D",
            }]}>
              <View style={styles.resultHeader}>
                <View style={[
                  styles.resultIconCircle,
                  { backgroundColor: result === "correct" ? C.accent : C.orange }
                ]}>
                  <Ionicons
                    name={result === "correct" ? "checkmark" : "close"}
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.resultTextBlock}>
                  <Text style={styles.resultTitle}>
                    {result === "correct" ? "Correct!" : "Not quite!"}
                  </Text>
                  <Text style={styles.resultMessage}>
                    {result === "correct"
                      ? "Great work — you nailed it!"
                      : `The answer is: ${problem.answer[1]}`}
                  </Text>
                </View>
              </View>

              {/* Steps walkthrough */}
              <View style={styles.stepsBox}>
                <Text style={styles.stepsLabel}>Solution steps:</Text>
                {problem.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={[
                      styles.stepNum,
                      i === problem.steps.length - 1 && styles.stepNumFinal
                    ]}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={[
                      styles.stepText,
                      i === problem.steps.length - 1 && styles.stepTextFinal
                    ]}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.nextProblemBtn}
                onPress={handleNextProblem}
                activeOpacity={0.9}
              >
                <Text style={styles.nextProblemBtnText}>
                  {isLast ? "Start Over" : "Next Problem"}
                </Text>
                <Ionicons name={isLast ? "refresh" : "arrow-forward"} size={16} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Error Modal */}
        {errorModal && errorModal.visible && (
          <Animated.View style={styles.errorModalOverlay}>
            <View style={styles.errorModalCard}>
              <Ionicons name="warning" size={32} color="#991B1B" />
              <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
              <View style={styles.errorProcedureBox}>
                <Text style={styles.errorProcedureTitle}>Expected step(s):</Text>
                {errorModal.procedure.map((step, idx) => (
                  <Text key={idx} style={[styles.errorProcedureStep, idx + 1 === errorModal.failedAtStep && { color: "#991B1B", fontFamily: "Inter_700Bold" }]}>
                    {idx + 1}. {step}
                  </Text>
                ))}
              </View>
              <TouchableOpacity style={styles.errorModalBtn} onPress={() => setErrorModal(null)}>
                <Text style={styles.errorModalBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

      </View>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  headerLeft: { flex: 1, alignItems: "flex-start" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerRight: { flex: 1, alignItems: "flex-end" },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.text,
  },
  solvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  solvedText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#166534",
  },
  problemCounter: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.textMuted,
  },

  problemSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
  },
  problemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topicBadge: {
    backgroundColor: C.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  topicText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.primary,
  },
  equationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 22,
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
    fontSize: 40,
    color: C.text,
    letterSpacing: 1,
    lineHeight: 50,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    marginTop: 4,
  },
  hintText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#92400E",
    flex: 1,
    lineHeight: 18,
  },
  hintBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  hintBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.textMuted,
  },

  middleArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  robotIdleArea: {
    alignItems: "center",
    gap: 12,
  },
  idlePrompt: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: C.textSecondary,
    textAlign: "center",
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

  resultCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    gap: 14,
    width: "100%",
    shadowColor: "#000",
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
  stepsBox: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  stepsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumFinal: {
    backgroundColor: C.accent,
  },
  stepNumText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  stepText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.text,
  },
  stepTextFinal: {
    fontFamily: "Inter_700Bold",
    color: "#166534",
    fontSize: 16,
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
    color: "#FFFFFF",
  },

  photoPreviewCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  photoPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  photoPreviewLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.text,
  },
  photoPreview: {
    width: "100%",
    height: 160,
  },
  submitPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 14,
    margin: 12,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitPhotoBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },

  typeInputCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
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
  typeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: C.text,
    backgroundColor: C.background,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: C.primaryLight,
    letterSpacing: 0.5,
  },
  submitTextBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitTextBtnDisabled: {
    backgroundColor: C.border,
    shadowOpacity: 0,
    elevation: 0,
  },

  inputSelector: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  inputSelectorLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
  },
  inputBtns: {
    flexDirection: "row",
    gap: 12,
  },
  inputBtnCamera: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: C.primaryLight,
    alignItems: "flex-start",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  inputBtnType: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: C.accentLight,
    alignItems: "flex-start",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  inputBtnIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inputBtnTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: C.text,
  },
  inputBtnSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 17,
  },

  switchModeBar: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: C.backgroundAlt,
  },
  switchBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.primary,
  },
  errorModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
    borderRadius: 24,
  },
  errorModalCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 2,
    borderColor: "#FCA5A5",
    alignItems: "center",
    gap: 12,
  },
  errorModalMessage: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#991B1B",
    textAlign: "center",
  },
  errorProcedureBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 6,
  },
  errorProcedureTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#7F1D1D",
    marginBottom: 4,
  },
  errorProcedureStep: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#4A0404",
  },
  errorModalBtn: {
    backgroundColor: "#991B1B",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 100,
    marginTop: 8,
  },
  errorModalBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  notebookInputCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: "#FFFEF7",
    borderRadius: 16,
    paddingRight: 16,
    paddingLeft: 48,
    paddingTop: 16,
    paddingBottom: 24,
    minHeight: 200,
    shadowColor: "#000",
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
    backgroundColor: "#DBEAFE",
  },
  marginLine: {
    position: "absolute",
    left: 40,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: "#FCA5A5",
    opacity: 0.6,
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
    color: "#1E293B",
    letterSpacing: 0.5,
    padding: 0,
  },
  notebookSubmitBtn: {
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
  notebookSubmitBtnDisabled: {
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
    borderTopColor: "#E2E8F0",
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
    color: "#FFFFFF",
  },
});
