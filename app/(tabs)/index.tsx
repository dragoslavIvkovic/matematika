import React, { useState, useEffect, useCallback } from "react";
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
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { RobotMascot } from "@/components/RobotMascot";
import { LEVEL_CONFIGS, getLevelConfig, LevelId } from "@/utils/ProblemGenerator";
import { LevelManager, LevelState } from "@/utils/LevelManager";
import { getTheoryContent, hasTheory } from "@/utils/TheoryContent";

const C = Colors.light;
const ONBOARDING_KEY = "math_tutor_onboarding_v1";

const LEVEL_COLORS: Record<string, string> = {
  "1.1": "#10B981",
  "1.2": "#3B82F6",
  "1.3": "#F97316",
  "1.4": "#8B5CF6",
  "1.5": "#EC4899",
  "1.6": "#06B6D4",
};

function ProgressBar({
  progress,
  color,
  delay = 0,
}: {
  progress: number;
  color: string;
  delay?: number;
}) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [progress, delay]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));
  return (
    <View style={pbStyles.track}>
      <Animated.View
        style={[pbStyles.fill, barStyle, { backgroundColor: color }]}
      />
    </View>
  );
}
const pbStyles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
    flex: 1,
  },
  fill: { height: "100%", borderRadius: 3 },
});

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<LevelState | null>(null);
  const [manager, setManager] = useState<LevelManager | null>(null);

  useEffect(() => {
    // Check onboarding
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) {
        router.replace("/onboarding");
      }
    });
    // Load state
    LevelManager.load().then((mgr) => {
      setManager(mgr);
      setState(mgr.getState());
    });
  }, []);

  // Refresh when screen comes into focus
  useEffect(() => {
    const interval = setInterval(() => {
      LevelManager.load().then((mgr) => {
        setManager(mgr);
        setState(mgr.getState());
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  const totalSolved = state?.totalSolved || 0;
  const completedCount = state?.completedLevels.length || 0;
  const currentLevel = state?.currentLevel || "1.1";

  const getGreeting = () => {
    if (completedCount === 0)
      return "Let's begin your math journey!";
    if (completedCount < 3)
      return "Great progress! Keep going!";
    if (completedCount < 6)
      return "You're doing amazing! Almost there!";
    return "Math master! All levels complete!";
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? webTopPadding : insets.top },
      ]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons
              name="pencil-ruler"
              size={16}
              color={C.primary}
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>Math Tutor</Text>
            <Text style={styles.headerSub}>Your learning dashboard</Text>
          </View>
        </View>
        <View style={styles.levelPill}>
          <Feather name="award" size={14} color={C.orange} />
          <Text style={styles.levelPillText}>Lv {currentLevel}</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Platform.OS === "web" ? 84 + 16 : insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Robot greeting */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.greetingCard}
        >
          <RobotMascot size={70} />
          <View style={styles.greetingText}>
            <Text style={styles.greetingTitle}>Hi there! 👋</Text>
            <Text style={styles.greetingMessage}>{getGreeting()}</Text>
            <View style={styles.overallProgress}>
              <ProgressBar
                progress={(completedCount / LEVEL_CONFIGS.length) * 100}
                color={C.primary}
                delay={300}
              />
              <Text style={styles.overallProgressText}>
                {completedCount}/{LEVEL_CONFIGS.length} levels
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick stats */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.statsRow}
        >
          <View style={[styles.statCard, { borderTopColor: C.accent }]}>
            <Ionicons name="checkmark-circle" size={20} color={C.accent} />
            <Text style={styles.statValue}>{totalSolved}</Text>
            <Text style={styles.statLabel}>Solved</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: C.orange }]}>
            <MaterialCommunityIcons name="fire" size={20} color={C.orange} />
            <Text style={styles.statValue}>
              {state?.streak || 0}
            </Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#8B5CF6" }]}>
            <Ionicons name="trophy" size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Levels</Text>
          </View>
        </Animated.View>

        {/* Current level CTA */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <TouchableOpacity
            style={styles.continueCta}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/practice");
            }}
            activeOpacity={0.9}
          >
            <View style={styles.ctaLeft}>
              <View
                style={[
                  styles.ctaIcon,
                  { backgroundColor: LEVEL_COLORS[currentLevel] || C.primary },
                ]}
              >
                <Ionicons name="play" size={24} color="#FFF" />
              </View>
              <View style={styles.ctaTextBlock}>
                <Text style={styles.ctaTitle}>Continue Practice</Text>
                <Text style={styles.ctaSub}>
                  Level {currentLevel} —{" "}
                  {getLevelConfig(currentLevel as LevelId).name}
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={22} color={C.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Level roadmap */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>Level Roadmap</Text>
        </Animated.View>

        {LEVEL_CONFIGS.map((config, index) => {
          const completed = state?.completedLevels.includes(config.id) || false;
          const isCurrent = config.id === currentLevel;
          const color = LEVEL_COLORS[config.id] || C.primary;
          const stats = state?.levelStats[config.id];
          const solved = stats?.solved || 0;
          const bestStreak = stats?.bestStreak || 0;

          // Calculate progress as percent of required streak
          const progressPercent = completed
            ? 100
            : isCurrent
            ? (state?.streak || 0) / config.requiredStreak * 100
            : 0;

          return (
            <Animated.View
              key={config.id}
              entering={FadeInDown.delay(300 + index * 50).duration(400)}
            >
              <View style={styles.roadmapItem}>
                {/* Connector line */}
                {index < LEVEL_CONFIGS.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      { backgroundColor: completed ? color : "#E2E8F0" },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.roadmapDot,
                    {
                      backgroundColor: completed ? color : isCurrent ? color : "#E2E8F0",
                      borderColor: isCurrent ? color : "transparent",
                      borderWidth: isCurrent ? 3 : 0,
                    },
                  ]}
                >
                  {completed ? (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  ) : (
                    <Text style={styles.roadmapDotText}>{config.id}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.roadmapContent}
                  activeOpacity={0.8}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (manager) {
                      manager.setCurrentLevel(config.id);
                      await manager.save();
                      router.push("/(tabs)/practice?action=start");
                    }
                  }}
                >
                  <View style={styles.roadmapHeader}>
                    <Text
                      style={[
                        styles.roadmapName,
                        isCurrent && { color },
                      ]}
                    >
                      {config.name}
                    </Text>
                    {completed && (
                      <View style={[styles.completedChip, { backgroundColor: color + "20" }]}>
                        <Text style={[styles.completedChipText, { color }]}>
                          ✓ Done
                        </Text>
                      </View>
                    )}
                    {isCurrent && !completed && (
                      <View style={styles.currentChip}>
                        <Text style={styles.currentChipText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.roadmapDesc}>{config.description}</Text>
                  <View style={styles.roadmapMeta}>
                    <ProgressBar progress={progressPercent} color={color} delay={400 + index * 80} />
                    <Text style={[styles.roadmapMetaText, { color }]}>
                      {solved > 0 && `${solved} solved`}
                      {bestStreak > 0 && ` · 🔥${bestStreak}`}
                      {!solved && !bestStreak && `${config.requiredStreak} needed`}
                    </Text>
                  </View>
                  {hasTheory(config.id) && (
                    <View style={styles.theoryTag}>
                      <Ionicons name="book-outline" size={10} color={C.textMuted} />
                      <Text style={styles.theoryTagText}>Includes theory lesson</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  levelPillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#92400E",
  },
  scrollContent: { padding: 16, gap: 14 },

  // Greeting card
  greetingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  greetingText: { flex: 1, gap: 4 },
  greetingTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: C.text,
  },
  greetingMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
  overallProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  overallProgressText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.textMuted,
    width: 60,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.textMuted,
  },

  // Continue CTA
  continueCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: C.primaryLight,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  ctaLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTextBlock: { gap: 2, flex: 1 },
  ctaTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.text,
  },
  ctaSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },

  // Section header
  sectionHeader: { marginTop: 4 },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.text,
  },

  // Roadmap
  roadmapItem: {
    flexDirection: "row",
    gap: 14,
    position: "relative",
    minHeight: 80,
  },
  connectorLine: {
    position: "absolute",
    left: 15,
    top: 32,
    bottom: -12,
    width: 2,
    borderRadius: 1,
  },
  roadmapDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 4,
  },
  roadmapDotText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#FFF",
  },
  roadmapContent: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  roadmapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roadmapName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.text,
  },
  completedChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completedChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
  },
  currentChip: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  currentChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#92400E",
    letterSpacing: 0.5,
  },
  roadmapDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 16,
  },
  roadmapMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roadmapMetaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    width: 80,
  },
  theoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  theoryTagText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: C.textMuted,
  },
});
