import React, { useId } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";
import { Float } from "@/shared/motion/motion";
import { AppText } from "@/shared/components/ui/AppText";
import { BASMALA } from "@/features/quran/data/verseText";

export const GOLD = "#C9B27A";
export const GOLD_DARK = "#8C6B2E";
export const CREAM = "#FFFBEF";

const INNER_RATIO = 0.7654;

/** 8-pointed star (Rub el Hizb): two overlapping squares. */
export function starPoints(cx: number, cy: number, radius: number): string {
  const points: string[] = [];

  for (let step = 0; step < 16; step += 1) {
    const angle = (step * Math.PI) / 8 - Math.PI / 2;
    const r = step % 2 === 0 ? radius : radius * INNER_RATIO;

    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }

  return points.join(" ");
}

function svgId(prefix: string, raw: string): string {
  return `${prefix}${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
}

interface PatternProps {
  width: number;
  height: number;
  color?: string;
  opacity?: number;
  /** Size of one tile of the geometric pattern. */
  tile?: number;
  style?: StyleProp<ViewStyle>;
}

/** Tiled geometric pattern used as a soft background on cards and banners. */
export function IslamicPattern({
  width,
  height,
  color = GOLD,
  opacity = 0.18,
  tile = 44,
  style,
}: PatternProps) {
  const id = svgId("pat", useId());
  const half = tile / 2;

  return (
    <View pointerEvents="none" style={[styles.fillAbsolute, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id={id}
            patternUnits="userSpaceOnUse"
            width={tile}
            height={tile}
          >
            <Polygon
              points={starPoints(half, half, tile * 0.4)}
              fill="none"
              stroke={color}
              strokeWidth={1.2}
            />
            <Polygon
              points={starPoints(half, half, tile * 0.2)}
              fill={color}
              fillOpacity={0.35}
            />
            <Circle cx={0} cy={0} r={2.2} fill={color} />
            <Circle cx={tile} cy={0} r={2.2} fill={color} />
            <Circle cx={0} cy={tile} r={2.2} fill={color} />
            <Circle cx={tile} cy={tile} r={2.2} fill={color} />
          </Pattern>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={`url(#${id})`}
          opacity={opacity}
        />
      </Svg>
    </View>
  );
}

interface StarProps {
  size?: number;
  color?: string;
  fillColor?: string;
  label?: string;
  labelColor?: string;
}

/** 8-pointed star badge with an optional number or label in the middle. */
export function StarBadge({
  size = 40,
  color = GOLD,
  fillColor = "transparent",
  label,
  labelColor = GOLD_DARK,
}: StarProps) {
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Polygon
          points={starPoints(center, center, center - 1.5)}
          fill={fillColor}
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
      {label ? (
        <View style={styles.badgeLabel} pointerEvents="none">
          <AppText
            variant="caption"
            style={{
              color: labelColor,
              fontWeight: "700",
              fontSize: size >= 34 ? 12 : 10,
              lineHeight: size >= 34 ? 16 : 13,
              textAlign: "center",
            }}
          >
            {label}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

/** Small star used as the verse progress dot. */
export function HizbDot({ size = 14, color }: { size?: number; color: string }) {
  const center = size / 2;

  return (
    <Svg width={size} height={size}>
      <Polygon
        points={starPoints(center, center, center - 0.5)}
        fill={color}
      />
    </Svg>
  );
}

/** Crescent moon (horns point right before rotation). */
export function Crescent({
  size = 40,
  color = GOLD,
  rotation = -25,
}: {
  size?: number;
  color?: string;
  rotation?: number;
}) {
  const radius = 20;

  return (
    <Svg width={size} height={size} viewBox="-26 -26 52 52">
      <G rotation={rotation}>
        <Path
          d={`M0,${-radius} A${radius},${radius} 0 1,0 0,${radius} A${radius * 1.25},${radius * 1.25} 0 0,1 0,${-radius} Z`}
          fill={color}
        />
      </G>
    </Svg>
  );
}

/** Four-pointed twinkle. */
export function Sparkle({ size = 12, color = GOLD }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-1 -1 2 2">
      <Path
        d="M0,-1 L0.22,-0.22 L1,0 L0.22,0.22 L0,1 L-0.22,0.22 L-1,0 L-0.22,-0.22 Z"
        fill={color}
      />
    </Svg>
  );
}

/** Mosque silhouette (domes and two minarets) for the horizon of a card. */
export function MosqueSkyline({
  width,
  color,
  opacity = 0.3,
}: {
  width: number;
  color: string;
  opacity?: number;
}) {
  const height = (width * 100) / 300;

  return (
    <Svg width={width} height={height} viewBox="0 0 300 100" opacity={opacity}>
      <G fill={color}>
        <Rect x={0} y={82} width={300} height={18} />
        <Path d="M105,82 A45,45 0 0 1 195,82 Z" />
        <Rect x={149} y={20} width={2} height={18} />
        <Circle cx={150} cy={19} r={3.5} />
        <Path d="M55,82 A25,25 0 0 1 105,82 Z" />
        <Rect x={79.2} y={50} width={1.6} height={8} />
        <Path d="M195,82 A25,25 0 0 1 245,82 Z" />
        <Rect x={219.2} y={50} width={1.6} height={8} />
        <Rect x={20} y={34} width={12} height={66} />
        <Path d="M17,34 L26,10 L35,34 Z" />
        <Rect x={16} y={52} width={20} height={3.5} />
        <Rect x={268} y={34} width={12} height={66} />
        <Path d="M265,34 L274,10 L283,34 Z" />
        <Rect x={264} y={52} width={20} height={3.5} />
      </G>
    </Svg>
  );
}

/** Hanging lantern (fanous). Wrap in <Float> to sway. */
export function Lantern({ size = 44, glow = "#FFD27A" }: { size?: number; glow?: string }) {
  const id = svgId("lan", useId());

  return (
    <Svg width={size} height={(size * 90) / 40} viewBox="0 0 40 90">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={glow} stopOpacity="0.95" />
          <Stop offset="1" stopColor="#F29E4C" stopOpacity="0.9" />
        </LinearGradient>
      </Defs>
      <Line x1={20} y1={0} x2={20} y2={12} stroke={GOLD} strokeWidth={1.6} />
      <Path d="M12,22 L20,12 L28,22 Z" fill={GOLD} />
      <Rect x={10} y={22} width={20} height={4} rx={1} fill={GOLD_DARK} />
      <Path
        d="M12,26 L28,26 L32,50 L28,74 L12,74 L8,50 Z"
        fill={`url(#${id})`}
        stroke={GOLD_DARK}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Line x1={20} y1={26} x2={20} y2={74} stroke={GOLD_DARK} strokeWidth={1} />
      <Line x1={9} y1={50} x2={31} y2={50} stroke={GOLD_DARK} strokeWidth={1} />
      <Rect x={11} y={74} width={18} height={4} rx={1} fill={GOLD_DARK} />
      <Path d="M16,78 L20,88 L24,78 Z" fill={GOLD} />
    </Svg>
  );
}

/** Open Quran on a wooden stand (rehal). */
export function Rehal({ size = 84 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 72) / 100} viewBox="0 0 100 72">
      <G stroke="#7A5232" strokeWidth={4} strokeLinecap="round">
        <Line x1={26} y1={68} x2={74} y2={40} />
        <Line x1={74} y1={68} x2={26} y2={40} />
      </G>
      <Path d="M8,12 L48,18 L48,46 L8,40 Z" fill={CREAM} stroke={GOLD_DARK} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M92,12 L52,18 L52,46 L92,40 Z" fill={CREAM} stroke={GOLD_DARK} strokeWidth={2} strokeLinejoin="round" />
      <G stroke={GOLD} strokeWidth={1.6} strokeLinecap="round">
        <Line x1={14} y1={21} x2={42} y2={25} />
        <Line x1={14} y1={27} x2={42} y2={31} />
        <Line x1={14} y1={33} x2={42} y2={37} />
        <Line x1={86} y1={21} x2={58} y2={25} />
        <Line x1={86} y1={27} x2={58} y2={31} />
        <Line x1={86} y1={33} x2={58} y2={37} />
      </G>
      <Line x1={50} y1={18} x2={50} y2={46} stroke={GOLD_DARK} strokeWidth={2} />
    </Svg>
  );
}

/** Thin line - star - line divider for the end of headers and cards. */
export function OrnamentDivider({ color = GOLD }: { color?: string }) {
  return (
    <View style={styles.dividerRow} pointerEvents="none">
      <View style={[styles.dividerLine, { backgroundColor: color }]} />
      <StarBadge size={18} color={color} />
      <View style={[styles.dividerLine, { backgroundColor: color }]} />
    </View>
  );
}

interface BasmalaBannerProps {
  width: number;
  background: string;
}

/** Green banner with the Basmalah, pattern, swaying lanterns and a crescent. */
export function BasmalaBanner({ width, background }: BasmalaBannerProps) {
  const height = 112;

  return (
    <View style={[styles.banner, { backgroundColor: background, width, height }]}>
      <IslamicPattern width={width} height={height} color={GOLD} opacity={0.28} />
      <View style={[styles.bannerBorder, { borderColor: GOLD }]} pointerEvents="none" />
      <View style={[styles.lanternSlot, { left: 14 }]} pointerEvents="none">
        <Float amplitude={2} duration={2600}>
          <Lantern size={26} />
        </Float>
      </View>
      <View style={[styles.lanternSlot, { right: 14 }]} pointerEvents="none">
        <Float amplitude={2} duration={3100} delay={500}>
          <Lantern size={26} />
        </Float>
      </View>
      <View style={styles.bannerCrescent} pointerEvents="none">
        <Crescent size={26} />
      </View>
      <Text allowFontScaling={false} style={styles.basmala}>
        {BASMALA}
      </Text>
    </View>
  );
}

interface PageBannerProps {
  width: number;
  background: string;
  arabicTitle: string;
  title: string;
  subtitle: string;
  illustration: "rehal" | "crescent" | "star";
  isRTL: boolean;
}

/** Header banner for the tafsir, listen and quiz pages. */
export function PageBanner({
  width,
  background,
  arabicTitle,
  title,
  subtitle,
  illustration,
  isRTL,
}: PageBannerProps) {
  const height = 128;

  return (
    <View style={[styles.banner, { backgroundColor: background, width, height }]}>
      <IslamicPattern width={width} height={height} color={GOLD} opacity={0.24} />
      <View style={[styles.bannerBorder, { borderColor: GOLD }]} pointerEvents="none" />
      <View
        style={[
          styles.pageBannerRow,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View style={styles.pageBannerText}>
          <Text allowFontScaling={false} style={styles.pageBannerArabic}>
            {arabicTitle}
          </Text>
          <AppText
            variant="body"
            style={{ color: CREAM, fontWeight: "800", textAlign: isRTL ? "right" : "left" }}
          >
            {title}
          </AppText>
          <AppText
            variant="caption"
            style={{ color: "#E9DDB8", textAlign: isRTL ? "right" : "left" }}
          >
            {subtitle}
          </AppText>
        </View>
        <Float amplitude={3} duration={2800}>
          {illustration === "rehal" ? (
            <Rehal size={88} />
          ) : illustration === "crescent" ? (
            <View style={styles.illustrationBox}>
              <Crescent size={64} />
              <View style={styles.sparkleTop}>
                <Sparkle size={14} />
              </View>
              <View style={styles.sparkleBottom}>
                <Sparkle size={9} />
              </View>
            </View>
          ) : (
            <StarBadge size={72} color={GOLD} fillColor="rgba(201,178,122,0.18)" />
          )}
        </Float>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fillAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badgeLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    opacity: 0.8,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },
  banner: {
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerBorder: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderWidth: 1.5,
    borderRadius: 17,
    opacity: 0.8,
  },
  lanternSlot: {
    position: "absolute",
    top: 0,
  },
  bannerCrescent: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
  },
  basmala: {
    marginTop: 26,
    fontFamily: "UthmanicHafs",
    fontSize: 30,
    lineHeight: 52,
    color: CREAM,
    textAlign: "center",
    includeFontPadding: false,
  },
  pageBannerRow: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    gap: 12,
  },
  pageBannerText: {
    flex: 1,
    gap: 0,
  },
  pageBannerArabic: {
    fontFamily: "UthmanicHafs",
    fontSize: 30,
    lineHeight: 48,
    color: CREAM,
    includeFontPadding: false,
  },
  illustrationBox: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleTop: {
    position: "absolute",
    top: 6,
    right: 8,
  },
  sparkleBottom: {
    position: "absolute",
    bottom: 8,
    left: 6,
  },
});
