import React, { useEffect, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const POP_SPRING = { damping: 11, stiffness: 170, mass: 0.7 };
const RISE_DISTANCE = 16;

export function useRiseStyle(delay = 0) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) {
      progress.value = withDelay(
        delay,
        withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [delay, progress, reduced]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * RISE_DISTANCE }],
  }));
}

export function usePopStyle(delay = 0) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) {
      progress.value = withDelay(delay, withSpring(1, POP_SPRING));
    }
  }, [delay, progress, reduced]);

  return useAnimatedStyle(() => ({
    opacity: Math.min(progress.value * 2, 1),
    transform: [{ scale: 0.55 + progress.value * 0.45 }],
  }));
}

export function useFloatStyle(amplitude = 8, duration = 2400, delay = 0) {
  const reduced = useReducedMotion();
  const phase = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      return;
    }

    phase.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [delay, duration, phase, reduced]);

  return useAnimatedStyle(() => ({
    transform: [
      { translateY: -amplitude * phase.value },
      { rotate: `${(phase.value - 0.5) * 3}deg` },
    ],
  }));
}

export function useBreathStyle(delay = 0, duration = 2500) {
  const reduced = useReducedMotion();
  const phase = useSharedValue(reduced ? 0.5 : 0);

  useEffect(() => {
    if (reduced) {
      return;
    }

    phase.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [delay, duration, phase, reduced]);

  return useAnimatedStyle(() => ({
    opacity: 0.35 + (1 - phase.value) * 0.55,
    transform: [{ scale: 0.7 + phase.value * 0.45 }],
  }));
}

export function usePulseRingStyle(delay = 0) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      return;
    }

    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }),
        -1,
      ),
    );
  }, [delay, progress, reduced]);

  return useAnimatedStyle(() => ({
    opacity: reduced ? 0 : 0.5 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 0.9 }],
  }));
}

interface MotionProps {
  children?: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function Rise({ children, delay = 0, style }: MotionProps) {
  return (
    <Animated.View style={[style, useRiseStyle(delay)]}>
      {children}
    </Animated.View>
  );
}

export function Pop({ children, delay = 0, style }: MotionProps) {
  return (
    <Animated.View style={[style, usePopStyle(delay)]}>
      {children}
    </Animated.View>
  );
}

interface FloatProps extends MotionProps {
  amplitude?: number;
  duration?: number;
}

export function Float({
  children,
  delay = 0,
  style,
  amplitude,
  duration,
}: FloatProps) {
  return (
    <Animated.View style={[style, useFloatStyle(amplitude, duration, delay)]}>
      {children}
    </Animated.View>
  );
}
