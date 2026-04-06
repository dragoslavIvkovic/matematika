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
import { WeeklyStreak } from "@/components/WeeklyStreak";
import { LEVEL_CONFIGS, getLevelConfig, LevelId } from "@/utils/ProblemGenerator";
import { LevelManager, LevelState } from "@/utils/LevelManager";
import { getTheoryContent, hasTheory } from "@/utils/TheoryContent";

const C = Colors.light;
const ONBOARDING_KEY = "math_tutor_onboarding_v1";

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
    backgroundColor: C.border,
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


  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? webTopPadding : insets.top },
      ]}
    >
      {/* Header with Weekly Streak */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <WeeklyStreak 
          activeDays={state?.activeDays || []} 
          currentStreak={state?.streak || 0} 
        />
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
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.dashboardWelcome}>
          <Text style={styles.dashboardTitle}>Your Path</Text>
          <View style={styles.progressSummary}>
             <ProgressBar
                progress={(completedCount / LEVEL_CONFIGS.length) * 100}
                color={C.primary}
                delay={300}
              />
              <Text style={styles.progressSummaryText}>
                {completedCount}/{LEVEL_CONFIGS.length} levels
              </Text>
          </View>
        </Animated.View>

        {/* Simplified stats */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.statsRow}
        >
          <View style={styles.miniStat}>
            <Ionicons name="checkmark-circle" size={14} color={C.accent} />
            <Text style={styles.miniStatValue}>{totalSolved}</Text>
            <Text style={styles.miniStatLabel}>Solved</Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="trophy" size={14} color={C.primary} />
            <Text style={styles.miniStatValue}>{completedCount}</Text>
            <Text style={styles.miniStatLabel}>Levels</Text>
          </View>
          <View style={styles.miniStat}>
             <Ionicons name="flash" size={14} color={C.orange} />
             <Text style={styles.miniStatValue}>Lv {currentLevel}</Text>
             <Text style={styles.miniStatLabel}>Current</Text>
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
                  { backgroundColor: C.levels[currentLevel] || C.primary },
                ]}
              >
                <Ionicons name="play" size={24} color={C.white} />
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
          <Text style={styles.sectionTitle}>Select Level</Text>
        </Animated.View>

        {LEVEL_CONFIGS.map((config, index) => {
          const completed = state?.completedLevels.includes(config.id) || false;
          const isCurrent = config.id === currentLevel;
          const color = C.levels[config.id] || C.primary;
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
                      { backgroundColor: completed ? color : C.border },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.roadmapDot,
                    {
                      backgroundColor: completed ? color : isCurrent ? color : C.border,
                      borderColor: isCurrent ? color : C.transparent,
                      borderWidth: isCurrent ? 3 : 0,
                    },
                  ]}
                >
                  {completed ? (
                    <Ionicons name="checkmark" size={14} color={C.white} />
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: C.background,
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
    backgroundColor: C.cardNeutral,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.cardNeutralBorder,
  },
  levelPillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: C.warning,
  },
  scrollContent: { padding: 16, gap: 14 },

  dashboardWelcome: { gap: 8, marginTop: 4 },
  dashboardTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: C.text,
    letterSpacing: -1,
  },
  progressSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressSummaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.textSecondary,
  },

  // Stats
  statsRow: { 
    flexDirection: "row", 
    gap: 12, 
    marginVertical: 4 
  },
  miniStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  miniStatValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.text,
  },
  miniStatLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.textMuted,
  },

  // Continue CTA
  continueCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surface,
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
  sectionHeader: { marginTop: 10, marginBottom: 4 },
  sectionTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
    color: C.text,
    letterSpacing: -0.5,
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
    color: C.white,
  },
  roadmapContent: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    shadowColor: C.black,
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
    backgroundColor: C.cardNeutral,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.cardNeutralBorder,
  },
  currentChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: C.warning,
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
