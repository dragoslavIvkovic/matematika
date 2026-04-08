import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { computeTaskCount } from "@/utils/dailyPracticeGenerator";
import { LEVEL_CONFIGS, type LevelId } from "@/utils/ProblemGenerator";

const C = Colors.light;

interface DailyPracticeSelectionModalProps {
  visible: boolean;
  initialSelection: LevelId[];
  onConfirm: (levels: LevelId[]) => void;
  onDismiss: () => void;
}

export function DailyPracticeSelectionModal({
  visible,
  initialSelection,
  onConfirm,
  onDismiss,
}: DailyPracticeSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<LevelId[]>(initialSelection);

  const toggleLevel = (id: LevelId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  };

  const canConfirm = selected.length >= 1;
  const taskCount = computeTaskCount(selected.length);

  const handleConfirm = () => {
    if (!canConfirm) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(selected);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={modalStyles.root}>
        {/* Overlay — tap to dismiss */}
        <TouchableOpacity style={modalStyles.overlay} onPress={onDismiss} activeOpacity={1} />

        {/* Bottom sheet card */}
        <View style={[modalStyles.card, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={modalStyles.handle} />

          <Text style={modalStyles.title}>Choose Practice Areas</Text>
          <Text style={modalStyles.subtitle}>
            Pick the areas you want to practice. We'll generate {canConfirm ? taskCount : "10+"}{" "}
            tasks for you.
          </Text>

          {/* Level options — scrollable for any number of levels */}
          <ScrollView
            style={modalStyles.levelScroll}
            contentContainerStyle={modalStyles.levelList}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {LEVEL_CONFIGS.map((config) => {
              const isSelected = selected.includes(config.id);
              const color = C.levels[config.id] || C.primary;

              return (
                <TouchableOpacity
                  key={config.id}
                  style={[
                    modalStyles.levelItem,
                    isSelected && { borderColor: color, backgroundColor: `${color}10` },
                  ]}
                  onPress={() => toggleLevel(config.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      modalStyles.checkbox,
                      isSelected && { backgroundColor: color, borderColor: color },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color={C.white} />}
                  </View>
                  <View style={modalStyles.levelInfo}>
                    <Text style={[modalStyles.levelName, isSelected && { color }]}>
                      {config.id} – {config.name}
                    </Text>
                    <Text style={modalStyles.levelDesc}>{config.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Selection count */}
          <Text style={[modalStyles.countText, !canConfirm && { color: C.error }]}>
            {selected.length === 0
              ? "Select at least 1 area"
              : `${selected.length} area${selected.length > 1 ? "s" : ""} · ${taskCount} tasks`}
          </Text>

          {/* Buttons */}
          <View style={modalStyles.buttonRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.confirmBtn, !canConfirm && { opacity: 0.4 }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={!canConfirm}
            >
              <Ionicons name="checkmark-circle" size={18} color={C.white} />
              <Text style={modalStyles.confirmBtnText}>Start Practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  card: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 22,
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  levelScroll: {
    maxHeight: 380,
  },
  levelList: {
    gap: 8,
    paddingBottom: 4,
  },
  levelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    backgroundColor: C.surface,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  levelInfo: {
    flex: 1,
    gap: 2,
  },
  levelName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: C.text,
  },
  levelDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textMuted,
  },
  countText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.accent,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.backgroundAlt,
    alignItems: "center",
  },
  cancelBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: C.white,
  },
});
