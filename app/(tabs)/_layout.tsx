import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "pencil.and.ruler", selected: "pencil.and.ruler.fill" }} />
        <Label>Learn</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="practice">
        <Icon sf={{ default: "brain.head.profile", selected: "brain.head.profile.fill" }} />
        <Label>Practice</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <Icon sf={{ default: "chart.bar.fill", selected: "chart.bar.fill" }} />
        <Label>Progress</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const C = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#FFFFFF",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: "#E2E8F0",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF" }]}
            />
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
              <SymbolView name="brain.head.profile" tintColor={color} size={24} />
            ) : (
              <Ionicons name="school" size={22} color={color} />
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

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
