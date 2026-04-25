import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

import { Platform, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { getDefaultClassicTabBarStyle } from "@/constants/tabBarStyle";

function TabLayoutContent() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const C = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        headerShown: false,
        tabBarStyle: getDefaultClassicTabBarStyle(),
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: C.white }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="pencil.and.ruler" tintColor={color} size={24} />
            ) : (
              <MaterialCommunityIcons name="pencil-ruler" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="chart.bar.fill" tintColor={color} size={24} />
            ) : (
              <Ionicons name="bar-chart" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

/**
 * Uvek korišćenje React Navigation `Tabs` (ne iOS `NativeTabs`).
 * Ispod prilagođene MathKeyboard, Native tabs ne izlažu visinu u kontekst i
 * lebde iznad sadržaja — preklapanje. Ovde se dobija ispravno `useBottomTabBarHeight`.
 */
export default function TabLayout() {
  return <TabLayoutContent />;
}
