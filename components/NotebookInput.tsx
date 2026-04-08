import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import {
  Platform,
  type ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import Colors from "@/constants/colors";

const C = Colors.light;

interface NotebookInputProps {
  typedAnswers: string[];
  setTypedAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  activeInputIndex: number;
  setActiveInputIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsKeyboardVisible: React.Dispatch<React.SetStateAction<boolean>>;
  requiredLines: number;
  inputRef: React.RefObject<TextInput | null>;
  notebookScrollViewRef: React.RefObject<ScrollView | null>;
  onCheck: () => void;
  iosAccessoryId?: string;
  accentColor?: string;
}

export function NotebookInput({
  typedAnswers,
  setTypedAnswers,
  setActiveInputIndex,
  setIsKeyboardVisible,
  requiredLines,
  inputRef,
  notebookScrollViewRef,
  onCheck,
  iosAccessoryId,
  accentColor = C.primary,
}: NotebookInputProps) {
  return (
    <Animated.View
      entering={SlideInDown.duration(350)}
      exiting={SlideOutDown.duration(250)}
      style={styles.notebookCard}
    >
      {/* Notebook lines */}
      {Array.from({ length: Math.max(8, requiredLines + 1) }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Static lines
        <View key={`nb-line-${i}`} style={[styles.nbLine, { top: 40 + i * 46 }]} />
      ))}
      {/* Red margin line */}
      <View style={styles.marginLine} />

      <View style={styles.inputHeader}>
        <Text style={styles.inputLabel}>
          {requiredLines === 1 ? "Your answer" : "Solve step by step"}
        </Text>
      </View>
      <View style={{ gap: 0, paddingTop: 10 }}>
        {typedAnswers.map((ans, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Rows correspond to index
          <View key={`row-${idx}`} style={styles.inputRow}>
            {(typedAnswers.length > 1 || ans.length > 0) && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  if (typedAnswers.length === 1) {
                    setTypedAnswers([""]);
                  } else {
                    const newAns = [...typedAnswers];
                    newAns.splice(idx, 1);
                    setTypedAnswers(newAns);
                  }
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color={C.errorLight} />
              </TouchableOpacity>
            )}
            <TextInput
              ref={idx === typedAnswers.length - 1 ? inputRef : undefined}
              style={styles.textInput}
              inputAccessoryViewID={Platform.OS === "ios" ? iosAccessoryId : undefined}
              placeholder={requiredLines === 1 ? "Type your answer..." : `Step ${idx + 1}...`}
              placeholderTextColor={C.textMuted}
              value={ans}
              onFocus={() => {
                setActiveInputIndex(idx);
                setIsKeyboardVisible(true);
                setTimeout(() => {
                  notebookScrollViewRef.current?.scrollTo({
                    y: 200 + idx * 46,
                    animated: true,
                  });
                }, 100);
              }}
              showSoftInputOnFocus={false}
              caretHidden={false}
              onChangeText={(text) => {
                const newAns = [...typedAnswers];
                newAns[idx] = text;
                setTypedAnswers(newAns);
              }}
              onSubmitEditing={() => {
                if (
                  idx === typedAnswers.length - 1 &&
                  typedAnswers.length < requiredLines &&
                  ans.trim()
                ) {
                  setTypedAnswers((prev) => [...prev, ""]);
                  setTimeout(() => inputRef.current?.focus(), 100);
                } else {
                  onCheck();
                }
              }}
              autoFocus={idx === typedAnswers.length - 1}
              returnKeyType={idx === typedAnswers.length - 1 ? "done" : "next"}
              keyboardType={requiredLines === 1 ? "number-pad" : "default"}
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
            />
            {idx === typedAnswers.length - 1 && typedAnswers.length < requiredLines && (
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  { backgroundColor: accentColor, shadowColor: accentColor },
                  !ans.trim() && styles.addBtnDisabled,
                ]}
                onPress={() => {
                  setTypedAnswers((prev) => [...prev, ""]);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                disabled={!ans.trim()}
                activeOpacity={0.9}
              >
                <Ionicons name="arrow-down" size={18} color={C.white} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Check Button */}
      <View style={styles.nbActions}>
        <TouchableOpacity
          style={[
            styles.checkBtn,
            {
              flex: 1,
              justifyContent: "center",
              backgroundColor: accentColor,
              shadowColor: accentColor,
            },
          ]}
          onPress={onCheck}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle" size={20} color={C.white} />
          <Text style={styles.checkBtnText}>Check Answer</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  notebookCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingRight: 16,
    paddingLeft: 48,
    paddingTop: 16,
    paddingBottom: 24,
    minHeight: 160,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
    position: "relative",
  },
  nbLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.infoLight,
  },
  marginLine: {
    position: "absolute",
    left: 40,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: C.errorLight,
    opacity: 0.6,
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    marginLeft: 4,
    position: "relative",
  },
  deleteBtn: {
    position: "absolute",
    left: -34,
    zIndex: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 22,
    color: C.text,
    letterSpacing: 0.5,
    padding: 0,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnDisabled: {
    backgroundColor: C.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  nbActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 16,
  },
  checkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: C.white,
  },
});
