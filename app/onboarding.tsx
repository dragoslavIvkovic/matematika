import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RobotMascot } from "@/components/RobotMascot";
import Colors from "@/constants/colors";
import { ROUTE_HOME } from "@/constants/routes";
import { AppStorage } from "@/utils/storage";

const C = Colors.light;
const { width: SCREEN_W } = Dimensions.get("window");

const ONBOARDING_KEY = "math_tutor_onboarding_v1";

function Slide1() {
  return (
    <View style={slideStyles.container}>
      <Animated.View entering={ZoomIn.delay(200).duration(600)} style={slideStyles.robotWrap}>
        <RobotMascot size={120} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={slideStyles.textBlock}>
        <View style={slideStyles.badge}>
          <Text style={slideStyles.badgeText}>SMART TUTOR</Text>
        </View>
        <Text style={slideStyles.title}>The Future of{"\n"}Learning Math</Text>
        <Text style={slideStyles.subtitle}>
          I don't just give answers. I analyze your steps, find exactly where you're struggling, and
          guide you back to core basics.
        </Text>
        <View style={slideStyles.featureGrid}>
          {[
            { icon: "analytics", detail: "Step Diagnostics", color: C.primary },
            { icon: "trending-up", detail: "Adaptive Levels", color: C.accent },
            { icon: "book", detail: "Theory on Demand", color: C.orange },
          ].map((f, i) => (
            <Animated.View
              key={f.detail}
              entering={FadeInUp.delay(600 + i * 100)}
              style={slideStyles.featureItem}
            >
              <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={20} color={f.color} />
              <Text style={slideStyles.featureText}>{f.detail}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function Slide2() {
  return (
    <View style={slideStyles.container}>
      <Animated.View entering={FadeInDown.delay(200)} style={slideStyles.textBlockTop}>
        <Text style={slideStyles.stepLabel}>METHODOLOGY</Text>
        <Text style={slideStyles.title}>Step-by-Step Solving</Text>
        <Text style={slideStyles.subtitle}>
          Just like a real notebook, we encourage you to solve math problems step-by-step instead of
          just guessing the final answer.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400)} style={slideStyles.interactiveMockWrap}>
        <View style={slideStyles.mockNotebook}>
          <View style={slideStyles.mockHeader}>
            <Text style={slideStyles.mockEquationText}>2x + 4 = 10</Text>
          </View>

          {/* Notebook lines */}
          {["nb1", "nb2", "nb3"].map((k, i) => (
            <View key={k} style={[slideStyles.mockNotebookLine, { top: 68 + i * 46 }]} />
          ))}
          <View style={slideStyles.mockMarginLine} />

          <View style={slideStyles.mockRow}>
            <Text style={slideStyles.mockRowText}>2x = 10 - 4</Text>
            <Ionicons name="checkmark-circle" size={18} color={C.success} />
          </View>
          <View style={slideStyles.mockRow}>
            <Text style={slideStyles.mockRowText}>2x = 6</Text>
            <Ionicons name="checkmark-circle" size={18} color={C.success} />
          </View>
          <View style={[slideStyles.mockRow, slideStyles.mockRowActive]}>
            <Text style={slideStyles.mockRowTextActive}>x = 3</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function Slide3() {
  return (
    <View style={slideStyles.container}>
      <Animated.View entering={FadeInDown.delay(200)} style={slideStyles.textBlockTop}>
        <Text style={slideStyles.stepLabel}>SMART FEEDBACK</Text>
        <Text style={slideStyles.title}>We Find Exact Mistakes</Text>
        <Text style={slideStyles.subtitle}>
          If you make a mathematical error, I'll pinpoint exactly which step went wrong and explain
          why.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(400)}
        style={[slideStyles.interactiveMockWrap, { justifyContent: "center", marginBottom: 20 }]}
      >
        <View style={slideStyles.mockNotebook}>
          <View style={slideStyles.mockErrorToast}>
            <RobotMascot size={32} />
            <Text style={slideStyles.mockErrorText}>
              Wait, when moving +4 to the other side, it should become -4!
            </Text>
          </View>

          <View style={slideStyles.mockHeader}>
            <Text style={slideStyles.mockEquationText}>2x + 4 = 10</Text>
          </View>

          {["nbe1", "nbe2"].map((k, i) => (
            <View key={k} style={[slideStyles.mockNotebookLine, { top: 155 + i * 46 }]} />
          ))}
          <View style={[slideStyles.mockMarginLine, { top: 75 }]} />

          <View style={[slideStyles.mockRow, slideStyles.mockRowError]}>
            <Text style={slideStyles.mockRowTextError}>2x = 10 + 4</Text>
            <Ionicons name="close-circle" size={18} color={C.error} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Persist onboarding status
    AppStorage.setString(ONBOARDING_KEY, "done");
    router.replace(ROUTE_HOME);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const SLIDES_CONTENT = [
    { id: "s1", render: () => <Slide1 /> },
    {
      id: "s2",
      render: () => <Slide2 />,
    },
    {
      id: "s3",
      render: () => <Slide3 />,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {currentIndex < 2 && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: topPad + 12 }]}
          onPress={handleFinish}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES_CONTENT}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W, height: "100%" }}>{item.render()}</View>
        )}
        scrollEventThrottle={16}
      />

      <View style={[styles.bottomBar, { paddingBottom: botPad + 16 }]}>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {currentIndex < 2 ? (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() =>
              flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
            }
            activeOpacity={0.9}
          >
            <Text style={styles.ctaBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color={C.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.ctaBtn} onPress={handleFinish} activeOpacity={0.9}>
            <Text style={styles.ctaBtnText}>Start Learning</Text>
            <Ionicons name="checkmark-circle" size={18} color={C.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const slideStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 20,
  },
  robotWrap: {
    alignItems: "center",
    paddingTop: 20,
  },
  textBlock: {
    gap: 12,
    alignItems: "center",
  },
  textBlockTop: {
    gap: 8,
    alignItems: "center",
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
    fontSize: 12,
    color: C.primaryDark,
    letterSpacing: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.text,
    textAlign: "center",
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  featureText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.text,
  },
  stepLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  interactiveMockWrap: {
    flex: 1,
    paddingTop: 10,
    width: "100%",
  },
  mockNotebook: {
    backgroundColor: C.paper,
    borderRadius: 24,
    paddingRight: 16,
    paddingLeft: 40,
    paddingBottom: 24,
    minHeight: 280,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.borderLight,
    position: "relative",
  },
  mockNotebookLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.infoLight,
  },
  mockMarginLine: {
    position: "absolute",
    left: 32,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: C.errorLight,
    opacity: 0.6,
  },
  mockHeader: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.infoLight,
    marginBottom: 8,
  },
  mockEquationText: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
  },
  mockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 46,
    paddingRight: 8,
  },
  mockRowActive: {
    backgroundColor: "rgba(37, 99, 235, 0.05)", // C.primary with opacity
    borderRadius: 8,
    marginRight: -10,
    paddingLeft: 5,
  },
  mockRowError: {
    backgroundColor: "rgba(220, 38, 38, 0.05)", // C.error with opacity
    borderRadius: 8,
    marginRight: -10,
    paddingLeft: 5,
  },
  mockRowText: {
    fontFamily: "Inter_500Medium",
    fontSize: 20,
    color: C.text,
  },
  mockRowTextActive: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.primary,
  },
  mockRowTextError: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.error,
    textDecorationLine: "line-through",
  },
  mockErrorToast: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: -28,
    marginRight: 0,
    zIndex: 10,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: C.errorLight,
  },
  mockErrorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 18,
    color: C.text,
    flex: 1,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.primary,
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 22,
    width: "100%",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: C.white,
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: C.primary,
  },
  dotInactive: {
    backgroundColor: C.border,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignSelf: "stretch",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.white,
  },
});
