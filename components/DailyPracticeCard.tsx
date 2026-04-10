import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useDailyPracticeStore } from "@/store/dailyPracticeStore";
import { computeTaskCount } from "@/utils/dailyPracticeGenerator";

const C = Colors.light;
const CARD_COLOR = C.orange;

const LEVEL_ICON_SIZE = 18;
const LEVEL_BTN_SIZE = 36;

/** Tooltip when user still needs to pick levels — first nudge after delay, then repeats. */
const TOOLTIP_FIRST_MS = 2600;
const TOOLTIP_VISIBLE_MS = 4000;
const TOOLTIP_REPEAT_MS = 52000;

function usePeriodicLevelHint(active: boolean) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    let cancelled = false;
    let hideId: ReturnType<typeof setTimeout>;
    let nextId: ReturnType<typeof setTimeout>;

    const cycle = () => {
      if (cancelled) return;
      setVisible(true);
      hideId = setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, TOOLTIP_VISIBLE_MS);
      nextId = setTimeout(cycle, TOOLTIP_REPEAT_MS);
    };

    nextId = setTimeout(cycle, TOOLTIP_FIRST_MS);
    return () => {
      cancelled = true;
      clearTimeout(hideId);
      clearTimeout(nextId);
    };
  }, [active]);

  return visible;
}

interface DailyPracticeCardProps {
  onSetup: () => void;
  onStart: () => void;
  /** Free tier at daily limit: show lock instead of play on the start control. */
  freeDailyPlayLocked?: boolean;
}

function LevelPickerButton({
  onPress,
  showTooltip,
}: {
  onPress: () => void;
  showTooltip: boolean;
}) {
  return (
    <View style={s.levelPickerWrap}>
      {showTooltip && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={s.tooltip}
          pointerEvents="none"
        >
          <Text style={s.tooltipText}>Choose a level</Text>
        </Animated.View>
      )}
      <TouchableOpacity
        style={s.levelPickerBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Layers: choose practice areas"
      >
        <Ionicons name="layers-outline" size={LEVEL_ICON_SIZE} color={C.white} />
      </TouchableOpacity>
    </View>
  );
}

export function DailyPracticeCard({
  onSetup,
  onStart,
  freeDailyPlayLocked = false,
}: DailyPracticeCardProps) {
  const hasConfigured = useDailyPracticeStore((s) => s.hasConfigured);
  const selectedLevels = useDailyPracticeStore((s) => s.selectedLevels);

  const needsLevelHint = !hasConfigured || selectedLevels.length === 0;
  const showHintBubble = usePeriodicLevelHint(needsLevelHint);

  if (!hasConfigured) {
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSetup();
        }}
        activeOpacity={0.9}
      >
        <View style={s.iconBox}>
          <Ionicons name="calendar" size={40} color={C.white} />
        </View>
        <View style={s.textBlock}>
          <Text style={s.title}>Daily Practice</Text>
          <Text style={s.subSmall}>Tap the layers icon to choose areas</Text>
        </View>
        <View style={s.rightGroup}>
          <LevelPickerButton onPress={onSetup} showTooltip={showHintBubble && needsLevelHint} />
          <View style={s.arrow}>
            <Ionicons name="arrow-forward" size={28} color={C.white} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const taskCount = computeTaskCount(selectedLevels.length);

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onStart();
      }}
      activeOpacity={0.9}
    >
      <View style={s.iconBox}>
        <Ionicons name="calendar" size={40} color={C.white} />
      </View>
      <View style={s.textBlock}>
        <Text style={s.title}>Daily Practice</Text>
        <Text style={s.sub}>
          {selectedLevels.length} area{selectedLevels.length > 1 ? "s" : ""} · {taskCount} tasks
        </Text>
      </View>
      <View style={s.rightGroup}>
        <LevelPickerButton onPress={onSetup} showTooltip={showHintBubble && needsLevelHint} />
        <View style={s.arrow}>
          <Ionicons name={freeDailyPlayLocked ? "lock-closed" : "play"} size={28} color={C.white} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 28,
    padding: 28,
    backgroundColor: CARD_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: CARD_COLOR,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      default: {
        shadowColor: CARD_COLOR,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  textBlock: {
    gap: 4,
    flex: 1,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 24,
    color: C.white,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  /** Unconfigured daily card — smaller hint naming the layers control */
  subSmall: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.15,
    color: "rgba(255, 255, 255, 0.82)",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  levelPickerWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    position: "absolute",
    right: 0,
    bottom: "100%",
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    maxWidth: 200,
    zIndex: 10,
  },
  tooltipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#fff",
    letterSpacing: -0.2,
  },
  levelPickerBtn: {
    width: LEVEL_BTN_SIZE,
    height: LEVEL_BTN_SIZE,
    borderRadius: LEVEL_BTN_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
