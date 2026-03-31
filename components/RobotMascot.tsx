import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

const C = Colors.light;

interface RobotMascotProps {
  size?: number;
  isThinking?: boolean;
}

export function RobotMascot({ size = 80, isThinking = false }: RobotMascotProps) {
  const scale = useSharedValue(1);
  const antennaRotate = useSharedValue(0);
  const blinkOpacity = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    antennaRotate.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 600, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    const blinkInterval = setInterval(() => {
      blinkOpacity.value = withSequence(
        withTiming(0, { duration: 80 }),
        withTiming(1, { duration: 80 })
      );
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  const antennaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${antennaRotate.value}deg` }],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));

  const s = size;
  const bodyW = s;
  const bodyH = s * 0.72;
  const headW = s * 0.7;
  const headH = s * 0.56;
  const eyeSize = s * 0.16;
  const pupilSize = eyeSize * 0.5;
  const antH = s * 0.2;
  const antW = s * 0.06;
  const ballR = s * 0.08;

  return (
    <View style={{ width: s, height: s * 1.1, alignItems: "center" }}>
      <Animated.View style={[{ alignItems: "center" }, bodyStyle]}>
        {/* Antenna */}
        <Animated.View style={[{ alignItems: "center", marginBottom: 2 }, antennaStyle]}>
          <View
            style={{
              width: ballR * 2,
              height: ballR * 2,
              borderRadius: ballR,
              backgroundColor: C.robot.antenna,
              shadowColor: C.robot.antenna,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 6,
              elevation: 4,
            }}
          />
          <View
            style={{
              width: antW,
              height: antH,
              backgroundColor: C.robot.bodyLight,
              borderRadius: antW / 2,
            }}
          />
        </Animated.View>

        {/* Head */}
        <View
          style={{
            width: headW,
            height: headH,
            borderRadius: headW * 0.22,
            backgroundColor: C.robot.body,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
            overflow: "hidden",
          }}
        >
          {/* Sheen */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: headH * 0.45,
              backgroundColor: "rgba(255,255,255,0.12)",
              borderTopLeftRadius: headW * 0.22,
              borderTopRightRadius: headW * 0.22,
            }}
          />

          {/* Eyes Row */}
          <Animated.View
            style={[
              {
                flexDirection: "row",
                gap: s * 0.12,
                marginBottom: s * 0.05,
              },
              eyeStyle,
            ]}
          >
            {[0, 1].map((i) => (
              <View
                key={i}
                style={{
                  width: eyeSize,
                  height: eyeSize,
                  borderRadius: eyeSize / 2,
                  backgroundColor: C.robot.eye,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#fff",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 4,
                }}
              >
                <View
                  style={{
                    width: pupilSize,
                    height: pupilSize,
                    borderRadius: pupilSize / 2,
                    backgroundColor: C.robot.pupil,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: eyeSize * 0.12,
                    right: eyeSize * 0.12,
                    width: pupilSize * 0.35,
                    height: pupilSize * 0.35,
                    borderRadius: 100,
                    backgroundColor: "rgba(255,255,255,0.8)",
                  }}
                />
              </View>
            ))}
          </Animated.View>

          {/* Mouth / smile */}
          <View
            style={{
              width: s * 0.25,
              height: s * 0.06,
              borderRadius: s * 0.03,
              backgroundColor: C.robot.cheek,
              opacity: 0.9,
            }}
          />

          {/* Cheeks */}
          <View style={{ position: "absolute", flexDirection: "row", bottom: headH * 0.15, left: 0, right: 0, justifyContent: "space-between", paddingHorizontal: s * 0.06 }}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={{
                  width: s * 0.1,
                  height: s * 0.06,
                  borderRadius: s * 0.03,
                  backgroundColor: C.robot.cheek,
                  opacity: 0.5,
                }}
              />
            ))}
          </View>
        </View>

        {/* Body */}
        <View
          style={{
            width: bodyW,
            height: bodyH,
            borderRadius: s * 0.16,
            backgroundColor: C.primaryLight,
            marginTop: 3,
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: s * 0.1,
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 6,
            overflow: "hidden",
          }}
        >
          {/* Body sheen */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: bodyH * 0.35,
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
          />

          {/* Chest panel */}
          <View
            style={{
              width: bodyW * 0.55,
              height: bodyH * 0.35,
              borderRadius: s * 0.06,
              backgroundColor: C.primaryDark,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: s * 0.06,
            }}
          >
            {[C.robot.antenna, "#10B981", "#F97316"].map((color, i) => (
              <View
                key={i}
                style={{
                  width: s * 0.07,
                  height: s * 0.07,
                  borderRadius: 100,
                  backgroundColor: color,
                  shadowColor: color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 4,
                }}
              />
            ))}
          </View>

          {/* Arms hint */}
          {[
            { left: -s * 0.1, top: s * 0.05 },
            { right: -s * 0.1, top: s * 0.05 },
          ].map((pos, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                ...pos,
                width: s * 0.14,
                height: bodyH * 0.5,
                borderRadius: s * 0.07,
                backgroundColor: C.primaryLight,
              }}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
