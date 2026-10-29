import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { STAR } from "@/features/quran/components/QuranLogo";
import {
  BOOK_ASPECT,
  BOOK_COLORS as C,
  BOOK_W,
  CARTOUCHE,
  LEFT_TEXT,
  RIGHT_TEXT,
} from "@/features/quran/utils/bookMark";

/**
 * The GPU (Skia) half of the 2D finish. Everything here is drawn as vector paths that are traced
 * on, instead of fading in:
 *   - the text lines write themselves right to left, line by line,
 *   - the gold star is drawn around the book,
 *   - a sprout grows out of the spine,
 *   - a soft glint sweeps across the finished book.
 * It runs on the UI thread, driven by the splash clock, and draws on top of the flat book.
 */
export interface SplashFinishTimes {
  textStart: number;
  textEnd: number;
  starStart: number;
  starEnd: number;
  sproutStart: number;
  sproutEnd: number;
  glintStart: number;
  glintEnd: number;
}

interface SplashFinishProps {
  clock: SharedValue<number>;
  width: number;
  height: number;
  bookWidth: number;
  starSize: number;
  sproutHeight: number;
  times: SplashFinishTimes;
}

const clamp01 = (value: number) => {
  "worklet";

  return Math.min(Math.max(value, 0), 1);
};
const easeOut = (x: number) => {
  "worklet";

  return 1 - Math.pow(1 - x, 3);
};
const easeInOut = (x: number) => {
  "worklet";

  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** "x,y x,y ..." polygon points -> a closed SVG path. */
function polygonPath(points: string): string {
  const pairs = points.trim().split(/\s+/);

  return `M${pairs.join("L")}Z`.replace(/,/g, " ");
}

const SPROUT_STEM = "M35.5 100 C35 80 35.5 62 35.5 44";
const SPROUT_LEAF_LEFT = "M35.5 60 C20 62 6 52 2 30 C20 28 33 40 35.5 60 Z";
const SPROUT_LEAF_RIGHT = "M35.5 44 C50 46 63 36 67 14 C50 12 38 24 35.5 44 Z";

export function SplashFinish({
  clock,
  width,
  height,
  bookWidth,
  starSize,
  sproutHeight,
  times,
}: SplashFinishProps) {
  const unit = bookWidth / BOOK_W;
  const bookHeight = bookWidth / BOOK_ASPECT;
  const left = (width - bookWidth) / 2;
  const top = (height - bookHeight) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  const sproutScale = sproutHeight / 100;

  const starPath = useMemo(() => polygonPath(STAR), []);
  const titleBar = useMemo(
    () =>
      `M${CARTOUCHE.x + 22} ${CARTOUCHE.y + CARTOUCHE.height / 2}h28`,
    [],
  );

  /* Progress values, all computed on the UI thread from the splash clock. */
  const text = useDerivedValue(() =>
    easeInOut(
      clamp01(
        (clock.value - times.textStart) / (times.textEnd - times.textStart),
      ),
    ),
  );
  const rings = useDerivedValue(() =>
    clamp01((clock.value - times.textEnd + 0.1) / 0.3),
  );
  const star = useDerivedValue(() =>
    easeInOut(
      clamp01(
        (clock.value - times.starStart) / (times.starEnd - times.starStart),
      ),
    ),
  );
  const stem = useDerivedValue(() =>
    easeOut(
      clamp01(
        (clock.value - times.sproutStart) /
          ((times.sproutEnd - times.sproutStart) * 0.6),
      ),
    ),
  );
  const leaf = useDerivedValue(() =>
    easeOut(
      clamp01(
        (clock.value - (times.sproutStart + (times.sproutEnd - times.sproutStart) * 0.45)) /
          ((times.sproutEnd - times.sproutStart) * 0.55),
      ),
    ),
  );
  const leafLeftTransform = useDerivedValue(() => [
    { translateX: 35.5 },
    { translateY: 60 },
    { scale: leaf.value },
    { translateX: -35.5 },
    { translateY: -60 },
  ]);
  const leafRightTransform = useDerivedValue(() => [
    { translateX: 35.5 },
    { translateY: 44 },
    { scale: leaf.value },
    { translateX: -35.5 },
    { translateY: -44 },
  ]);
  const glint = useDerivedValue(() =>
    clamp01(
      (clock.value - times.glintStart) / (times.glintEnd - times.glintStart),
    ),
  );
  const glintTransform = useDerivedValue(() => [
    { translateX: (glint.value * 1.6 - 0.8) * bookWidth },
    { rotate: -0.32 },
  ]);
  const glintOpacity = useDerivedValue(() =>
    Math.sin(Math.PI * glint.value),
  );

  const bookClip = useMemo(
    () => Skia.XYWHRect(left, top, bookWidth, bookHeight),
    [left, top, bookWidth, bookHeight],
  );

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Star, traced around the book (its edges that fall inside the book stay hidden) */}
      <Group clip={bookClip} invertClip>
      <Group
        transform={[
          { translateX: centerX - starSize / 2 },
          { translateY: centerY - starSize / 2 },
          { scale: starSize / 240 },
        ]}
      >
        <Path
          path={starPath}
          style="stroke"
          strokeWidth={2.2}
          strokeJoin="round"
          strokeCap="round"
          color={C.gold}
          opacity={0.85}
          start={0}
          end={star}
        />
      </Group>
      </Group>

      {/* The text writes itself onto the flat pages (units of the 200 x 140 book grid) */}
      <Group
        transform={[
          { translateX: left },
          { translateY: top },
          { scale: unit },
        ]}
      >
        {[RIGHT_TEXT, LEFT_TEXT].map((layout, index) => (
          <React.Fragment key={index}>
            <Path
              path={layout.words}
              style="stroke"
              strokeWidth={1.15}
              strokeCap="round"
              color={C.ink}
              opacity={0.62}
              start={0}
              end={text}
            />
            <Group opacity={rings}>
              {layout.markers.map(([x, y]) => (
                <React.Fragment key={`${x}-${y}`}>
                  <Circle cx={x} cy={y} r={1.5} color={C.cream} />
                  <Circle
                    cx={x}
                    cy={y}
                    r={1.5}
                    style="stroke"
                    strokeWidth={0.55}
                    color={C.goldDark}
                  />
                </React.Fragment>
              ))}
            </Group>
          </React.Fragment>
        ))}
        <Path
          path={titleBar}
          style="stroke"
          strokeWidth={2.6}
          strokeCap="round"
          color={C.ink}
          opacity={0.8}
          start={0}
          end={text}
        />
      </Group>

      {/* Sprout: the stem is drawn upward, then the leaves unfold */}
      <Group
        transform={[
          { translateX: centerX - bookWidth * 0.015 - 35.5 * sproutScale },
          { translateY: top + 1 - sproutHeight },
          { scale: sproutScale },
        ]}
      >
        <Path
          path={SPROUT_STEM}
          style="stroke"
          strokeWidth={1.7}
          strokeCap="round"
          color={C.gold}
          start={0}
          end={stem}
        />
        <Group transform={leafLeftTransform}>
          <Path path={SPROUT_LEAF_LEFT} color={C.gold} opacity={leaf} />
        </Group>
        <Group transform={leafRightTransform}>
          <Path path={SPROUT_LEAF_RIGHT} color={C.gold} opacity={leaf} />
        </Group>
      </Group>

      {/* A soft glint sweeps over the finished book */}
      <Group clip={bookClip} opacity={glintOpacity}>
        <Group transform={glintTransform} origin={vec(centerX, centerY)}>
          <Rect
            x={centerX - bookWidth * 0.12}
            y={top - bookHeight * 0.4}
            width={bookWidth * 0.24}
            height={bookHeight * 1.8}
          >
            <LinearGradient
              start={vec(centerX - bookWidth * 0.12, 0)}
              end={vec(centerX + bookWidth * 0.12, 0)}
              colors={[
                "rgba(255,244,205,0)",
                "rgba(255,244,205,0.34)",
                "rgba(255,244,205,0)",
              ]}
            />
          </Rect>
        </Group>
      </Group>
    </Canvas>
  );
}
