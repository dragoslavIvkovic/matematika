import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Colors from "@/constants/colors";
import { useErrorStore } from "@/store/errorStore";

const C = Colors.light;
const CARD_COLOR = C.error;

interface WeakAreasCardProps {
  /** When false, card shows premium lock styling; onPress should open paywall. */
  isPremium: boolean;
  onPress: () => void;
}

export function WeakAreasCard({ isPremium, onPress }: WeakAreasCardProps) {
  // Subscribe to derived values, not stable function refs — otherwise the card
  // never re-renders when errors are recorded until a full remount (e.g. app restart).
  const hasAnyErrors = useErrorStore((s) => s.hasErrors());
  const weakCount = useErrorStore((s) => s.getWeakLevels().length);
  const totalErr = useErrorStore((s) => s.getTotalErrors());

  if (!hasAnyErrors) return null;

  const locked = !isPremium;

  return (
    <TouchableOpacity
      style={[s.card, locked && s.cardLocked]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={locked ? "Tap to unlock." : "Weak areas. Tap to practice."}
    >
      <View style={s.iconWrap}>
        <View style={[s.iconCircle, locked && s.iconCircleLocked]}>
          <MaterialCommunityIcons name="history" size={20} color={C.white} />
        </View>
        {locked && (
          <View style={s.lockCorner}>
            <Ionicons name="lock-closed" size={11} color={C.warningDark} />
          </View>
        )}
      </View>
      <View style={s.textBlock}>
        <View style={s.titleRow}>
          <Text style={[s.title, locked && s.titleLocked]}>Weak areas</Text>
          {locked && (
            <View style={s.proPill}>
              <MaterialCommunityIcons name="crown" size={11} color={C.warningDark} />
              <Text style={s.proPillText}>Premium</Text>
            </View>
          )}
        </View>
        <Text style={[s.sub, locked && s.subLocked]} numberOfLines={2}>
          {locked
            ? `Premium — ${totalErr} mistake${totalErr !== 1 ? "s" : ""} saved · tap to unlock`
            : `${totalErr} error${totalErr !== 1 ? "s" : ""} · ${weakCount} level${
                weakCount !== 1 ? "s" : ""
              }`}
        </Text>
      </View>
      {locked ? (
        <View style={s.lockOrb}>
          <Ionicons name="lock-closed" size={20} color={C.warningDark} />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.75)" />
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: CARD_COLOR,
    borderWidth: 2,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: CARD_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {
        shadowColor: CARD_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
    gap: 14,
  },
  cardLocked: {
    borderColor: `${C.warning}99`,
    backgroundColor: "#B91C1C",
    shadowColor: C.warning,
    shadowOpacity: 0.28,
  },
  iconWrap: {
    position: "relative",
    flexShrink: 0,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleLocked: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  lockCorner: {
    position: "absolute",
    right: -4,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.warningLight,
    borderWidth: 2,
    borderColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: C.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      },
      default: { elevation: 2 },
    }),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  proPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  proPillText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 10,
    color: C.warningDark,
    letterSpacing: 0.3,
  },
  lockOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.warningLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.white,
    ...Platform.select({
      ios: {
        shadowColor: C.warning,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      default: { elevation: 4 },
    }),
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 17,
    lineHeight: 22,
    color: C.white,
    letterSpacing: -0.4,
  },
  titleLocked: {
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sub: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 17,
    color: "rgba(255, 255, 255, 0.88)",
    letterSpacing: -0.2,
  },
  subLocked: {
    color: "rgba(255, 255, 255, 0.92)",
  },
});
