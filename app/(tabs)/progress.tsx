import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, G } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

import Colors from "@/constants/colors";
import { LevelManager, type LevelState } from "@/utils/LevelManager";
import { LEVEL_CONFIGS } from "@/utils/ProblemGenerator";

const C = Colors.light;

const LEVEL_COLORS: Record<string, string> = C.levels;

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
    <View style={progressBarStyles.track}>
      <Animated.View style={[progressBarStyles.fill, barStyle, { backgroundColor: color }]} />
    </View>
  );
}
const progressBarStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
    flex: 1,
  },
  fill: { height: "100%", borderRadius: 4 },
});

function AccuracyGauge({ accuracy }: { accuracy: number }) {
  const radius = 90;
  const strokeWidth = 24;
  const width = radius * 2 + strokeWidth * 2;
  const height = radius + strokeWidth + 10;
  const circumference = Math.PI * radius;
  
  // Use a shared value for animation
  const progress = useSharedValue(0);
  
  useEffect(() => {
    progress.value = withDelay(500, withTiming(accuracy / 100, { 
      duration: 1500, 
      easing: Easing.out(Easing.cubic) 
    }));
  }, [accuracy, progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - progress.value * circumference;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={gaugeStyles.container}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <G rotation="0" origin={`${width / 2}, ${radius + strokeWidth}`}>
            {/* Background Arc */}
            <Path
              d={`M ${strokeWidth},${radius + strokeWidth} A ${radius},${radius} 0 0 1 ${width - strokeWidth},${radius + strokeWidth}`}
              fill="none"
              stroke={C.borderLight}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Foreground Arc */}
            <AnimatedPath
              d={`M ${strokeWidth},${radius + strokeWidth} A ${radius},${radius} 0 0 1 ${width - strokeWidth},${radius + strokeWidth}`}
              fill="none"
              stroke={accuracy > 80 ? C.success : accuracy > 50 ? C.warning : C.error}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              animatedProps={animatedProps}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View
          style={{
            position: "absolute",
            bottom: -8,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_800ExtraBold",
              fontSize: 48,
              color: C.text,
              lineHeight: 56, // Prevents clipping and ensures precise height
            }}
          >
            {accuracy}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 32,
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 16,
  },
});

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<LevelState | null>(null);
  const [manager, setManager] = useState<LevelManager | null>(null);

  useEffect(() => {
    LevelManager.load().then((mgr) => {
      setManager(mgr);
      setState(mgr.getState());
    });
  }, []);

  // Refresh periodically
  useEffect(() => {
    const interval = setInterval(() => {
      LevelManager.load().then((mgr) => {
        setManager(mgr);
        setState(mgr.getState());
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    Alert.alert(
      "Reset All Progress",
      "This will delete all your progress and start fresh. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            if (manager) {
              await manager.reset();
              setState(manager.getState());
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ],
    );
  };

  const webTopPadding = Platform.OS === "web" ? 67 : 0;
  const totalSolved = state?.totalSolved || 0;
  const totalErrors = state?.totalErrors || 0;
  const completedCount = state?.completedLevels.length || 0;
  const accuracy =
    totalSolved + totalErrors > 0
      ? Math.round((totalSolved / (totalSolved + totalErrors)) * 100)
      : 0;

  return (
    <View
      style={[styles.container, { paddingTop: Platform.OS === "web" ? webTopPadding : insets.top }]}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBadge}>
            <Ionicons name="bar-chart" size={16} color={C.primary} />
          </View>
          <Text style={styles.headerTitle}>My Progress</Text>
        </View>
        <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
          <View style={styles.resetBtn}>
            <Ionicons name="refresh" size={14} color={C.errorDark} />
            <Text style={styles.resetBtnText}>Reset</Text>
          </View>
        </TouchableOpacity>
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
        {/* Accuracy Gauge Replacements Robot Greeting */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <AccuracyGauge accuracy={accuracy} />
        </Animated.View>

        {/* Stats grid */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Statistics</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsGrid}>
          {[
            {
              icon: <Ionicons name="checkmark-circle" size={20} color={C.white} />,
              label: "Problems Solved",
              value: `${totalSolved}`,
              sub: "Total correct",
              color: C.success,
            },
            {
              icon: <Ionicons name="close-circle" size={20} color={C.white} />,
              label: "Errors Made",
              value: `${totalErrors}`,
              sub: "Total mistakes",
              color: C.error,
            },
          ].map((stat, index) => (
            <View
              key={index}
              style={[styles.statCard, { backgroundColor: stat.color }]}
            >
              <Text style={[styles.statValue, { color: C.white, fontSize: 44, lineHeight: 52, textAlign: "center" }]}>
                {stat.value}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
                {stat.icon}
                <Text style={[styles.statLabel, { color: C.white, textAlign: "center" }]}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Per-level progress */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Level Progress</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.topicCard}>
          {LEVEL_CONFIGS.map((config, index) => {
            const color = LEVEL_COLORS[config.id] || C.primary;
            const stats = state?.levelStats[config.id];
            const solved = stats?.solved || 0;
            const errors = stats?.errors || 0;
            const bestStr = stats?.bestStreak || 0;
            const completed = state?.completedLevels.includes(config.id) || false;
            const total = solved + errors;
            const levelAccuracy = total > 0 ? Math.round((solved / total) * 100) : 0;

            return (
              <View
                key={config.id}
                style={[styles.topicRow, index < LEVEL_CONFIGS.length - 1 && styles.topicRowBorder]}
              >
                <View style={styles.topicInfo}>
                  <View
                    style={[
                      styles.topicDot,
                      {
                        backgroundColor: completed ? color : C.border,
                      },
                    ]}
                  >
                    {completed && <Ionicons name="checkmark" size={8} color={C.white} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topicName}>
                      {config.id} — {config.name}
                    </Text>
                    <View style={styles.topicMetaRow}>
                      <Text style={styles.topicMeta}>
                        {solved} ✓ · {errors} ✗{bestStr > 0 ? ` · 🔥${bestStr}` : ""}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.topicRight}>
                  <ProgressBar
                    progress={
                      completed ? 100 : Math.min(100, (bestStr / config.requiredStreak) * 100)
                    }
                    color={color}
                    delay={400 + index * 80}
                  />
                  <Text style={[styles.topicScore, { color }]}>
                    {total > 0 ? `${levelAccuracy}%` : "—"}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSub}>
            {
              [
                totalSolved >= 1,
                totalSolved >= 10,
                totalSolved >= 50,
                completedCount >= 1,
                completedCount >= 3,
                completedCount >= 6,
              ].filter(Boolean).length
            }
            /6 earned
          </Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.achievementsGrid}
        >
          {[
            {
              id: "a1",
              title: "First Steps",
              description: "Solve your first problem",
              icon: <Ionicons name="star" size={24} color={C.white} />,
              earned: totalSolved >= 1,
              color: C.orange,
            },
            {
              id: "a2",
              title: "Getting Good",
              description: "Solve 10 problems",
              icon: <Ionicons name="ribbon" size={24} color={C.white} />,
              earned: totalSolved >= 10,
              color: C.levels["1.4"],
            },
            {
              id: "a3",
              title: "Math Whiz",
              description: "Solve 50 problems",
              icon: <Ionicons name="flash" size={24} color={C.white} />,
              earned: totalSolved >= 50,
              color: C.levels["1.6"],
            },
            {
              id: "a4",
              title: "Level Up!",
              description: "Complete your first level",
              icon: <Ionicons name="trophy" size={24} color={C.white} />,
              earned: completedCount >= 1,
              color: C.accent,
            },
            {
              id: "a5",
              title: "Halfway There",
              description: "Complete 3 levels",
              icon: <MaterialCommunityIcons name="fire" size={24} color={C.white} />,
              earned: completedCount >= 3,
              color: C.orange,
            },
            {
              id: "a6",
              title: "Math Master",
              description: "Complete all 6 levels",
              icon: <Ionicons name="medal" size={24} color={C.white} />,
              earned: completedCount >= 6,
              color: C.levels["1.5"],
            },
          ].map((badge) => (
            <View
              key={badge.id}
              style={[styles.achievementCard, !badge.earned && styles.achievementCardLocked]}
            >
              <View
                style={[
                  styles.achievementBadge,
                  {
                    backgroundColor: badge.earned ? badge.color : C.border,
                  },
                ]}
              >
                {badge.earned ? (
                  badge.icon
                ) : (
                  <Ionicons name="lock-closed" size={20} color={C.textMuted} />
                )}
              </View>
              <Text
                style={[styles.achievementTitle, !badge.earned && styles.achievementTitleLocked]}
                numberOfLines={1}
              >
                {badge.title}
              </Text>
              <Text style={styles.achievementDesc} numberOfLines={2}>
                {badge.description}
              </Text>
            </View>
          ))}
        </Animated.View>
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
    fontSize: 18,
    color: C.text,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.errorLighter,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.errorLight,
  },
  resetBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.errorDark,
  },
  scrollContent: { padding: 16, gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: C.text,
  },
  sectionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textMuted,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    flex: 1,
    minWidth: "44%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.text,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.text,
  },
  statSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textMuted,
  },
  topicCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    gap: 0,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  topicRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  topicInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  topicDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  topicName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.text,
  },
  topicMetaRow: {
    flexDirection: "row",
    gap: 6,
  },
  topicMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textMuted,
  },
  topicRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 120,
  },
  topicScore: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    width: 38,
    textAlign: "right",
  },
  achievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achievementCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    flex: 1,
    minWidth: "28%",
    alignItems: "center",
    gap: 6,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  achievementCardLocked: { opacity: 0.55 },
  achievementBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.text,
    textAlign: "center",
  },
  achievementTitleLocked: { color: C.textMuted },
  achievementDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
});
