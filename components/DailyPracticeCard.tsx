import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Colors from "@/constants/colors";
import { useDailyPracticeStore } from "@/store/dailyPracticeStore";
import { computeTaskCount } from "@/utils/dailyPracticeGenerator";

const C = Colors.light;
const CARD_COLOR = C.orange;

interface DailyPracticeCardProps {
  onSetup: () => void;
  onStart: () => void;
}

export function DailyPracticeCard({ onSetup, onStart }: DailyPracticeCardProps) {
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
          <Text style={s.sub}>Tap to choose your practice areas</Text>
        </View>
        <View style={s.arrow}>
          <Ionicons name="arrow-forward" size={28} color={C.white} />
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
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSetup();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={s.arrow}>
          <Ionicons name="play" size={28} color={C.white} />
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
    shadowColor: CARD_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
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
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
