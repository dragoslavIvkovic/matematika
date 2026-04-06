import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { LEVEL_CONFIGS, type LevelId } from "@/utils/ProblemGenerator";

const C = Colors.light;

const LEVEL_ICONS: Record<string, { name: string; lib: "ion" | "mci" | "feather" }> = {
  "1.1": { name: "add", lib: "ion" },
  "1.2": { name: "close", lib: "ion" },
  "1.3": { name: "swap-horizontal", lib: "ion" },
  "1.4": { name: "git-branch", lib: "ion" },
  "1.5": { name: "calculator-variant", lib: "mci" },
  "1.6": { name: "divide", lib: "feather" },
};

const LEVEL_COLORS = C.levels;

interface LevelSelectorProps {
  completedLevels: string[];
  currentLevel: string;
  onSelectLevel: (level: LevelId) => void;
  onStartAssessment: () => void;
  levelStats: Record<string, { solved: number; errors: number; bestStreak: number }>;
}

export function LevelSelector({
  completedLevels,
  currentLevel,
  onSelectLevel,
  onStartAssessment,
  levelStats,
}: LevelSelectorProps) {
  const isUnlocked = (_levelId: string): boolean => {
    return true;
  };

  const renderIcon = (levelId: string, color: string, size: number) => {
    const cfg = LEVEL_ICONS[levelId];
    if (!cfg) return null;
    if (cfg.lib === "ion") return <Ionicons name={cfg.name as any} size={size} color={color} />;
    if (cfg.lib === "mci")
      return <MaterialCommunityIcons name={cfg.name as any} size={size} color={color} />;
    if (cfg.lib === "feather") return <Feather name={cfg.name as any} size={size} color={color} />;
    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Level</Text>
        <Text style={styles.headerSub}>
          Select a level to practice, or take the assessment test
        </Text>
      </Animated.View>

      {/* Assessment card */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <TouchableOpacity
          style={styles.assessmentCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStartAssessment();
          }}
          activeOpacity={0.9}
        >
          <View style={styles.assessmentIcon}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={28} color={C.white} />
          </View>
          <View style={styles.assessmentText}>
            <Text style={styles.assessmentTitle}>Assessment Test</Text>
            <Text style={styles.assessmentSub}>Find out your starting level automatically</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={C.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR PICK A LEVEL</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Level cards */}
      {LEVEL_CONFIGS.map((config, index) => {
        const unlocked = isUnlocked(config.id);
        const completed = completedLevels.includes(config.id);
        const isCurrent = config.id === currentLevel;
        const color = LEVEL_COLORS[config.id] || C.primary;
        const stats = levelStats[config.id];

        return (
          <Animated.View
            key={config.id}
            entering={FadeInDown.delay(150 + index * 60).duration(400)}
          >
            <TouchableOpacity
              style={[
                styles.levelCard,
                !unlocked && styles.levelCardLocked,
                isCurrent && { borderColor: color, borderWidth: 2 },
              ]}
              onPress={() => {
                if (unlocked) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectLevel(config.id);
                } else {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }
              }}
              activeOpacity={unlocked ? 0.8 : 1}
            >
              <View style={styles.levelCardLeft}>
                <View
                  style={[styles.levelIconWrap, { backgroundColor: unlocked ? color : C.border }]}
                >
                  {unlocked ? (
                    renderIcon(config.id, C.white, 22)
                  ) : (
                    <Ionicons name="lock-closed" size={18} color={C.textMuted} />
                  )}
                </View>
                <View style={styles.levelInfo}>
                  <View style={styles.levelTitleRow}>
                    <Text style={[styles.levelNumber, !unlocked && styles.textLocked]}>
                      {config.id}
                    </Text>
                    {completed && (
                      <View style={styles.completeBadge}>
                        <Ionicons name="checkmark" size={10} color={C.white} />
                      </View>
                    )}
                    {isCurrent && !completed && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.levelName, !unlocked && styles.textLocked]}>
                    {config.name}
                  </Text>
                  <Text style={styles.levelDesc}>{config.description}</Text>
                </View>
              </View>
              <View style={styles.levelCardRight}>
                {stats && (
                  <View style={styles.miniStats}>
                    <Text style={styles.miniStatText}>{stats.solved} ✓</Text>
                    {stats.bestStreak > 0 && (
                      <Text style={styles.miniStatText}>🔥{stats.bestStreak}</Text>
                    )}
                  </View>
                )}
                <View style={styles.streakReq}>
                  <Text style={styles.streakReqText}>{config.requiredStreak} in a row</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  header: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: C.text,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
  },
  assessmentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.backgroundAlt,
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
  assessmentIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  assessmentText: {
    flex: 1,
    gap: 2,
  },
  assessmentTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.text,
  },
  assessmentSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textSecondary,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 1,
  },
  levelCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.transparent,
  },
  levelCardLocked: {
    opacity: 0.5,
  },
  levelCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  levelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  levelInfo: {
    flex: 1,
    gap: 2,
  },
  levelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  levelNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.textSecondary,
  },
  levelName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: C.text,
  },
  levelDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 16,
  },
  textLocked: {
    color: C.textMuted,
  },
  completeBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  currentBadge: {
    backgroundColor: C.warningLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.warningBorder,
  },
  currentBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: C.warning,
    letterSpacing: 0.5,
  },
  levelCardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  miniStats: {
    flexDirection: "row",
    gap: 6,
  },
  miniStatText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.textMuted,
  },
  streakReq: {
    backgroundColor: C.backgroundAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  streakReqText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: C.textSecondary,
  },
});
