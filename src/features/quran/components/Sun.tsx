import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useTheme } from "@/core/theme/ThemeContext";
import { USE_3D_PLANT } from "@/features/quran/config";
import { Sun3D } from "@/features/quran/components/Sun3D";

/** Radius of the flat fallback sun, as a share of the 3D canvas (sphere ≈ 46%). */
const FLAT_RATIO = 0.46;

interface SunProps {
  /** Side of the square canvas. The sun body is about half of it; flames fill the rest. */
  size: number;
}

export function Sun({ size }: SunProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const handleFailure = useCallback(() => setFailed(true), []);

  if (!USE_3D_PLANT || failed) {
    const flat = Math.round(size * FLAT_RATIO);

    return (
      <View
        pointerEvents="none"
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: flat,
            height: flat,
            borderRadius: flat / 2,
            backgroundColor: colors.highlightTint,
          }}
        />
      </View>
    );
  }

  return (
    <Sun3D size={size} reducedMotion={reduced} onFailure={handleFailure} />
  );
}
