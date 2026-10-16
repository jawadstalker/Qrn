import React from "react";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { starPoints } from "@/features/quran/components/QuranDecor";

const GOLD = "#D9B864";
const GOLD_LIGHT = "#F6E3A1";
const CREAM = "#FBF3DC";
const GREEN_DARK = "#174A34";
const GREEN = "#1F5C42";
const INK = "#2A1D0C";

const LINE_ROWS = [101, 110, 119, 128, 137];
const RAYS = Array.from({ length: 16 }, (_, index) => {
  const angle = (index * Math.PI) / 8;

  return {
    x1: 120 + Math.cos(angle) * 27,
    y1: 50 + Math.sin(angle) * 27,
    x2: 120 + Math.cos(angle) * (index % 2 === 0 ? 38 : 32),
    y2: 50 + Math.sin(angle) * (index % 2 === 0 ? 38 : 32),
  };
});

interface QuranLogoProps {
  size: number;
}

/**
 * Flat logo of an open Quran under an 8-pointed star, inside a gold ring.
 * It is where the 3D splash book lands, so keep the book roughly centered and cream/green/gold.
 */
export function QuranLogo({ size }: QuranLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <Defs>
        <RadialGradient id="logoGlow" cx="50%" cy="46%" r="50%">
          <Stop offset="0" stopColor={GOLD_LIGHT} stopOpacity="0.5" />
          <Stop offset="0.6" stopColor={GOLD} stopOpacity="0.12" />
          <Stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="logoPage" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#F2E6C3" />
          <Stop offset="0.85" stopColor={CREAM} />
          <Stop offset="1" stopColor="#E9DAB0" />
        </LinearGradient>
        <LinearGradient id="logoPageRight" x1="1" y1="0" x2="0" y2="0">
          <Stop offset="0" stopColor="#F2E6C3" />
          <Stop offset="0.85" stopColor={CREAM} />
          <Stop offset="1" stopColor="#E9DAB0" />
        </LinearGradient>
      </Defs>

      <Circle cx={120} cy={120} r={116} fill="url(#logoGlow)" />
      <Circle
        cx={120}
        cy={120}
        r={108}
        fill="none"
        stroke={GOLD}
        strokeWidth={3}
      />
      <Circle
        cx={120}
        cy={120}
        r={101}
        fill="none"
        stroke={GOLD}
        strokeOpacity={0.55}
        strokeWidth={1}
      />

      {/* Star and rays */}
      <G stroke={GOLD} strokeWidth={1.6} strokeLinecap="round" opacity={0.85}>
        {RAYS.map((ray) => (
          <Line key={`${ray.x2}-${ray.y2}`} {...ray} />
        ))}
      </G>
      <Polygon
        points={starPoints(120, 50, 22)}
        fill={GOLD_LIGHT}
        stroke={GOLD}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={120} cy={50} r={6} fill={GREEN_DARK} />

      {/* Cover under the pages */}
      <Path
        d="M26,152 C60,145 98,151 120,168 C142,151 180,145 214,152 L214,166 C180,159 142,165 120,182 C98,165 60,159 26,166 Z"
        fill={GREEN_DARK}
        stroke={GOLD}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />

      {/* Pages */}
      <Path
        d="M118,164 C100,150 66,144 36,150 L36,84 C66,78 100,84 118,98 Z"
        fill="url(#logoPage)"
        stroke={GOLD}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <Path
        d="M122,164 C140,150 174,144 204,150 L204,84 C174,78 140,84 122,98 Z"
        fill="url(#logoPageRight)"
        stroke={GOLD}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <Path d="M120,98 L120,170" stroke={GREEN} strokeWidth={3} />

      {/* Text lines */}
      <G stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.78}>
        {LINE_ROWS.map((y) => (
          <React.Fragment key={y}>
            <Path d={`M48,${y - 3} Q78,${y - 8} 108,${y + 4}`} fill="none" />
            <Path d={`M192,${y - 3} Q162,${y - 8} 132,${y + 4}`} fill="none" />
          </React.Fragment>
        ))}
      </G>
    </Svg>
  );
}
