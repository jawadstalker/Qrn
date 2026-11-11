import React from "react";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import {
  COVER_ART_HEIGHT,
  COVER_ART_PATH,
  COVER_ART_WIDTH,
} from "@/features/quran/data/coverArt";

/**
 * The Quran Garden logo: the closed cover of the 3D Quran from the splash, flat. Same leather,
 * same gold tooling (traced from the very mask the 3D cover texture is made of), same spine with
 * its two gold bands, so the 3D book and this mark are one picture.
 *
 * Geometry is on the cover's pixel grid: a 19.2 wide spine, then the 320 x 448 cover.
 */
export const COVER_COLORS = {
  leather: "#1F5C42",
  leatherDark: "#174A34",
  gold: "#D9B864",
  goldDark: "#B38533",
  goldLight: "#FFEB9E",
} as const;

export const SPINE_WIDTH = 19.2;
export const COVER_MARK_WIDTH = SPINE_WIDTH + COVER_ART_WIDTH;
export const COVER_MARK_HEIGHT = COVER_ART_HEIGHT;
export const COVER_MARK_ASPECT = COVER_MARK_WIDTH / COVER_MARK_HEIGHT;

const smooth = (x: number) => x * x * (3 - 2 * x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");

  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function blend(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);

  return `rgb(${Math.round(mix(a[0], b[0], t))},${Math.round(mix(a[1], b[1], t))},${Math.round(mix(a[2], b[2], t))})`;
}

const STEPS = 8;

/** Leather: green in the middle, darker toward the edges (the 3D cover's radial shading). */
export const LEATHER_STOPS = Array.from({ length: STEPS + 1 }, (_, index) => {
  const offset = index / STEPS;

  return {
    offset,
    color: blend(
      COVER_COLORS.leather,
      COVER_COLORS.leatherDark,
      smooth(offset) * 0.9,
    ),
  };
});

/** Gold: a diagonal shimmer from darker to lighter gold (the 3D cover's tooling). */
export const GOLD_STOPS = Array.from({ length: STEPS + 1 }, (_, index) => {
  const offset = index / STEPS;

  return {
    offset,
    color: blend(COVER_COLORS.goldDark, COVER_COLORS.goldLight, smooth(offset)),
  };
});

/** Centers of the two gold bands on the spine, on the cover grid. */
const BAND_Y = [COVER_ART_HEIGHT / 2 - 144, COVER_ART_HEIGHT / 2 + 144];
const BAND_HEIGHT = 11.2;

interface QuranCoverMarkProps {
  /** Width of the whole mark (spine + cover). The height follows. */
  width: number;
  /**
   * Spine on the right, as on a Quran. Only the layout is mirrored: the tooling on the cover keeps
   * reading the right way round.
   */
  spineRight?: boolean;
}

export function QuranCoverMark({ width, spineRight = false }: QuranCoverMarkProps) {
  const height = width / COVER_MARK_ASPECT;
  // Where the cover starts and where the spine starts, on the mark's grid.
  const coverX = spineRight ? 0 : SPINE_WIDTH;
  const spineX = spineRight ? COVER_ART_WIDTH : 0;
  const centerX = coverX + COVER_ART_WIDTH / 2;
  const centerY = COVER_ART_HEIGHT / 2;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${COVER_MARK_WIDTH} ${COVER_MARK_HEIGHT}`}
    >
      <Defs>
        <RadialGradient
          id="cover-leather"
          gradientUnits="userSpaceOnUse"
          cx={centerX}
          cy={centerY}
          rx={COVER_ART_WIDTH * 0.7}
          ry={COVER_ART_WIDTH * 0.9}
        >
          {LEATHER_STOPS.map((stop) => (
            <Stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </RadialGradient>
        <LinearGradient
          id="cover-gold"
          gradientUnits="userSpaceOnUse"
          x1={centerX - 167.7}
          y1={centerY - 112}
          x2={centerX + 167.7}
          y2={centerY + 112}
        >
          {GOLD_STOPS.map((stop) => (
            <Stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </LinearGradient>
      </Defs>

      <Rect
        x={spineX}
        y={0}
        width={SPINE_WIDTH}
        height={COVER_ART_HEIGHT}
        fill={COVER_COLORS.leather}
      />
      {BAND_Y.map((y) => (
        <Rect
          key={y}
          x={spineRight ? spineX - 1.3 : 0}
          y={y - BAND_HEIGHT / 2}
          width={SPINE_WIDTH + 1.3}
          height={BAND_HEIGHT}
          fill={COVER_COLORS.gold}
        />
      ))}
      <Rect
        x={coverX}
        y={0}
        width={COVER_ART_WIDTH}
        height={COVER_ART_HEIGHT}
        fill="url(#cover-leather)"
      />
      <G transform={`translate(${coverX} 0)`}>
        <Path d={COVER_ART_PATH} fill="url(#cover-gold)" fillRule="evenodd" />
      </G>
    </Svg>
  );
}
