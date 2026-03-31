import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.light;

interface SpeechBubbleProps {
  title: string;
  message: string;
  rule?: string;
}

export function SpeechBubble({ title, message, rule }: SpeechBubbleProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bubble}>
        <View style={styles.ruleBadge}>
          <Text style={styles.ruleEmoji}></Text>
          <Text style={styles.ruleLabel}>{title}</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
        {rule && (
          <View style={styles.ruleBox}>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        )}
      </View>
      {/* Pointer triangle */}
      <View style={styles.triangleContainer}>
        <View style={styles.triangleOuter} />
        <View style={styles.triangleInner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  bubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: C.primaryLight,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    gap: 8,
    width: "100%",
  },
  ruleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  ruleEmoji: {
    fontSize: 12,
  },
  ruleLabel: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  message: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  ruleBox: {
    backgroundColor: C.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  ruleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.primaryDark,
    lineHeight: 18,
  },
  triangleContainer: {
    alignItems: "center",
    height: 14,
  },
  triangleOuter: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: C.primaryLight,
    marginTop: 0,
  },
  triangleInner: {
    position: "absolute",
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
});
