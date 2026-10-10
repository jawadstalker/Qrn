import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { USE_3D_PLANT } from "@/features/quran/config";
import { Plant3D } from "@/features/quran/components/Plant3D";
import { PlantSvg } from "@/features/quran/components/PlantSvg";

const ASPECT_RATIO = 310 / 240;

interface GrowthPlantProps {
  width: number;
  leaves: number;
  flowers: number;
  hasNewLeaf?: boolean;
}

export function GrowthPlant({
  width,
  leaves,
  flowers,
  hasNewLeaf = false,
}: GrowthPlantProps) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const height = Math.round(width * ASPECT_RATIO);
  const handleFailure = useCallback(() => setFailed(true), []);

  if (!USE_3D_PLANT || failed) {
    return (
      <View style={{ width, height }}>
        <PlantSvg
          width={width}
          leaves={leaves}
          flowers={flowers}
          hasNewLeaf={hasNewLeaf}
        />
      </View>
    );
  }

  return (
    <Plant3D
      key={`${leaves}-${flowers}-${hasNewLeaf}`}
      width={width}
      height={height}
      leaves={leaves}
      flowers={flowers}
      hasNewLeaf={hasNewLeaf}
      reducedMotion={reduced}
      onFailure={handleFailure}
    />
  );
}
