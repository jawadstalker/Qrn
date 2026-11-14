import React from "react";
import { View } from "react-native";
import {
  FACE_TONES,
  HAIR_COLORS,
  HAT_COLORS,
  OUTFIT_COLORS,
  sanitizeAvatar,
} from "@/features/rooms/avatar";

interface AvatarBadgeProps {
  avatar: Record<string, unknown> | null;
  size: number;
}

/** A tiny flat picture of a player's character (hair, face, outfit), for lists. */
export function AvatarBadge({ avatar, size }: AvatarBadgeProps) {
  const params = sanitizeAvatar(avatar);
  const face = size * 0.5;
  const hair = face * 1.22;
  const scarf = params.hat === "hijab";
  const showHair = params.hairStyle !== "none" && !scarf;
  const covering = scarf
    ? HAT_COLORS[params.hatColor]
    : showHair
      ? HAIR_COLORS[params.hairColor]
      : null;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: OUTFIT_COLORS[params.outfit],
        overflow: "hidden",
        alignItems: "center",
      }}
    >
      {covering ? (
        <View
          style={{
            position: "absolute",
            top: size * 0.05,
            width: hair,
            height: hair,
            borderRadius: hair / 2,
            backgroundColor: covering,
          }}
        />
      ) : null}
      <View
        style={{
          marginTop: size * 0.16,
          width: face,
          height: face,
          borderRadius: face / 2,
          backgroundColor: FACE_TONES[params.face],
        }}
      />
    </View>
  );
}
