import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.light;

interface WeeklyStreakProps {
  activeDays: string[]; // ISO date strings
  currentStreak: number;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function WeeklyStreak({ activeDays, currentStreak }: WeeklyStreakProps) {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday

  // Get the start of the current week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const days = WEEKDAYS.map((label, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    const dateString = date.toISOString().split("T")[0];
    const isActive = activeDays.includes(dateString);
    const isToday = index === currentDayOfWeek;

    return {
      label,
      isActive,
      isToday,
      dateString,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.daysRow}>
        {days.map((day) => (
          <View key={day.dateString} style={styles.dayContainer}>
            <View
              style={[
                styles.dayCircle,
                day.isActive && styles.activeCircle,
                day.isToday && !day.isActive && styles.todayCircle,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  day.isActive && styles.activeLabel,
                  day.isToday && !day.isActive && styles.todayLabel,
                ]}
              >
                {day.label}
              </Text>
              {day.isActive && (
                <View style={styles.checkIcon}>
                  <MaterialCommunityIcons name="check" size={8} color={C.white} />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.streakInfo}>
        <MaterialCommunityIcons name="fire" size={20} color={C.orange} />
        <Text style={styles.streakText}>{currentStreak}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  daysRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayContainer: {
    alignItems: "center",
    gap: 4,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeCircle: {
    backgroundColor: C.primary,
  },
  todayCircle: {
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: C.white,
  },
  dayLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: C.textSecondary,
  },
  activeLabel: {
    color: C.white,
  },
  todayLabel: {
    color: C.primary,
  },
  checkIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: C.accent,
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.white,
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  streakText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 18,
    color: C.text,
  },
});
