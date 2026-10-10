import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const PETALS = [
  { left: 8, size: 10, color: "#F2A7B8", duration: 5200, delay: 0 },
  { left: 22, size: 8, color: "#FFFFFF", duration: 6400, delay: 1200 },
  { left: 38, size: 12, color: "#F6E4BE", duration: 5800, delay: 600 },
  { left: 54, size: 9, color: "#F2A7B8", duration: 6800, delay: 2100 },
  { left: 70, size: 11, color: "#FFFFFF", duration: 5400, delay: 1700 },
  { left: 86, size: 9, color: "#F6E4BE", duration: 6200, delay: 300 },
  { left: 14, size: 8, color: "#FFFFFF", duration: 7000, delay: 3000 },
  { left: 62, size: 10, color: "#F2A7B8", duration: 6000, delay: 2800 },
];

function Petal({
  spec,
  distance,
}: {
  spec: (typeof PETALS)[number];
  distance: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: spec.duration, easing: Easing.linear }),
        -1,
      ),
    );
  }, [progress, spec.delay, spec.duration]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value > 0.9 ? (1 - progress.value) / 0.1 : 1,
    transform: [
      { translateY: -20 + progress.value * distance },
      { translateX: Math.sin(progress.value * 9) * 14 },
      { rotate: `${progress.value * 420}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.petal,
        {
          left: `${spec.left}%`,
          width: spec.size,
          height: spec.size,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

export function PetalRain({ distance }: { distance: number }) {
  const reduced = useReducedMotion();
  const petals = useMemo(() => PETALS, []);

  if (reduced) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {petals.map((spec) => (
        <Petal
          key={`${spec.left}-${spec.delay}`}
          spec={spec}
          distance={distance}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  petal: {
    position: "absolute",
    top: 0,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 20,
  },
});
