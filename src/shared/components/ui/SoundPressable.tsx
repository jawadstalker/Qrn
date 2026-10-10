import React, { forwardRef } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type View,
} from "react-native";
import { useSound } from "@/shared/audio/SoundContext";
import type { SoundName } from "@/shared/audio/sounds";

export interface SoundPressableProps extends PressableProps {
  sound?: SoundName | null;
}

export const SoundPressable = forwardRef<View, SoundPressableProps>(
  function SoundPressable({ sound = "tap", onPress, ...rest }, ref) {
    const { play } = useSound();

    const handlePress = (event: GestureResponderEvent) => {
      if (sound) {
        play(sound);
      }

      onPress?.(event);
    };

    return <Pressable ref={ref} onPress={handlePress} {...rest} />;
  },
);
