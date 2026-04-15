import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Colors from "@/constants/colors";
import { useDailyPracticeStore } from "@/store/dailyPracticeStore";
import { computeTaskCount } from "@/utils/dailyPracticeGenerator";

const C = Colors.light;
const CARD_COLOR = C.orange;

const LEVEL_ICON_SIZE = 18;
const LEVEL_BTN_SIZE = 36;

interface DailyPracticeCardProps {
  onSetup: () => void;
  onStart: () => void;
  /** Free tier at daily limit: show lock instead of play on the start control. */
  freeDailyPlayLocked?: boolean;
}

function LevelPickerButton({ onPress }: { onPress: () => void }) {
  return (
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
  );
}

export function DailyPracticeCard({
  onSetup,
  onStart,
  freeDailyPlayLocked = false,
}: DailyPracticeCardProps) {
  const hasConfigured = useDailyPracticeStore((s) => s.hasConfigured);
  const selectedLevels = useDailyPracticeStore((s) => s.selectedLevels);

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
          <LevelPickerButton onPress={onSetup} />
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
        <LevelPickerButton
          onPress={() => {
            // No need for stopPropagation as RN Touchables handle nesting by default,
            // but we call onSetup to open the modal.
            onSetup();
          }}
        />
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
    backgroundColor: C.onColorWhite20,
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
    color: C.onColorWhite90,
  },
  /** Unconfigured daily card — smaller hint naming the layers control */
  subSmall: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.15,
    color: C.onColorWhite82,
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
    backgroundColor: C.onColorWhite15,
    alignItems: "center",
    justifyContent: "center",
  },
  levelPickerBtn: {
    width: LEVEL_BTN_SIZE,
    height: LEVEL_BTN_SIZE,
    borderRadius: LEVEL_BTN_SIZE / 2,
    backgroundColor: C.onColorWhite20,
    alignItems: "center",
    justifyContent: "center",
  },
});
