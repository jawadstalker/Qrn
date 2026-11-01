import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { USE_3D_PLANT } from "@/features/quran/config";
import { Plant3D } from "@/features/quran/components/Plant3D";
import { PlantSvg } from "@/features/quran/components/PlantSvg";
import { useSplashGate } from "@/features/quran/state/SplashGateContext";

const ASPECT_RATIO = 310 / 240;

interface GrowthPlantProps {
  width: number;
  leaves: number;
  flowers: number;
  hasNewLeaf?: boolean;
  newBlossom?: boolean;
}

export function GrowthPlant({
  width,
  leaves,
  flowers,
  hasNewLeaf = false,
  newBlossom = false,
}: GrowthPlantProps) {
  const reduced = useReducedMotion();
  const splashGateOpen = useSplashGate();
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
          newBlossom={newBlossom}
        />
      </View>
    );
  }

  // Wait for the splash to release the GPU before building the 3D scene.
  if (!splashGateOpen) {
    return <View style={{ width, height }} />;
  }

  return (
    <Plant3D
      key={`${leaves}-${flowers}-${hasNewLeaf}-${newBlossom}`}
      width={width}
      height={height}
      leaves={leaves}
      flowers={flowers}
      hasNewLeaf={hasNewLeaf}
      newBlossom={newBlossom}
      reducedMotion={reduced}
      onFailure={handleFailure}
    />
  );
}
