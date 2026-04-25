import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { type Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DailyPracticeCard } from "@/components/DailyPracticeCard";
import { DailyPracticeSelectionModal } from "@/components/DailyPracticeSelectionModal";
import { ProgressBar } from "@/components/ProgressBar";
import { WeakAreasCard } from "@/components/WeakAreasCard";
import { WeeklyStreak } from "@/components/WeeklyStreak";
import Colors from "@/constants/colors";
import { homeCardShadow } from "@/constants/homeCardShadow";
import { ROUTE_ONBOARDING, ROUTE_PRACTICE } from "@/constants/routes";
import { useLearnHomeEntitlements } from "@/hooks/useLearnHomeEntitlements";
import { useAnalyticsStore } from "@/store/analyticsStore";
import { useDailyPracticeStore } from "@/store/dailyPracticeStore";
import { useLevelStatsStore } from "@/store/levelStatsStore";
import { computeDailyStreak } from "@/utils/dateUtils";
import { LevelManager } from "@/utils/LevelManager";
import { LEVEL_CONFIGS } from "@/utils/ProblemGenerator";
import { AppStorage } from "@/utils/storage";
import { hasTheory } from "@/utils/TheoryContent";

const C = Colors.light;
const ONBOARDING_KEY = "math_tutor_onboarding_v1";

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

  const {
    isPremium,
    freeDailyPlayLocked,
    openDailyPractice,
    openWeakAreas,
    openSubscriptionUpsell,
  } = useLearnHomeEntitlements();

  const trackProductEvent = useAnalyticsStore((s) => s.trackProductEvent);

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
        {/* 2. Daily Practice Card — hero element */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <DailyPracticeCard
            onSetup={() => setShowDailyModal(true)}
            onStart={() => void openDailyPractice()}
            freeDailyPlayLocked={freeDailyPlayLocked}
          />
        </Animated.View>

        {/* 3. Stats + Subscription badge — single responsive row */}
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
          {isPremium ? (
            <View style={styles.subBadge}>
              <MaterialCommunityIcons name="crown" size={16} color={C.warning} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.subBadge}
              onPress={() => {
                trackProductEvent({
                  event: "subscription_upsell_tapped",
                  properties: { source: "home_badge" },
                });
                void openSubscriptionUpsell();
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Subscription: Free. Tap to upgrade."
            >
              <Ionicons name="diamond-outline" size={14} color={C.primary} />
              <Text style={styles.subBadgeText}>Free</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* 5. Secondary practice cards — full-width, stacked */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.secondaryStack}>
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
              router.push(`${ROUTE_PRACTICE}?action=start` as Href);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.compactIcon}>
              <Ionicons name="play" size={20} color={C.white} />
            </View>
            <View style={styles.compactTextBlock}>
              <Text style={styles.compactTitle}>Continue practice</Text>
              <Text style={styles.compactSubtitle}>Level {currentLevel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.onColorWhite75} />
          </TouchableOpacity>

          <WeakAreasCard isPremium={isPremium} onPress={() => void openWeakAreas()} />
        </Animated.View>

        {/* Level roadmap */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose your level</Text>
          <Text style={styles.sectionSubtitle}>Level 1 – Whole positive numbers</Text>
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
          void openDailyPractice();
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

  // Subscription badge (now inline in stats row)
  subBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
    ...homeCardShadow.surface,
  },
  subBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.primary,
  },

  // Stats + badge row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    ...homeCardShadow.surface,
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

  // Secondary practice cards — full width, one per row
  secondaryStack: {
    flexDirection: "column",
    gap: 12,
    alignSelf: "stretch",
  },
  compactCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...homeCardShadow.raised,
    gap: 14,
  },
  compactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.onColorWhite20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  compactTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  compactTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 17,
    lineHeight: 22,
    color: C.white,
    letterSpacing: -0.4,
  },
  compactSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 17,
    color: C.onColorWhite88,
    letterSpacing: -0.2,
  },

  // Section header
  sectionHeader: { marginTop: 10, marginBottom: 4, gap: 2 },
  sectionTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
    color: C.text,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.textMuted,
    letterSpacing: -0.1,
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
    ...homeCardShadow.surface,
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
