import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import type React from "react";
import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

import Colors from "@/constants/colors";

const C = Colors.light;

interface MathKeyboardProps {
  isVisible: boolean;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  bottomOffset?: number;
}

type KeyboardMode = "math" | "letters";

export function MathKeyboard({
  isVisible,
  onKeyPress,
  onDelete,
  onSubmit,
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
    ["7", "8", "9", "*"],
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
    const isAction = ["ABC", "123"].includes(key);
    const isDelete = key === "DEL";
    const isLightMinusDivide = key === "-" || key === "÷";
    const isEquals = key === "=";
    const isOperator = ["+", "-", "*", "÷", "=", "(", ")"].includes(key);
    const isSpecial = ["x", "y"].includes(key);

    let content: React.ReactNode = (
      <Text
        style={[
          styles.keyText,
          isAction && styles.actionKeyText,
          isLightMinusDivide && styles.lightMinusDivideKeyText,
          isEquals && styles.equalsKeyText,
          isOperator && !isLightMinusDivide && !isEquals && styles.operatorKeyText,
        ]}
      >
        {key}
      </Text>
    );

    if (key === "DEL") {
      content = <Ionicons name="backspace-outline" size={24} color={C.white} />;
    }

    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        onPress={() => handlePress(key)}
        style={[
          styles.key,
          isDelete && styles.deleteKey,
          isAction && styles.actionKey,
          isLightMinusDivide && styles.lightMinusDivideKey,
          isEquals && styles.equalsKey,
          isOperator && !isLightMinusDivide && !isEquals && styles.operatorKey,
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
        <View style={styles.topBar}>
          <View style={styles.handle} />
        </View>

        {/* Keys Grid */}
        <View style={styles.grid}>
          {keys.map((row) => (
            <View key={row.join("-")} style={styles.row}>
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
    width: "100%",
    zIndex: 1000,
  },
  keyboardInner: {
    width: "100%",
    backgroundColor: Platform.OS === "ios" ? C.onColorWhite70 : C.borderLight,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  topBar: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    height: 24,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.border,
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
    backgroundColor: C.white,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.black,
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
    color: C.white,
  },
  lightMinusDivideKey: {
    backgroundColor: C.infoLight,
    borderWidth: 1,
    borderColor: C.primaryBorderMuted,
  },
  lightMinusDivideKeyText: {
    color: C.primary,
    fontSize: 20,
  },
  equalsKey: {
    backgroundColor: C.success,
    borderWidth: 0,
  },
  equalsKeyText: {
    color: C.white,
    fontSize: 20,
  },
  specialKey: {
    backgroundColor: C.orangeLighter,
    borderWidth: 1,
    borderColor: C.orangeLight,
  },
  deleteKey: {
    backgroundColor: C.error,
    borderWidth: 0,
  },
});
