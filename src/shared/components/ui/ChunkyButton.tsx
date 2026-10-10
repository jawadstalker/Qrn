import React, { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SoundPressable } from "@/shared/components/ui/SoundPressable";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";

const FACE_HEIGHT = 56;
const LEDGE_DEPTH = 6;
const SHINE_WIDTH = 56;

interface ChunkyButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ChunkyButton({ label, onPress, style }: ChunkyButtonProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  const shine = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      return;
    }

    shine.value = withDelay(
      1200,
      withRepeat(
        withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.quad) }),
        -1,
      ),
    );
  }, [reduced, shine]);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * (LEDGE_DEPTH - 2) }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -SHINE_WIDTH + shine.value * 520 },
      { skewX: "-20deg" },
    ],
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <SoundPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 120 });
      }}
      style={[styles.container, style]}
    >
      <View style={[styles.ledge, { backgroundColor: colors.primaryShadow }]} />
      <Animated.View
        style={[styles.face, { backgroundColor: colors.primary }, faceStyle]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.shine, shineStyle]}
        />
        <AppText
          variant="button"
          style={[styles.label, { color: colors.onPrimary }]}
        >
          {label}
        </AppText>
      </Animated.View>
    </SoundPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: FACE_HEIGHT + LEDGE_DEPTH,
  },
  ledge: {
    position: "absolute",
    top: LEDGE_DEPTH,
    left: 0,
    right: 0,
    height: FACE_HEIGHT,
    borderRadius: FACE_HEIGHT / 2,
  },
  face: {
    height: FACE_HEIGHT,
    borderRadius: FACE_HEIGHT / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shine: {
    position: "absolute",
    top: -10,
    bottom: -10,
    width: SHINE_WIDTH,
    backgroundColor: "rgba(255,255,255,0.26)",
  },
  label: {
    fontSize: 16,
  },
});
