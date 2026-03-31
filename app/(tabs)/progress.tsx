import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

import Colors from "@/constants/colors";
import { RobotMascot } from "@/components/RobotMascot";

const C = Colors.light;

interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}

interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  color: string;
}

interface TopicProgress {
  id: string;
  topic: string;
  progress: number;
  score: number;
  color: string;
}

function ProgressBar({ progress, color, delay = 0 }: { progress: number; color: string; delay?: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [progress, delay]);

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
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    flex: 1,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();

  const stats: StatCard[] = [
    {
      icon: <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />,
      label: "Problems Solved",
      value: "24",
      sub: "+3 today",
      color: C.accent,
    },
    {
      icon: <MaterialCommunityIcons name="fire" size={22} color="#FFFFFF" />,
      label: "Day Streak",
      value: "5",
      sub: "Keep it up!",
      color: C.orange,
    },
    {
      icon: <Ionicons name="trophy" size={22} color="#FFFFFF" />,
      label: "Best Score",
      value: "95%",
      sub: "Algebra Quiz",
      color: "#8B5CF6",
    },
    {
      icon: <Ionicons name="time" size={22} color="#FFFFFF" />,
      label: "Study Time",
      value: "2h",
      sub: "This week",
      color: C.primary,
    },
  ];

  const topicProgress: TopicProgress[] = [
    { id: "t1", topic: "Flip the Sign", progress: 85, score: 92, color: C.primary },
    { id: "t2", topic: "Solving for x", progress: 70, score: 78, color: C.accent },
    { id: "t3", topic: "Inequalities", progress: 40, score: 65, color: C.orange },
    { id: "t4", topic: "Fractions", progress: 15, score: 50, color: "#8B5CF6" },
  ];

  const achievements: AchievementBadge[] = [
    {
      id: "a1",
      title: "First Steps",
      description: "Complete your first lesson",
      icon: <Ionicons name="star" size={24} color="#FFFFFF" />,
      earned: true,
      color: C.orange,
    },
    {
      id: "a2",
      title: "Perfect Quiz",
      description: "Score 100% on a practice set",
      icon: <Ionicons name="trophy" size={24} color="#FFFFFF" />,
      earned: true,
      color: "#8B5CF6",
    },
    {
      id: "a3",
      title: "5-Day Streak",
      description: "Study 5 days in a row",
      icon: <MaterialCommunityIcons name="fire" size={24} color="#FFFFFF" />,
      earned: true,
      color: C.orange,
    },
    {
      id: "a4",
      title: "Algebra Master",
      description: "Complete all algebra topics",
      icon: <MaterialCommunityIcons name="calculator-variant" size={24} color="#FFFFFF" />,
      earned: false,
      color: C.primary,
    },
    {
      id: "a5",
      title: "Speed Solver",
      description: "Solve 10 problems in under 5 min",
      icon: <Ionicons name="flash" size={24} color="#FFFFFF" />,
      earned: false,
      color: "#06B6D4",
    },
    {
      id: "a6",
      title: "Month Champion",
      description: "30-day study streak",
      icon: <Ionicons name="medal" size={24} color="#FFFFFF" />,
      earned: false,
      color: "#EC4899",
    },
  ];

  const webTopPadding = Platform.OS === "web" ? 67 : 0;

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
            <Ionicons name="bar-chart" size={16} color={C.primary} />
          </View>
          <Text style={styles.headerTitle}>My Progress</Text>
        </View>
        <View style={styles.levelBadge}>
          <Feather name="award" size={14} color={C.orange} />
          <Text style={styles.levelText}>Level 3</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 84 + 16 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Robot greeting */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.robotGreeting}>
          <RobotMascot size={70} />
          <View style={styles.greetingText}>
            <Text style={styles.greetingTitle}>Great Progress!</Text>
            <Text style={styles.greetingMessage}>
              You're doing amazing! Keep up the daily practice to reach Level 4.
            </Text>
            <View style={styles.xpBar}>
              <View style={styles.xpBarFill} />
              <Text style={styles.xpText}>720 / 1000 XP</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats grid */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Statistics</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { borderTopColor: stat.color, borderTopWidth: 3 }]}>
              <View style={[styles.statIconBadge, { backgroundColor: stat.color }]}>
                {stat.icon}
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statSub}>{stat.sub}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Topic Progress */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Topic Progress</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.topicCard}>
          {topicProgress.map((topic, index) => (
            <View key={topic.id} style={[styles.topicRow, index < topicProgress.length - 1 && styles.topicRowBorder]}>
              <View style={styles.topicInfo}>
                <View style={[styles.topicColorDot, { backgroundColor: topic.color }]} />
                <Text style={styles.topicName}>{topic.topic}</Text>
              </View>
              <View style={styles.topicRight}>
                <ProgressBar progress={topic.progress} color={topic.color} delay={400 + index * 100} />
                <Text style={[styles.topicScore, { color: topic.color }]}>{topic.score}%</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSub}>3/6 earned</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.achievementsGrid}>
          {achievements.map((badge) => (
            <View
              key={badge.id}
              style={[
                styles.achievementCard,
                !badge.earned && styles.achievementCardLocked,
              ]}
            >
              <View
                style={[
                  styles.achievementBadge,
                  { backgroundColor: badge.earned ? badge.color : "#E2E8F0" },
                ]}
              >
                {badge.earned ? badge.icon : <Ionicons name="lock-closed" size={20} color="#94A3B8" />}
              </View>
              <Text
                style={[
                  styles.achievementTitle,
                  !badge.earned && styles.achievementTitleLocked,
                ]}
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
    fontSize: 18,
    color: C.text,
  },
  levelBadge: {
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
  levelText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#92400E",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  robotGreeting: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  greetingText: {
    flex: 1,
    gap: 4,
  },
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
  xpBar: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
  },
  xpBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "72%",
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  xpText: {
    position: "absolute",
    right: 0,
    top: -16,
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: C.textMuted,
  },
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flex: 1,
    minWidth: "44%",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 0,
    shadowColor: "#000",
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
    width: 130,
  },
  topicColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  topicName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.text,
    flexShrink: 1,
  },
  topicRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topicScore: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    width: 38,
    textAlign: "right",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  achievementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flex: 1,
    minWidth: "28%",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  achievementCardLocked: {
    opacity: 0.55,
  },
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
  achievementTitleLocked: {
    color: C.textMuted,
  },
  achievementDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
});
