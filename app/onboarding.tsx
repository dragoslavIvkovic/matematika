import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import type React from "react";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HandwrittenEquation } from "@/components/HandwrittenEquation";
import { RobotMascot } from "@/components/RobotMascot";
import Colors from "@/constants/colors";

const C = Colors.light;
const { width: SCREEN_W } = Dimensions.get("window");

const ONBOARDING_KEY = "math_tutor_onboarding_v1";

interface Slide {
  id: string;
  Component: React.FC;
}

function Slide1() {
  return (
    <View style={slideStyles.container}>
      <Animated.View entering={FadeIn.delay(200).duration(600)} style={slideStyles.robotWrap}>
        <RobotMascot size={110} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={slideStyles.textBlock}>
        <View style={slideStyles.badge}>
          <Text style={slideStyles.badgeText}>Welcome!</Text>
        </View>
        <Text style={slideStyles.title}>Your Personal{"\n"}Math Tutor</Text>
        <Text style={slideStyles.subtitle}>
          I'll guide you through math step-by-step. We'll solve real equations together — and I'll
          check your work!
        </Text>
      </Animated.View>
    </View>
  );
}

function Slide2() {
  return (
    <View style={slideStyles.container}>
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={slideStyles.textBlockTop}
      >
        <Text style={slideStyles.stepLabel}>Step 1</Text>
        <Text style={slideStyles.title}>Read the Problem</Text>
        <Text style={slideStyles.subtitle}>
          Each problem appears clearly on screen. Take your time — the steps are shown to guide you.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(350).duration(500)} style={slideStyles.demoCard}>
        <View style={slideStyles.demoLabelRow}>
          <View style={[slideStyles.dot, { backgroundColor: C.orange }]} />
          <Text style={slideStyles.demoLabel}>Problem</Text>
        </View>
        <HandwrittenEquation steps={[{ id: "e1", text: "2x + 1 = 5", isHighlighted: true }]} />
        <View style={slideStyles.robotSmallRow}>
          <RobotMascot size={50} />
          <View style={slideStyles.tipBubble}>
            <Text style={slideStyles.tipText}>Solve for x — then show me your work!</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function Slide3() {
  return (
    <View style={slideStyles.container}>
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={slideStyles.textBlockTop}
      >
        <Text style={slideStyles.stepLabel}>Step 2</Text>
        <Text style={slideStyles.title}>Submit Your Work</Text>
        <Text style={slideStyles.subtitle}>
          You have two ways to answer. Pick whichever feels most natural!
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(350).duration(500)} style={slideStyles.methodsGrid}>
        <View style={[slideStyles.methodCard, { borderColor: C.primary }]}>
          <View style={[slideStyles.methodIcon, { backgroundColor: C.primary }]}>
            <Ionicons name="camera" size={28} color={C.white} />
          </View>
          <Text style={slideStyles.methodTitle}>Snap a Photo</Text>
          <Text style={slideStyles.methodDesc}>
            Write your solution on paper and photograph it. I'll read and check your work!
          </Text>
          <View style={slideStyles.methodBadge}>
            <Text style={slideStyles.methodBadgeText}>Option A</Text>
          </View>
        </View>

        <View style={[slideStyles.methodCard, { borderColor: C.accent }]}>
          <View style={[slideStyles.methodIcon, { backgroundColor: C.accent }]}>
            <Feather name="edit-3" size={26} color={C.white} />
          </View>
          <Text style={slideStyles.methodTitle}>Type It In</Text>
          <Text style={slideStyles.methodDesc}>
            Tap the keyboard and type your answer directly. Fast and simple!
          </Text>
          <View
            style={[
              slideStyles.methodBadge,
              { backgroundColor: C.cardCorrect, borderColor: C.accentLight },
            ]}
          >
            <Text style={[slideStyles.methodBadgeText, { color: C.successDark }]}>Option B</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function Slide4() {
  return (
    <View style={slideStyles.container}>
      <Animated.View entering={FadeIn.delay(200).duration(600)} style={slideStyles.robotWrap}>
        <RobotMascot size={100} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={slideStyles.textBlock}>
        <View
          style={[
            slideStyles.badge,
            { backgroundColor: C.cardCorrect, borderColor: C.accentLight },
          ]}
        >
          <Text style={[slideStyles.badgeText, { color: C.successDark }]}>All Set!</Text>
        </View>
        <Text style={slideStyles.title}>Let's Start{"\n"}Solving!</Text>
        <Text style={slideStyles.subtitle}>
          Your first problem is ready. Remember — I'm here to help every step of the way.
        </Text>

        <View style={slideStyles.reminderRow}>
          {[
            { icon: "checkmark-circle", label: "Step-by-step guidance" },
            { icon: "camera", label: "Snap or type answers" },
            { icon: "star", label: "Earn achievements" },
          ].map((item) => (
            <View key={item.label} style={slideStyles.reminderItem}>
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={C.primary}
              />
              <Text style={slideStyles.reminderText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const SLIDES: Slide[] = [
  { id: "s1", Component: Slide1 },
  { id: "s2", Component: Slide2 },
  { id: "s3", Component: Slide3 },
  { id: "s4", Component: Slide4 },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      await AsyncStorage.setItem(ONBOARDING_KEY, "done");
      router.replace("/(tabs)/practice");
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "done");
    router.replace("/(tabs)/practice");
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: topPad + 12 }]}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W }}>
            <item.Component />
          </View>
        )}
        scrollEventThrottle={16}
      />

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: botPad + 16 }]}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, i) => (
            <TouchableOpacity
              key={slide.id}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index: i, animated: true });
              }}
            >
              <View
                style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.ctaBtn, isLast && styles.ctaBtnGreen]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaBtnText}>{isLast ? "Start Practicing!" : "Next"}</Text>
          <Ionicons name={isLast ? "rocket" : "arrow-forward"} size={18} color={C.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const slideStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    justifyContent: "center",
    gap: 24,
  },
  robotWrap: {
    alignItems: "center",
    paddingTop: 8,
  },
  textBlock: {
    gap: 12,
    alignItems: "center",
  },
  textBlockTop: {
    gap: 8,
  },
  badge: {
    backgroundColor: C.cardNeutral,
    borderWidth: 1.5,
    borderColor: C.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: C.primaryDark,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: C.text,
    textAlign: "center",
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  stepLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  demoCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 18,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    gap: 12,
  },
  demoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  demoLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  robotSmallRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  tipBubble: {
    flex: 1,
    backgroundColor: C.backgroundAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: C.primaryLight,
  },
  tipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.primaryDark,
    lineHeight: 18,
  },
  methodsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  methodCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    gap: 8,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  methodTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.text,
  },
  methodDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
  methodBadge: {
    backgroundColor: C.cardNeutral,
    borderWidth: 1,
    borderColor: C.primaryLight,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  methodBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: C.primaryDark,
  },
  reminderRow: {
    gap: 10,
    marginTop: 4,
    alignSelf: "stretch",
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reminderText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  skipBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: C.whiteOverlay,
  },
  skipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.textSecondary,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
    alignItems: "center",
    backgroundColor: C.background,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {},
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.border,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignSelf: "stretch",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnGreen: {
    backgroundColor: C.accent,
    shadowColor: C.accent,
  },
  ctaBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.white,
  },
});
