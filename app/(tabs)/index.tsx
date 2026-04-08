import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { type Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DailyPracticeCard } from "@/components/DailyPracticeCard";
import { DailyPracticeSelectionModal } from "@/components/DailyPracticeSelectionModal";
import { WeakAreasCard } from "@/components/WeakAreasCard";
import { WeeklyStreak } from "@/components/WeeklyStreak";
import Colors from "@/constants/colors";
import {
  ROUTE_DAILY_PRACTICE,
  ROUTE_ONBOARDING,
  ROUTE_PRACTICE,
  ROUTE_WEAK_PRACTICE,
} from "@/constants/routes";
import { useDailyPracticeStore } from "@/store/dailyPracticeStore";
import { useLevelStatsStore } from "@/store/levelStatsStore";
import { computeDailyStreak } from "@/utils/dateUtils";
import { LevelManager } from "@/utils/LevelManager";
import { LEVEL_CONFIGS } from "@/utils/ProblemGenerator";
import { AppStorage } from "@/utils/storage";
import { hasTheory } from "@/utils/TheoryContent";

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
      withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, delay, width]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));
  return (
    <View style={pbStyles.track}>
      <Animated.View style={[pbStyles.fill, barStyle, { backgroundColor: color }]} />
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
  const [manager, setManager] = useState<LevelManager | null>(null);

  const totalSolved = useLevelStatsStore((s) => s.totalSolved);
  const completedLevels = useLevelStatsStore((s) => s.completedLevels);
  const levelStats = useLevelStatsStore((s) => s.levelStats);
  const activeDays = useLevelStatsStore((s) => s.activeDays);
  const currentLevel = useLevelStatsStore((s) => s.currentLevel);
  const streak = useLevelStatsStore((s) => s.streak);
  const syncStats = useLevelStatsStore((s) => s.syncFromManager);

  const completedCount = completedLevels.length;

  // ── Daily Practice state ──
  const dailySelectedLevels = useDailyPracticeStore((s) => s.selectedLevels);
  const setDailySelectedLevels = useDailyPracticeStore((s) => s.setSelectedLevels);
  const [showDailyModal, setShowDailyModal] = useState(false);

  useEffect(() => {
    // Check onboarding
    const isDone = AppStorage.getString(ONBOARDING_KEY) === "done";

    if (!isDone) {
      router.replace(ROUTE_ONBOARDING);
    }

    // Load manager for mutations & sync store
    const mgr = LevelManager.load();
    setManager(mgr);
    syncStats(mgr.getState());
  }, [syncStats]);

  const webTopPadding = Platform.OS === "web" ? 67 : 0;

  return (
    <View
      style={[styles.container, { paddingTop: Platform.OS === "web" ? webTopPadding : insets.top }]}
    >
      {/* 1. Streak */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <WeeklyStreak activeDays={activeDays} currentStreak={computeDailyStreak(activeDays)} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Platform.OS === "web" ? 84 + 16 : insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Subscription Status */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={styles.subBadge}>
            <Ionicons name="diamond-outline" size={14} color={C.primary} />
            <Text style={styles.subBadgeText}>Free</Text>
          </View>
        </Animated.View>

        {/* 3. Daily Practice Card — hero element */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <DailyPracticeCard
            onSetup={() => setShowDailyModal(true)}
            onStart={() => router.push(ROUTE_DAILY_PRACTICE)}
          />
        </Animated.View>

        {/* 4. Solved / Levels stats */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsRow}>
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
        </Animated.View>

        {/* 5. Secondary Practice Cards — compact row */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.secondaryRow}>
          {/* Weak Areas (conditional — returns null when no errors) */}
          <WeakAreasCard onStart={() => router.push(ROUTE_WEAK_PRACTICE)} />

          {/* Continue Practice (compact) */}
          <TouchableOpacity
            style={[
              styles.compactCta,
              {
                backgroundColor: C.levels[currentLevel] || C.primary,
                shadowColor: C.levels[currentLevel] || C.primary,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(ROUTE_PRACTICE);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.compactIcon}>
              <Ionicons name="play" size={18} color={C.white} />
            </View>
            <View style={styles.compactTextBlock}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                Continue
              </Text>
              <Text style={styles.compactSub} numberOfLines={1}>
                Lvl {currentLevel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </Animated.View>

        {/* Level roadmap */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Level 1 – Whole positive numbers</Text>
        </Animated.View>

        {LEVEL_CONFIGS.map((config, index) => {
          const completed = completedLevels.includes(config.id);
          const isCurrent = config.id === currentLevel;
          const color = C.levels[config.id] || C.primary;
          const stats = levelStats[config.id];
          const solved = stats?.solved || 0;
          const bestStreak = stats?.bestStreak || 0;

          // Calculate progress as percent of required streak
          const progressPercent = completed
            ? 100
            : isCurrent
              ? (streak / config.requiredStreak) * 100
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
                      manager.save();
                      syncStats(manager.getState());
                      router.push(`${ROUTE_PRACTICE}?action=start` as Href);
                    }
                  }}
                >
                  <View style={styles.roadmapHeader}>
                    <Text style={[styles.roadmapName, isCurrent && { color }]}>{config.name}</Text>
                    {completed && (
                      <View style={[styles.completedChip, { backgroundColor: `${color}20` }]}>
                        <Text style={[styles.completedChipText, { color }]}>✓ Done</Text>
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
                    <ProgressBar
                      progress={progressPercent}
                      color={color}
                      delay={400 + index * 80}
                    />
                    <Text style={[styles.roadmapMetaText, { color }]}>
                      {solved > 0 && `${solved} solved`}
                      {bestStreak > 0 && ` · 🔥${bestStreak}`}
                      {!solved && !bestStreak && `${config.requiredStreak} needed`}
                    </Text>
                  </View>
                  {hasTheory(config.id) && (
                    <TouchableOpacity
                      style={styles.theoryTag}
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (manager) {
                          manager.setCurrentLevel(config.id);
                          manager.save();
                          syncStats(manager.getState());
                          router.push(`${ROUTE_PRACTICE}?action=theory&level=${config.id}` as Href);
                        }
                      }}
                    >
                      <Ionicons name="book-outline" size={10} color={C.primary} />
                      <Text style={styles.theoryTagText}>Read theory lesson</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Daily Practice Selection Modal */}
      <DailyPracticeSelectionModal
        visible={showDailyModal}
        initialSelection={dailySelectedLevels}
        onConfirm={(levels) => {
          setDailySelectedLevels(levels);
          setShowDailyModal(false);
          router.push(ROUTE_DAILY_PRACTICE);
        }}
        onDismiss={() => setShowDailyModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: C.background,
  },
  scrollContent: { padding: 16, gap: 14 },

  // Subscription badge
  subBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  subBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.primary,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 2,
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

  // Secondary practice cards — compact half-width row
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  compactCta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  compactIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  compactTextBlock: {
    flex: 1,
    gap: 1,
  },
  compactTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.white,
    letterSpacing: -0.3,
  },
  compactSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
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
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: `${C.primary}10`,
  },
  theoryTagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: C.primary,
  },
});
