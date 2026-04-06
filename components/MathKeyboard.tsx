import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
  FadeIn,
} from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import Colors from "@/constants/colors";

const C = Colors.light;
const { width: SCREEN_W } = Dimensions.get("window");

interface MathKeyboardProps {
  isVisible: boolean;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  onClose: () => void;
  bottomOffset?: number;
}

type KeyboardMode = "math" | "letters";

export function MathKeyboard({
  isVisible,
  onKeyPress,
  onDelete,
  onSubmit,
  onClose,
  bottomOffset = 0,
}: MathKeyboardProps) {
  const [mode, setMode] = useState<KeyboardMode>("math");

  if (!isVisible) return null;

  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "ABC") {
      setMode("letters");
    } else if (key === "123") {
      setMode("math");
    } else if (key === "DEL") {
      onDelete();
    } else if (key === "ENTER") {
      onSubmit();
    } else {
      onKeyPress(key);
    }
  };

  const mathKeys = [
    ["1", "2", "3", "+"],
    ["4", "5", "6", "-"],
    ["7", "8", "9", "×"],
    [".", "0", "=", "÷"],
    ["ABC", "x", "y", "DEL"],
  ];

  const letterKeys = [
    ["a", "b", "c", "d"],
    ["x", "y", "z", "w"],
    ["m", "n", "p", "q"],
    ["123", "(", ")", "DEL"],
  ];

  const keys = mode === "math" ? mathKeys : letterKeys;

  const renderKey = (key: string) => {
    const isAction = ["DEL", "ABC", "123"].includes(key);
    const isOperator = ["+", "-", "×", "÷", "=", "(", ")"].includes(key);
    const isSpecial = ["x", "y"].includes(key);

    let content: React.ReactNode = (
      <Text
        style={[
          styles.keyText,
          isAction && styles.actionKeyText,
          isOperator && styles.operatorKeyText,
        ]}
      >
        {key}
      </Text>
    );

    if (key === "DEL") {
      content = <Ionicons name="backspace-outline" size={24} color={C.text} />;
    }

    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        onPress={() => handlePress(key)}
        style={[
          styles.key,
          isAction && styles.actionKey,
          isOperator && styles.operatorKey,
          isSpecial && styles.specialKey,
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  };

  const KeyboardWrapper = Platform.OS === "ios" ? BlurView : View;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20).stiffness(90)}
      exiting={SlideOutDown}
      style={[styles.container, { bottom: bottomOffset }]}
    >
      <KeyboardWrapper
        intensity={Platform.OS === "ios" ? 80 : 0}
        tint="light"
        style={styles.keyboardInner}
      >
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={24} color={C.textMuted} />
          </TouchableOpacity>
          <View style={styles.handle} />
          <TouchableOpacity onPress={onSubmit} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Keys Grid */}
        <View style={styles.grid}>
          {keys.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((key) => renderKey(key))}
            </View>
          ))}
        </View>
      </KeyboardWrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  keyboardInner: {
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.7)" : "#F1F5F9",
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 4,
    height: 24,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.border,
  },
  closeBtn: {
    padding: 4,
  },
  submitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
  },
  submitBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  grid: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    gap: 4,
  },
  key: {
    flex: 1,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  keyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: C.text,
  },
  actionKey: {
    backgroundColor: C.backgroundAlt,
  },
  actionKeyText: {
    fontSize: 16,
    color: C.primary,
  },
  operatorKey: {
    backgroundColor: C.primaryLight,
  },
  operatorKeyText: {
    color: "#FFFFFF",
  },
  specialKey: {
    backgroundColor: C.orangeLighter,
    borderWidth: 1,
    borderColor: C.orangeLight,
  },
  deleteKey: {
    backgroundColor: C.errorLighter,
  },
});
