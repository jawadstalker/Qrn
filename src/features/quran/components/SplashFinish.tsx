import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import {
  Canvas,
  Group,
  LinearGradient,
  Points,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import {
  COVER_ART_HEIGHT,
  COVER_ART_PATH,
  COVER_ART_WIDTH,
} from "@/features/quran/data/coverArt";
import {
  COVER_MARK_ASPECT,
  COVER_MARK_WIDTH,
  SPINE_WIDTH,
} from "@/features/quran/components/QuranCoverMark";

/**
 * The GPU (Skia) half of the 2D finish: light sweeps across the finished cover. It runs on the UI
 * thread, driven by the splash clock, on top of the flat cover logo.
 *   - a soft sheen crosses the whole cover,
 *   - a brighter one crosses only the gold tooling (the gold catches the light).
 */
export interface SplashFinishTimes {
  glintStart: number;
  glintEnd: number;
  /** Gold sparks burst out of the cover from this second. */
  burstStart: number;
}

const SPARKS = 72;
/** Deterministic pseudo-random in 0..1. */
const rand = (index: number, salt: number) => {
  "worklet";

  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;

  return x - Math.floor(x);
};

interface SplashFinishProps {
  clock: SharedValue<number>;
  width: number;
  height: number;
  /** Width of the flat cover mark (spine + cover) on screen. */
  markWidth: number;
  times: SplashFinishTimes;
}

const clamp01 = (value: number) => {
  "worklet";

  return Math.min(Math.max(value, 0), 1);
};

export function SplashFinish({
  clock,
  width,
  height,
  markWidth,
  times,
}: SplashFinishProps) {
  const scale = markWidth / COVER_MARK_WIDTH;
  const markHeight = markWidth / COVER_MARK_ASPECT;
  const left = (width - markWidth) / 2;
  const top = (height - markHeight) / 2;
  const artCenterX = COVER_ART_WIDTH / 2;
  const artCenterY = COVER_ART_HEIGHT / 2;

  const artPath = useMemo(
    () => Skia.Path.MakeFromSVGString(COVER_ART_PATH),
    [],
  );
  const markClip = useMemo(
    () => Skia.XYWHRect(left, top, markWidth, markHeight),
    [left, top, markWidth, markHeight],
  );

  const glint = useDerivedValue(() =>
    clamp01(
      (clock.value - times.glintStart) / (times.glintEnd - times.glintStart),
    ),
  );
  // Sheen over the whole mark (screen pixels).
  const sheenTransform = useDerivedValue(() => [
    { translateX: (glint.value * 1.6 - 0.8) * markWidth },
    { rotate: -0.32 },
  ]);
  const sheenOpacity = useDerivedValue(() => Math.sin(Math.PI * glint.value));
  // Brighter light on the gold only (cover grid units), a little behind the sheen.
  const goldTransform = useDerivedValue(() => [
    { translateX: (glint.value * 1.7 - 0.85) * COVER_ART_WIDTH },
    { rotate: -0.32 },
  ]);
  const goldOpacity = useDerivedValue(
    () => 0.9 * Math.sin(Math.PI * clamp01(glint.value * 1.1 - 0.05)),
  );

  /* Sparks: a burst from the cover that slows down and drifts, then twinkles out. */
  const burstAge = useDerivedValue(() => Math.max(clock.value - times.burstStart, 0));
  const sparkPoints = (fine: boolean) => {
    "worklet";

    const out: { x: number; y: number }[] = [];
    const age = burstAge.value;

    for (let i = fine ? 1 : 0; i < SPARKS; i += 2) {
      const angle = rand(i, 1) * Math.PI * 2;
      const speed = 0.35 + rand(i, 2) * 0.9;
      const delay = rand(i, 3) * 0.35;
      const a = Math.max(age - delay, 0);
      // Decelerating travel: distance = v * (1 - e^(-k a)) / k
      const travel = (speed * (1 - Math.exp(-2.4 * a))) / 2.4;
      const drift = 0.04 * a * a;

      out.push({
        x: width / 2 + Math.cos(angle) * travel * markWidth * 1.3,
        y: height / 2 + Math.sin(angle) * travel * markWidth * 1.3 - drift * markWidth,
      });
    }

    return out;
  };
  const sparksBig = useDerivedValue(() => sparkPoints(false));
  const sparksFine = useDerivedValue(() => sparkPoints(true));
  const sparkOpacity = useDerivedValue(() => {
    const age = burstAge.value;

    return age <= 0 ? 0 : Math.max(0, 1 - age / 1.6) * (0.75 + 0.25 * Math.sin(age * 38));
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Points
        points={sparksBig}
        mode="points"
        style="stroke"
        strokeWidth={4}
        strokeCap="round"
        color="#FFE9A8"
        opacity={sparkOpacity}
      />
      <Points
        points={sparksFine}
        mode="points"
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        color="#FFF6D6"
        opacity={sparkOpacity}
      />
      <Group clip={markClip} opacity={sheenOpacity}>
        <Group
          transform={sheenTransform}
          origin={vec(width / 2, height / 2)}
        >
          <Rect
            x={width / 2 - markWidth * 0.12}
            y={top - markHeight * 0.4}
            width={markWidth * 0.24}
            height={markHeight * 1.8}
          >
            <LinearGradient
              start={vec(width / 2 - markWidth * 0.12, 0)}
              end={vec(width / 2 + markWidth * 0.12, 0)}
              colors={[
                "rgba(255,244,205,0)",
                "rgba(255,244,205,0.22)",
                "rgba(255,244,205,0)",
              ]}
            />
          </Rect>
        </Group>
      </Group>

      {artPath ? (
        <Group
          transform={[
            { translateX: left + SPINE_WIDTH * scale },
            { translateY: top },
            { scale },
          ]}
          clip={artPath}
        >
          <Group
            opacity={goldOpacity}
            transform={goldTransform}
            origin={vec(artCenterX, artCenterY)}
          >
            <Rect
              x={artCenterX - COVER_ART_WIDTH * 0.1}
              y={-COVER_ART_HEIGHT * 0.4}
              width={COVER_ART_WIDTH * 0.2}
              height={COVER_ART_HEIGHT * 1.8}
            >
              <LinearGradient
                start={vec(artCenterX - COVER_ART_WIDTH * 0.1, 0)}
                end={vec(artCenterX + COVER_ART_WIDTH * 0.1, 0)}
                colors={[
                  "rgba(255,250,225,0)",
                  "rgba(255,250,225,0.95)",
                  "rgba(255,250,225,0)",
                ]}
              />
            </Rect>
          </Group>
        </Group>
      ) : null}
    </Canvas>
  );
}
