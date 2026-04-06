import * as Haptics from "expo-haptics";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

const C = Colors.light;

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface PracticeCardProps {
  question: PracticeQuestion;
  questionNumber: number;
  onAnswer: (isCorrect: boolean) => void;
}

function OptionButton({
  label,
  index,
  selectedIndex,
  correctIndex,
  onPress,
  answered,
}: {
  label: string;
  index: number;
  selectedIndex: number | null;
  correctIndex: number;
  onPress: (index: number) => void;
  answered: boolean;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(withTiming(0.95, { duration: 100 }), withSpring(1, { damping: 10 }));
    onPress(index);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isSelected = selectedIndex === index;
  const isCorrect = index === correctIndex;

  let bgColor = C.cardNeutral;
  let borderColor = C.cardNeutralBorder;
  let textColor = C.primary;

  if (answered && isCorrect) {
    bgColor = C.cardCorrect;
    borderColor = C.cardCorrectBorder;
    textColor = C.successDark;
  } else if (answered && isSelected && !isCorrect) {
    bgColor = C.cardWrong;
    borderColor = C.cardWrongBorder;
    textColor = C.errorDark;
  }

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: bgColor, borderColor }]}
        onPress={handlePress}
        disabled={answered}
        activeOpacity={0.85}
      >
        <View style={[styles.optionBadge, { backgroundColor: borderColor }]}>
          <Text style={[styles.optionLetter, { color: textColor }]}>{optionLetters[index]}</Text>
        </View>
        <Text style={[styles.optionText, { color: textColor }]}>{label}</Text>
        {answered && isCorrect && <Text style={styles.resultIcon}>✓</Text>}
        {answered && isSelected && !isCorrect && <Text style={styles.resultIcon}>✗</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function PracticeCard({ question, questionNumber, onAnswer }: PracticeCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const explanationHeight = useSharedValue(0);
  const explanationOpacity = useSharedValue(0);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
    setAnswered(true);
    const isCorrect = index === question.correctIndex;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    onAnswer(isCorrect);

    setTimeout(() => {
      setShowExplanation(true);
      explanationHeight.value = withSpring(1);
      explanationOpacity.value = withTiming(1, { duration: 300 });
    }, 400);
  };

  const explanationStyle = useAnimatedStyle(() => ({
    opacity: explanationOpacity.value,
    maxHeight: explanationHeight.value === 0 ? 0 : 200,
    overflow: "hidden",
  }));

  const isCorrectAnswer = selectedIndex === question.correctIndex;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.questionNumberBadge}>
          <Text style={styles.questionNumberText}>Q{questionNumber}</Text>
        </View>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <OptionButton
            key={option}
            label={option}
            index={index}
            selectedIndex={selectedIndex}
            correctIndex={question.correctIndex}
            onPress={handleSelect}
            answered={answered}
          />
        ))}
      </View>

      {showExplanation && (
        <Animated.View
          style={[
            styles.explanationBox,
            {
              backgroundColor: isCorrectAnswer ? C.cardCorrect : C.warningLight,
              borderColor: isCorrectAnswer ? C.cardCorrectBorder : C.warningBorder,
            },
            explanationStyle,
          ]}
        >
          <Text style={styles.explanationTitle}>
            {isCorrectAnswer ? "Great job!" : "Here's a hint:"}
          </Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  questionNumberBadge: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 32,
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  questionNumberText: {
    color: C.white,
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  questionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.text,
    flex: 1,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  optionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    flex: 1,
  },
  resultIcon: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginLeft: "auto",
  },
  explanationBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  explanationTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: C.text,
  },
  explanationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
});
