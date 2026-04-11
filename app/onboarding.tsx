import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OwlMascot } from "@/components/OwlMascot";
import { OWL_MASCOT_VIEW_ASPECT } from "@/components/OwlMascotSvg";
import Colors from "@/constants/colors";
import { ROUTE_HOME } from "@/constants/routes";
import { getOnboardingInlineMascotSize } from "@/utils/mascotSizing";
import { AppStorage } from "@/utils/storage";

const C = Colors.light;
const { width: SCREEN_W } = Dimensions.get("window");

const ONBOARDING_KEY = "math_tutor_onboarding_v1";

/** `OwlMascot` compactLayout outer height = size × this */
const SLIDE1_MASCOT_OUTER = 1.1;
/** Fixed gap between owl and “WISE OWL” — no large arbitrary margin */
const SLIDE1_GAP_BADGE = 8;

function Slide1() {
  const { width: windowW, height: windowH } = useWindowDimensions();
  const [slideInnerH, setSlideInnerH] = useState(0);
  const [bottomBlockH, setBottomBlockH] = useState(0);

  const titleFontSize =
    windowH < 560 ? 20 : windowH < 620 ? 22 : windowH < 720 ? 24 : windowH < 840 ? 26 : 28;
  const titleLineHeight = Math.round(titleFontSize * 1.25);
  const subtitleFontSize = windowH < 560 ? 12 : windowH < 620 ? 13 : 14;
  const subtitleLineHeight = Math.round(subtitleFontSize * 1.45);
  const featurePadV = windowH < 560 ? 6 : windowH < 640 ? 8 : 10;
  const featureGap = windowH < 600 ? 6 : 10;

  const mascotSize = useMemo(() => {
    const maxFromWidth = (windowW - 48) / OWL_MASCOT_VIEW_ASPECT;
    if (slideInnerH <= 0 || bottomBlockH <= 0) {
      const guess = Math.min(maxFromWidth, (windowH * 0.28) / SLIDE1_MASCOT_OUTER);
      return Math.max(44, Math.min(200, Math.floor(guess)));
    }
    const available = slideInnerH - bottomBlockH - SLIDE1_GAP_BADGE;
    const raw = available / SLIDE1_MASCOT_OUTER;
    return Math.floor(Math.max(44, Math.min(240, Math.min(raw, maxFromWidth))));
  }, [slideInnerH, bottomBlockH, windowW, windowH]);

  return (
    <View
      style={slideStyles.slide1Root}
      onLayout={(e) => setSlideInnerH(e.nativeEvent.layout.height)}
    >
      <View style={slideStyles.slide1MascotSlot}>
        <Animated.View entering={ZoomIn.delay(200).duration(600)}>
          <OwlMascot compactLayout size={mascotSize} />
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        onLayout={(e) => setBottomBlockH(e.nativeEvent.layout.height)}
        style={slideStyles.slide1Copy}
      >
        <View style={slideStyles.badge}>
          <Text style={slideStyles.badgeText}>WISE OWL</Text>
        </View>
        <Text style={[slideStyles.title, { fontSize: titleFontSize, lineHeight: titleLineHeight }]}>
          The Future of{"\n"}Learning Math
        </Text>
        <Text
          style={[
            slideStyles.subtitle,
            { fontSize: subtitleFontSize, lineHeight: subtitleLineHeight },
          ]}
        >
          I don't just give answers. I analyze your steps, find exactly where you're struggling, and
          guide you back to core basics.
        </Text>
        <View
          style={[slideStyles.featureGrid, { gap: featureGap, marginTop: windowH < 640 ? 4 : 6 }]}
        >
          {[
            { icon: "analytics", detail: "Step Diagnostics", color: C.primary },
            { icon: "trending-up", detail: "Adaptive Levels", color: C.accent },
            { icon: "book", detail: "Theory on Demand", color: C.orange },
          ].map((f, i) => (
            <Animated.View
              key={f.detail}
              entering={FadeInUp.delay(600 + i * 100)}
              style={[slideStyles.featureItem, { paddingVertical: featurePadV }]}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={slideStyles.slideScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(200)} style={slideStyles.textBlockTop}>
          <Text style={slideStyles.stepLabel}>METHODOLOGY</Text>
          <Text style={slideStyles.title}>Step-by-Step Solving</Text>
          <Text style={slideStyles.subtitle}>
            Just like a real notebook, we encourage you to solve math problems step-by-step instead
            of just guessing the final answer.
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
      </ScrollView>
    </View>
  );
}

function Slide3() {
  const { width: windowW, height: windowH } = useWindowDimensions();
  const inlineMascotSize = getOnboardingInlineMascotSize(windowW, windowH);

  return (
    <View style={slideStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={slideStyles.slideScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(200)} style={slideStyles.textBlockTop}>
          <Text style={slideStyles.stepLabel}>SMART FEEDBACK</Text>
          <Text style={slideStyles.title}>We Find Exact Mistakes</Text>
          <Text style={slideStyles.subtitle}>
            If you make a mathematical error, I'll pinpoint exactly which step went wrong and
            explain why.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={slideStyles.interactiveMockWrap}>
          <View style={slideStyles.mockNotebook}>
            <View style={slideStyles.mockErrorToast}>
              <OwlMascot size={inlineMascotSize} />
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
      </ScrollView>
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
        style={styles.listFill}
        data={SLIDES_CONTENT}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => <View style={styles.slidePage}>{item.render()}</View>}
        scrollEventThrottle={16}
      />

      <View style={[styles.bottomBar, { paddingBottom: botPad + 24 }]}>
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
              flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
              })
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
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  /** Slide 1 only: fill slide, no vertical centering — no ScrollView */
  slide1Root: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    paddingHorizontal: 24,
    justifyContent: "flex-start",
  },
  slide1MascotSlot: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: SLIDE1_GAP_BADGE,
  },
  slide1Copy: {
    width: "100%",
    flexShrink: 0,
    gap: 12,
    alignItems: "center",
  },
  slideScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  textBlock: {
    gap: 12,
    alignItems: "center",
    width: "100%",
    paddingTop: 0,
  },
  textBlockTop: {
    gap: 12,
    alignItems: "center",
    width: "100%",
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
    letterSpacing: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 36,
    color: C.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: C.textSecondary,
    textAlign: "center",
    maxWidth: 320,
    alignSelf: "center",
  },
  featureGrid: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    marginTop: 6,
    gap: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
    width: "100%",
  },
  featureText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.text,
    flex: 1,
  },
  stepLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  interactiveMockWrap: {
    paddingTop: 16,
    width: "100%",
  },
  mockNotebook: {
    backgroundColor: C.notebook,
    borderRadius: 24,
    paddingRight: 16,
    paddingLeft: 40,
    paddingBottom: 24,
    minHeight: 280,
    width: "100%",
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "visible",
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
    fontSize: 26,
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
    backgroundColor: C.primaryTintSurface,
    borderRadius: 8,
    marginRight: -10,
    paddingLeft: 5,
  },
  mockRowError: {
    backgroundColor: C.errorTintSurface,
    borderRadius: 8,
    marginRight: -10,
    paddingLeft: 5,
  },
  mockRowText: {
    fontFamily: "Inter_500Medium",
    fontSize: 22,
    color: C.text,
  },
  mockRowTextActive: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.primary,
  },
  mockRowTextError: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.error,
    textDecorationLine: "line-through",
  },
  mockErrorToast: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
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
    fontSize: 14,
    lineHeight: 20,
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
  listFill: {
    flex: 1,
  },
  slidePage: {
    width: SCREEN_W,
    flex: 1,
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
