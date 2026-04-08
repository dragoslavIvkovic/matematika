import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Colors from "@/constants/colors";
import { useErrorStore } from "@/store/errorStore";

const C = Colors.light;
const CARD_COLOR = C.error;

interface WeakAreasCardProps {
  onStart: () => void;
}

export function WeakAreasCard({ onStart }: WeakAreasCardProps) {
  const hasErrors = useErrorStore((s) => s.hasErrors);
  const getWeakLevels = useErrorStore((s) => s.getWeakLevels);
  const totalErrors = useErrorStore((s) => s.getTotalErrors);

  if (!hasErrors()) return null;

  const weakCount = getWeakLevels().length;

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onStart();
      }}
      activeOpacity={0.9}
    >
      <View style={s.iconCircle}>
        <Ionicons name="fitness" size={18} color={C.white} />
      </View>
      <View style={s.textBlock}>
        <Text style={s.title} numberOfLines={1}>
          Weak Areas
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {totalErrors()} err · {weakCount} lvl{weakCount !== 1 ? "s" : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: CARD_COLOR,
    shadowColor: CARD_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.white,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
  },
});
