import React from "react";
import Svg, { Defs, Mask, Path, Polygon, Rect } from "react-native-svg";

/**
 * Quran Garden mark. One silhouette, the eight-pointed star (rub el hizb), with an open book and
 * a sprout cut out of it as negative space, so the mark works on any background.
 * Geometry lives on a 240 grid; the same shapes are in assets/brand/logo-color.svg and logo-mono.svg.
 */
const GOLD = "#D9B864";

const STAR =
  "120.00,8.00 152.81,40.80 199.20,40.80 199.20,87.19 232.00,120.00 199.20,152.81 199.20,199.20 152.81,199.20 120.00,232.00 87.19,199.20 40.80,199.20 40.80,152.81 8.00,120.00 40.80,87.19 40.80,40.80 87.19,40.80";
const STAR_INLINE =
  "120.00,18.00 149.88,47.87 192.12,47.88 192.13,90.12 222.00,120.00 192.13,149.88 192.12,192.12 149.88,192.13 120.00,222.00 90.12,192.13 47.88,192.12 47.87,149.88 18.00,120.00 47.87,90.12 47.88,47.88 90.12,47.87";
const WING = "M118,160 C101,149 84,146 68,150 L68,102 C85,97 103,101 118,113 Z";
const WING_RIGHT =
  "M 122,160 C 139,149 156,146 172,150 L 172,102 C 155,97 137,101 122,113 Z";
const STEM =
  "M118.2,113 C118.2,102 118.4,94 119,86 L121,86 C121.6,94 121.8,102 121.8,113 Z";
const LEAF = "M118.6,98 C108,99 98,93 94,80 C106,78 116,85 118.6,98 Z";
const LEAF_RIGHT =
  "M 121.4,98 C 132,99 142,93 146,80 C 134,78 124,85 121.4,98 Z";
const LINES = [
  "M78,114 C88,111 100,113 109,120",
  "M 162,114 C 152,111 140,113 131,120",
  "M78,127 C88,124 100,126 109,133",
  "M 162,127 C 152,124 140,126 131,133",
];

interface QuranLogoProps {
  size: number;
  /** Color of the mark. Defaults to the brand gold; pass any color for the one-color version. */
  color?: string;
}

export function QuranLogo({ size, color = GOLD }: QuranLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <Defs>
        <Mask
          id="quran-logo-mask"
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={240}
          height={240}
        >
          <Rect width={240} height={240} fill="#000" />
          <Polygon
            points={STAR}
            fill="#fff"
            stroke="#fff"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Polygon
            points={STAR_INLINE}
            fill="none"
            stroke="#000"
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <Path d={WING} fill="#000" />
          <Path d={WING_RIGHT} fill="#000" />
          <Path d={STEM} fill="#000" />
          <Path d={LEAF} fill="#000" />
          <Path d={LEAF_RIGHT} fill="#000" />
          {LINES.map((d) => (
            <Path
              key={d}
              d={d}
              fill="none"
              stroke="#fff"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          ))}
        </Mask>
      </Defs>
      <Rect
        width={240}
        height={240}
        fill={color}
        mask="url(#quran-logo-mask)"
      />
    </Svg>
  );
}
