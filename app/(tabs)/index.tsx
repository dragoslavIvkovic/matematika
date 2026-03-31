import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { HandwrittenEquation, EquationStep } from "@/components/HandwrittenEquation";
import { RobotMascot } from "@/components/RobotMascot";
import { SpeechBubble } from "@/components/SpeechBubble";
import { StepIndicator } from "@/components/StepIndicator";

const C = Colors.light;
const ONBOARDING_KEY = "math_tutor_onboarding_v1";

interface Lesson {
  id: string;
  title: string;
  originalEquation: string;
  steps: {
    id: string;
    label: string;
    equationSteps: EquationStep[];
    speechTitle: string;
    speechMessage: string;
    speechRule: string;
  }[];
}

const LESSONS: Lesson[] = [
  {
    id: "l1",
    title: "Solving: 2x + 1 = 5",
    originalEquation: "2x + 1 = 5",
    steps: [
      {
        id: "s1",
        label: "Original",
        equationSteps: [
          { id: "e1", text: "2x + 1 = 5", isHighlighted: true },
        ],
        speechTitle: "The Problem",
        speechMessage: "We need to find what x equals. Let's solve this step-by-step!",
        speechRule: "Goal: isolate x on one side",
      },
      {
        id: "s2",
        label: "Flip Sign",
        equationSteps: [
          { id: "e1", text: "2x + 1 = 5", isCompleted: true },
          { id: "e2", text: "2x = 5 − 1", isHighlighted: true },
        ],
        speechTitle: "Flip the Sign",
        speechMessage: "Move +1 to the other side. When you cross the = sign, the number flips its sign. +1 becomes −1!",
        speechRule: "+1 moves → becomes −1",
      },
      {
        id: "s3",
        label: "Simplify",
        equationSteps: [
          { id: "e1", text: "2x + 1 = 5", isCompleted: true },
          { id: "e2", text: "2x = 5 − 1", isCompleted: true },
          { id: "e3", text: "2x = 4", isHighlighted: true },
        ],
        speechTitle: "Simplify",
        speechMessage: "Calculate 5 minus 1. That gives us 4. Now we have 2x = 4. Almost there!",
        speechRule: "5 − 1 = 4",
      },
      {
        id: "s4",
        label: "Divide",
        equationSteps: [
          { id: "e1", text: "2x + 1 = 5", isCompleted: true },
          { id: "e2", text: "2x = 4", isCompleted: true },
          { id: "e3", text: "x = 4 ÷ 2", isHighlighted: true },
        ],
        speechTitle: "Divide Both Sides",
        speechMessage: "Divide both sides by 2 to get x alone. What we do to one side, we must do to the other!",
        speechRule: "Divide both sides by 2",
      },
      {
        id: "s5",
        label: "Answer!",
        equationSteps: [
          { id: "e1", text: "2x + 1 = 5", isCompleted: true },
          { id: "e2", text: "2x = 4", isCompleted: true },
          { id: "e3", text: "x = 4 ÷ 2", isCompleted: true },
          { id: "e4", text: "x = 2", isHighlighted: true },
        ],
        speechTitle: "Solution Found!",
        speechMessage: "x = 2! Let's verify: 2(2) + 1 = 5 → 4 + 1 = 5 ✓ Correct!",
        speechRule: "x = 2 is our answer!",
      },
    ],
  },
  {
    id: "l2",
    title: "Solving: 3y − 4 = 11",
    originalEquation: "3y − 4 = 11",
    steps: [
      {
        id: "s1",
        label: "Original",
        equationSteps: [
          { id: "e1", text: "3y − 4 = 11", isHighlighted: true },
        ],
        speechTitle: "New Challenge!",
        speechMessage: "Let's solve for y. We'll move constants to one side and isolate y!",
        speechRule: "Goal: find y",
      },
      {
        id: "s2",
        label: "Flip Sign",
        equationSteps: [
          { id: "e1", text: "3y − 4 = 11", isCompleted: true },
          { id: "e2", text: "3y = 11 + 4", isHighlighted: true },
        ],
        speechTitle: "Flip the Sign",
        speechMessage: "Move −4 across the equals sign. −4 becomes +4 when it crosses!",
        speechRule: "−4 moves → becomes +4",
      },
      {
        id: "s3",
        label: "Simplify",
        equationSteps: [
          { id: "e1", text: "3y − 4 = 11", isCompleted: true },
          { id: "e2", text: "3y = 11 + 4", isCompleted: true },
          { id: "e3", text: "3y = 15", isHighlighted: true },
        ],
        speechTitle: "Add It Up",
        speechMessage: "11 + 4 = 15. So now we have 3y = 15. One more step!",
        speechRule: "11 + 4 = 15",
      },
      {
        id: "s4",
        label: "Answer!",
        equationSteps: [
          { id: "e1", text: "3y − 4 = 11", isCompleted: true },
          { id: "e2", text: "3y = 15", isCompleted: true },
          { id: "e3", text: "y = 15 ÷ 3", isCompleted: true },
          { id: "e4", text: "y = 5", isHighlighted: true },
        ],
        speechTitle: "Solved!",
        speechMessage: "y = 5! Check: 3(5) − 4 = 15 − 4 = 11 ✓ Amazing!",
        speechRule: "y = 5 is correct!",
      },
    ],
  },
];

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const [lessonIndex, setLessonIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const nextBtnScale = useSharedValue(1);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) {
        router.replace("/onboarding");
      }
    });
  }, []);

  const lesson = LESSONS[lessonIndex];
  const currentStep = lesson.steps[stepIndex];
  const isLastStep = stepIndex === lesson.steps.length - 1;
  const isLastLesson = lessonIndex === LESSONS.length - 1;

  const indicatorSteps = lesson.steps.map((s, i) => ({
    id: s.id,
    label: s.label,
    isActive: i === stepIndex,
    isCompleted: i < stepIndex,
  }));

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nextBtnScale.value = withSpring(0.94, {}, () => {
      nextBtnScale.value = withSpring(1);
    });

    if (!isLastStep) {
      setStepIndex((prev) => prev + 1);
    } else if (!isLastLesson) {
      setLessonIndex((prev) => prev + 1);
      setStepIndex(0);
    } else {
      setLessonIndex(0);
      setStepIndex(0);
    }
  }, [isLastStep, isLastLesson]);

  const handlePrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    } else if (lessonIndex > 0) {
      setLessonIndex((prev) => prev - 1);
      setStepIndex(LESSONS[lessonIndex - 1].steps.length - 1);
    }
  }, [stepIndex, lessonIndex]);

  const nextBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextBtnScale.value }],
  }));

  const webTopPadding = Platform.OS === "web" ? 67 : 0;
  const webBottomPadding = Platform.OS === "web" ? 84 : 0;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? webTopPadding : insets.top,
          paddingBottom: Platform.OS === "web" ? webBottomPadding : 0,
        },
      ]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name="pencil-ruler" size={16} color={C.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Math Tutor</Text>
            <Text style={styles.headerSub}>{lesson.title}</Text>
          </View>
        </View>
        <View style={styles.lessonCounter}>
          <Text style={styles.lessonCounterText}>
            Lesson {lessonIndex + 1}/{LESSONS.length}
          </Text>
        </View>
      </Animated.View>

      {/* Step progress */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.stepIndicatorContainer}>
        <StepIndicator steps={indicatorSteps} onStepPress={(id) => {
          const idx = lesson.steps.findIndex((s) => s.id === id);
          if (idx !== -1) setStepIndex(idx);
        }} />
      </Animated.View>

      {/* Main split-screen layout */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Left / Control Area */}
        <Animated.View
          key={`control-${lessonIndex}-${stepIndex}`}
          entering={FadeInDown.delay(150).duration(350)}
          style={styles.section}
        >
          <View style={styles.sectionLabel}>
            <View style={[styles.sectionDot, { backgroundColor: C.orange }]} />
            <Text style={styles.sectionLabelText}>Control Area</Text>
          </View>
          <HandwrittenEquation steps={currentStep.equationSteps} />
        </Animated.View>

        {/* Right / Practice Area */}
        <Animated.View
          key={`practice-${lessonIndex}-${stepIndex}`}
          entering={FadeInDown.delay(250).duration(350)}
          style={styles.section}
        >
          <View style={styles.sectionLabel}>
            <View style={[styles.sectionDot, { backgroundColor: C.primary }]} />
            <Text style={styles.sectionLabelText}>Practice Area</Text>
          </View>
          <View style={styles.practiceArea}>
            {/* Speech bubble above robot */}
            <SpeechBubble
              title={currentStep.speechTitle}
              message={currentStep.speechMessage}
              rule={currentStep.speechRule}
            />
            <View style={styles.robotContainer}>
              <RobotMascot size={90} />
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Navigation buttons */}
      <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.navBar, { paddingBottom: Platform.OS === "web" ? 8 : insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[
            styles.prevButton,
            (stepIndex === 0 && lessonIndex === 0) && styles.buttonDisabled,
          ]}
          onPress={handlePrev}
          disabled={stepIndex === 0 && lessonIndex === 0}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={C.primary} />
          <Text style={styles.prevButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.stepCounterPill}>
          <Text style={styles.stepCounterText}>
            Step {stepIndex + 1} of {lesson.steps.length}
          </Text>
        </View>

        <Animated.View style={nextBtnStyle}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep && isLastLesson
                ? "Restart"
                : isLastStep
                ? "Next Lesson"
                : "Next Step"}
            </Text>
            <Ionicons
              name={isLastStep && isLastLesson ? "refresh" : "chevron-forward"}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.text,
    lineHeight: 20,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 16,
  },
  lessonCounter: {
    backgroundColor: C.backgroundAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  lessonCounterText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.primary,
  },
  stepIndicatorContainer: {
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionLabelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  practiceArea: {
    gap: 0,
    alignItems: "center",
  },
  robotContainer: {
    marginTop: 4,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    gap: 8,
  },
  prevButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  prevButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.primary,
  },
  stepCounterPill: {
    backgroundColor: C.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  stepCounterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.textSecondary,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
