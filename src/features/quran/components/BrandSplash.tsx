import React, { useEffect, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import Animated, {
  Easing,
  Extrapolation,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/* ================================================================
   COLORS
   Same family as the Quran intro (SplashIntro): ink green + gold + cream.
   BG_BASE must stay equal to SplashIntro's BACKGROUND so the hand-over is seamless.
================================================================ */

const COLORS = {
  bgTop: "#1B3D2F",
  bg: "#14291F",
  bgMiddle: "#0F1F18",
  bgBottom: "#0C1A16", // = SplashIntro BACKGROUND (and app.json splash color)
  fg: "#FBF3DC", // cream, same as the Quran title
  muted: "#A9BBAF",
  accent: "#D9B864", // Quran gold
  accentHi: "#F3E6BC",
  accentSoft: "#B8963F",
  star: "#F3E3B0",
  glow: "#2C7557",
};

/* ================================================================
   TEXT (editable)
================================================================ */

const BRAND_WORD = "Neurolia";
const BRAND_TAGLINE = "Mind, beautifully calibrated.";

/* ================================================================
   TIMING (ms) — second brand only, starts when the Quran intro ends

   0     background fades in, butterflies start drifting
   120   logo springs in
   280   letters spring in
   1000  tagline
   2900  complete (last 300ms fade out into the app)
================================================================ */

const TIMING = {
  LOGO_DELAY: 120,
  WORD_DELAY: 280,
  WORD_STAGGER: 60,
  LINE_DELAY: 860,
  TAGLINE_DELAY: 1000,
  SWEEP_DELAY: 700,
  COMPLETE: 2900,
  FADE_OUT: 300,
};

const EASE_ENTER = Easing.bezier(0.22, 1, 0.36, 1);

const SPRING = {
  damping: 7,
  stiffness: 170,
  mass: 0.75,
};

/* ================================================================
   SPARKS
================================================================ */

type SparkConfig = {
  top?: `${number}%`;
  bottom?: `${number}%`;
  left?: `${number}%`;
  right?: `${number}%`;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

const SPARKS: SparkConfig[] = [
  { top: "20%", left: "17%", size: 15, delay: 150, duration: 2600, opacity: 0.5 },
  { top: "29%", right: "16%", size: 10, delay: 450, duration: 2900, opacity: 0.4 },
  { bottom: "27%", left: "23%", size: 12, delay: 600, duration: 2500, opacity: 0.44 },
  { bottom: "23%", right: "20%", size: 14, delay: 350, duration: 2800, opacity: 0.48 },
  { top: "49%", left: "9%", size: 9, delay: 700, duration: 3100, opacity: 0.34 },
  { top: "39%", right: "8%", size: 7, delay: 850, duration: 3200, opacity: 0.3 },
  { top: "12%", left: "52%", size: 8, delay: 250, duration: 2700, opacity: 0.38 },
  { top: "60%", right: "12%", size: 11, delay: 800, duration: 2600, opacity: 0.4 },
  { bottom: "14%", left: "14%", size: 8, delay: 950, duration: 3000, opacity: 0.32 },
  { bottom: "10%", right: "44%", size: 10, delay: 500, duration: 2900, opacity: 0.36 },
  { top: "70%", left: "40%", size: 6, delay: 1000, duration: 2800, opacity: 0.3 },
  { top: "8%", right: "28%", size: 6, delay: 900, duration: 3100, opacity: 0.28 },
];

/* ================================================================
   GRADIENT (react-native-svg, so no extra native dependency is needed)
================================================================ */

type GradientStop = readonly [offset: number, color: string, opacity?: number];

let gradientCounter = 0;

function Gradient({
  stops,
  x1 = 0.5,
  y1 = 0,
  x2 = 0.5,
  y2 = 1,
  style,
}: {
  stops: readonly GradientStop[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [id] = useState(() => `brand-gradient-${++gradientCounter}`);

  return (
    <Svg
      style={style}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Defs>
        <SvgLinearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
          {stops.map(([offset, color, opacity]) => (
            <Stop
              key={`${offset}-${color}`}
              offset={offset}
              stopColor={color}
              stopOpacity={opacity ?? 1}
            />
          ))}
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/* ================================================================
   REVEAL — spring / timing entrance
================================================================ */

function Reveal({
  children,
  delay,
  d,
  y = 36,
  fromScale = 0.8,
  fromRotate = 0,
  spring = true,
  duration = 600,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  d: number;
  y?: number;
  fromScale?: number;
  fromRotate?: number;
  spring?: boolean;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay * d,
      spring
        ? withSpring(1, SPRING)
        : withTiming(1, { duration: duration * d, easing: EASE_ENTER }),
    );
  }, [delay, d, spring, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.4, 1],
      [0, 0.85, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [y, 0]) },
      { scale: interpolate(progress.value, [0, 1], [fromScale, 1]) },
      {
        rotate: `${interpolate(progress.value, [0, 1], [fromRotate, 0])}deg`,
      },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/* ================================================================
   WORDMARK
================================================================ */

function Wordmark({
  word,
  baseDelay,
  stagger,
  d,
  letterStyle,
  containerStyle,
}: {
  word: string;
  baseDelay: number;
  stagger: number;
  d: number;
  letterStyle: StyleProp<TextStyle>;
  containerStyle: StyleProp<ViewStyle>;
}) {
  return (
    <View style={containerStyle}>
      {word.split("").map((letter, index) => (
        <Reveal
          key={`${letter}-${index}`}
          delay={baseDelay + index * stagger}
          d={d}
          y={46}
          fromScale={0.5}
        >
          <Text style={letterStyle}>{letter}</Text>
        </Reveal>
      ))}
    </View>
  );
}

/* ================================================================
   SPARKLE
================================================================ */

function Sparkle({ config }: { config: SparkConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: config.duration * 0.7,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: config.duration * 0.7,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [config, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, config.opacity, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [18, -34]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.5, 1.35, 0.5]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-60, 60])}deg` },
    ],
  }));

  return (
    <Animated.Text
      style={[
        styles.spark,
        {
          top: config.top,
          bottom: config.bottom,
          left: config.left,
          right: config.right,
          fontSize: config.size,
        },
        animatedStyle,
      ]}
    >
      ✦
    </Animated.Text>
  );
}

/* ================================================================
   BUTTERFLIES
   Glowing butterflies that now and then fly a random curved path through the empty
   margins of the screen (never across the logo/text), then fade away and rest.
================================================================ */

const BUTTERFLY_COUNT = 4;
const BUTTERFLY_COLORS = ["#F3E3B0", "#D9B864", "#BFE8CF", "#FBF3DC"];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Random start, control and end point inside one of the four empty bands. */
function pickFlight(width: number, height: number) {
  const band = Math.floor(Math.random() * 4);
  const pt = (): [number, number] => {
    switch (band) {
      case 0: // top band
        return [rand(0.05, 0.95) * width, rand(0.05, 0.27) * height];
      case 1: // bottom band
        return [rand(0.05, 0.95) * width, rand(0.73, 0.93) * height];
      case 2: // left strip
        return [rand(0.03, 0.15) * width, rand(0.1, 0.9) * height];
      default: // right strip
        return [rand(0.85, 0.97) * width, rand(0.1, 0.9) * height];
    }
  };
  const [sx, sy] = pt();
  const [cx, cy] = pt();
  const [ex, ey] = pt();

  return { sx, sy, cx, cy, ex, ey, duration: rand(2800, 4600) };
}

function Butterfly({
  index,
  width,
  height,
}: {
  index: number;
  width: number;
  height: number;
}) {
  const size = React.useMemo(() => rand(20, 30), []);
  const color = BUTTERFLY_COLORS[index % BUTTERFLY_COLORS.length];
  const progress = useSharedValue(0);
  const flap = useSharedValue(0);
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const ex = useSharedValue(0);
  const ey = useSharedValue(0);
  const phase = useSharedValue(Math.random() * 6);
  const aliveRef = React.useRef(true);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyRef = React.useRef<() => void>(() => undefined);

  const rest = React.useCallback(() => {
    if (!aliveRef.current) {
      return;
    }

    timerRef.current = setTimeout(() => flyRef.current(), rand(500, 2200));
  }, []);

  flyRef.current = () => {
    if (!aliveRef.current) {
      return;
    }

    const f = pickFlight(width, height);

    sx.value = f.sx;
    sy.value = f.sy;
    cx.value = f.cx;
    cy.value = f.cy;
    ex.value = f.ex;
    ey.value = f.ey;
    phase.value = Math.random() * 6;
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: f.duration, easing: Easing.inOut(Easing.sin) },
      (finished) => {
        if (finished) {
          runOnJS(rest)();
        }
      },
    );
  };

  useEffect(() => {
    aliveRef.current = true;
    flap.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 150, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    timerRef.current = setTimeout(() => flyRef.current(), rand(300, 2600));

    return () => {
      aliveRef.current = false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [flap]);

  const moveStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const u = 1 - t;
    const wobble = Math.sin(t * 22 + phase.value) * 7;
    const x = u * u * sx.value + 2 * u * t * cx.value + t * t * ex.value + wobble;
    const y =
      u * u * sy.value +
      2 * u * t * cy.value +
      t * t * ey.value +
      Math.cos(t * 17 + phase.value) * 5;
    const dx = 2 * u * (cx.value - sx.value) + 2 * t * (ex.value - cx.value);
    const dy = 2 * u * (cy.value - sy.value) + 2 * t * (ey.value - cy.value);

    return {
      opacity: interpolate(t, [0, 0.14, 0.84, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: x - size / 2 },
        { translateY: y - size / 2 },
        { rotate: `${Math.atan2(dx, -dy)}rad` },
        { scale: interpolate(t, [0, 0.14, 0.84, 1], [0.5, 1, 1, 0.6], Extrapolation.CLAMP) },
      ],
    };
  });

  const flapStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(flap.value, [0, 1], [1, 0.22]) }],
  }));

  const glowId = `butterfly-glow-${index}`;
  const wingId = `butterfly-wing-${index}`;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.butterfly, { width: size, height: size }, moveStyle]}
    >
      {/* soft halo (does not flap) */}
      <Svg
        width={size * 3}
        height={size * 3}
        style={{ position: "absolute", left: -size, top: -size }}
        viewBox="0 0 10 10"
      >
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity="0.55" />
            <Stop offset="0.45" stopColor={color} stopOpacity="0.18" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="5" cy="5" r="5" fill={`url(#${glowId})`} />
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, flapStyle]}>
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Defs>
            <SvgLinearGradient id={wingId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="1" stopColor={color} stopOpacity="0.85" />
            </SvgLinearGradient>
          </Defs>
          {/* upper wings */}
          <Path
            d="M20 20 C 22 6, 36 2, 37 11 C 37 17, 28 20, 20 20 Z"
            fill={`url(#${wingId})`}
          />
          <Path
            d="M20 20 C 18 6, 4 2, 3 11 C 3 17, 12 20, 20 20 Z"
            fill={`url(#${wingId})`}
          />
          {/* lower wings */}
          <Path
            d="M20 21 C 27 21, 33 26, 30 33 C 26 37, 21 30, 20 21 Z"
            fill={color}
            fillOpacity={0.8}
          />
          <Path
            d="M20 21 C 13 21, 7 26, 10 33 C 14 37, 19 30, 20 21 Z"
            fill={color}
            fillOpacity={0.8}
          />
          {/* body */}
          <Rect x="19" y="10" width="2" height="22" rx="1" fill="#FFFFFF" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/* ================================================================
   LIGHT SWEEP
================================================================ */

function LightSweep({ width, delay }: { width: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-width * 0.6, width * 1.2]),
      },
      { rotate: "18deg" },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.sweep, animatedStyle]}>
      <Gradient
        x1={0}
        y1={0.5}
        x2={1}
        y2={0.5}
        style={StyleSheet.absoluteFill}
        stops={[
          [0, COLORS.accentHi, 0],
          [0.5, COLORS.accentHi, 0.14],
          [1, COLORS.accentHi, 0],
        ]}
      />
    </Animated.View>
  );
}

/* ================================================================
   BREATHING (continuous gentle scale + float)
================================================================ */

function Breathing({
  children,
  delay,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -9]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.07]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-3, 3])}deg` },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/* ================================================================
   STAGE — everything that animates. Mounted only when `active` is true,
   so all the animations start exactly when the Quran intro ends.
================================================================ */

function Stage({
  logo,
  reduceMotion,
}: {
  logo: ImageSourcePropType;
  reduceMotion: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const d = reduceMotion ? 0.001 : 1;

  const background = useSharedValue(0);
  const topLight = useSharedValue(0);

  useEffect(() => {
    background.value = withTiming(1, {
      duration: 700 * d,
      easing: Easing.out(Easing.quad),
    });

    topLight.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [d, background, topLight]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: background.value,
  }));

  const topLightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(topLight.value, [0, 1], [0.55, 1]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {/* ---------------- BACKGROUND ---------------- */}

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, backgroundStyle]}
      >
        <Gradient
          x1={0.15}
          y1={0}
          x2={0.85}
          y2={1}
          style={StyleSheet.absoluteFill}
          stops={[
            [0, COLORS.bgTop],
            [0.36, COLORS.bg],
            [0.68, COLORS.bgMiddle],
            [1, COLORS.bgBottom],
          ]}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, topLightStyle]}
      >
        <Gradient
          style={StyleSheet.absoluteFill}
          stops={[
            [0, COLORS.glow, 0.28],
            [0.38, COLORS.glow, 0.07],
            [1, COLORS.glow, 0],
          ]}
        />
      </Animated.View>

      {/* ---------------- DECORATIONS ---------------- */}

      {reduceMotion
        ? null
        : SPARKS.map((spark, index) => <Sparkle key={index} config={spark} />)}

      {/* ---------------- BUTTERFLIES ---------------- */}

      {reduceMotion
        ? null
        : Array.from({ length: BUTTERFLY_COUNT }, (_, index) => (
            <Butterfly key={index} index={index} width={width} height={height} />
          ))}

      {/* ---------------- BRAND ---------------- */}

      <View pointerEvents="none" style={styles.brandLayer}>
        <Reveal
          delay={TIMING.LOGO_DELAY}
          d={d}
          y={40}
          fromScale={0.35}
          fromRotate={16}
          style={styles.logoContainer}
        >
          {reduceMotion ? (
            <Image source={logo} resizeMode="contain" style={styles.logo} />
          ) : (
            <Breathing delay={TIMING.LOGO_DELAY + 900}>
              <Image source={logo} resizeMode="contain" style={styles.logo} />
            </Breathing>
          )}
        </Reveal>

        <Wordmark
          word={BRAND_WORD}
          baseDelay={TIMING.WORD_DELAY}
          stagger={TIMING.WORD_STAGGER}
          d={d}
          letterStyle={styles.wordLetter}
          containerStyle={styles.wordmark}
        />

        <Reveal
          delay={TIMING.LINE_DELAY}
          d={d}
          y={0}
          fromScale={0}
          spring={false}
          duration={600}
          style={styles.accentLine}
        >
          <Gradient
            x1={0}
            y1={0.5}
            x2={1}
            y2={0.5}
            style={StyleSheet.absoluteFill}
            stops={[
              [0, COLORS.accentSoft],
              [1, COLORS.accent],
            ]}
          />
        </Reveal>

        <Reveal
          delay={TIMING.TAGLINE_DELAY}
          d={d}
          y={12}
          fromScale={0.98}
          spring={false}
          duration={620}
        >
          <Text style={styles.tagline}>{BRAND_TAGLINE}</Text>
        </Reveal>
      </View>

      {reduceMotion ? null : (
        <LightSweep width={width} delay={TIMING.SWEEP_DELAY} />
      )}
    </Animated.View>
  );
}

/* ================================================================
   BRAND SPLASH
   Always mounted from app start as a plain green cover (zIndex just below SplashIntro),
   so when the Quran intro fades out there is no flash. Set `active` to true when the
   Quran intro is done and the second logo animation plays.
================================================================ */

export interface BrandSplashProps {
  /** Becomes true when the Quran intro has finished. */
  active: boolean;
  onDone: () => void;
  logo?: ImageSourcePropType;
}

export function BrandSplash({
  active,
  onDone,
  logo = require("../../../../assets/brand/logo2.png") as number,
}: BrandSplashProps) {
  const reduceMotion = useReducedMotion();
  const overlay = useSharedValue(1);
  const startedRef = React.useRef(false);

  const finish = React.useCallback(() => {
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (!active || startedRef.current) {
      return;
    }

    startedRef.current = true;

    const total = reduceMotion ? 900 : TIMING.COMPLETE;
    const fade = reduceMotion ? 200 : TIMING.FADE_OUT;

    overlay.value = withDelay(
      total - fade,
      withTiming(0, { duration: fade, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(finish)();
        }
      }),
    );
  }, [active, reduceMotion, overlay, finish]);

  const skip = React.useCallback(() => {
    overlay.value = withTiming(
      0,
      { duration: 220, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) {
          runOnJS(finish)();
        }
      },
    );
  }, [overlay, finish]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: overlay.value,
  }));

  return (
    <Animated.View
      pointerEvents={active ? "auto" : "none"}
      style={[styles.container, containerStyle]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
        onPress={skip}
        style={StyleSheet.absoluteFill}
      >
        {active ? <Stage logo={logo} reduceMotion={reduceMotion} /> : null}
      </Pressable>
    </Animated.View>
  );
}

/* ================================================================
   STYLES
================================================================ */

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgBottom,
    overflow: "hidden",
    // One below SplashIntro (1000) so the Quran intro fades out onto this screen.
    zIndex: 999,
    elevation: 999,
  },

  butterfly: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  spark: {
    position: "absolute",
    color: COLORS.star,
    fontWeight: "300",
    includeFontPadding: false,
    textShadowColor: "rgba(217,184,100,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  brandLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  logoContainer: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 116,
    height: 116,
    overflow: "hidden",
  },

  sweep: {
    position: "absolute",
    top: -80,
    bottom: -80,
    left: 0,
    width: 130,
  },

  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  wordLetter: {
    color: COLORS.fg,
    fontSize: 50,
    lineHeight: 56,
    fontWeight: "800",
    letterSpacing: -1,
    includeFontPadding: false,
  },

  accentLine: {
    width: 56,
    height: 2.5,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },

  tagline: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: 0.15,
    textAlign: "center",
    includeFontPadding: false,
    paddingHorizontal: 24,
  },
});

export default BrandSplash;