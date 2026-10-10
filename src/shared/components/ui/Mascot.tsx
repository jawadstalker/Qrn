import React from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";
import { Float } from "@/shared/motion/motion";

const SOURCES = {
  head: require("../../../../assets/mascot/head.png"),
  calm: require("../../../../assets/mascot/calm.png"),
  wave: require("../../../../assets/mascot/wave.png"),
  laptop: require("../../../../assets/mascot/laptop.png"),
};

export type MascotPose = keyof typeof SOURCES;

interface MascotProps {
  pose: MascotPose;
  size: number;
  floating?: boolean;
  floatDelay?: number;
  style?: StyleProp<ImageStyle>;
}

export function Mascot({
  pose,
  size,
  floating = false,
  floatDelay = 0,
  style,
}: MascotProps) {
  const image = (
    <Image
      source={SOURCES[pose]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );

  return floating ? (
    <Float delay={floatDelay} amplitude={7} duration={2400}>
      {image}
    </Float>
  ) : (
    image
  );
}
