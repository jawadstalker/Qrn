import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useAudioPlayer } from "expo-audio";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { createGLRenderer } from "@/features/quran/utils/glRenderer";
import Animated, {
  Easing,
  type SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AppText } from "@/shared/components/ui/AppText";
import { STAR } from "@/features/quran/components/QuranLogo";
import {
  QuranBookMark,
  type BookLayer,
} from "@/features/quran/components/QuranBookMark";
import { USE_3D_SPLASH } from "@/features/quran/config";
import { BOOK_ASPECT, BOOK_COLORS } from "@/features/quran/utils/bookMark";
import {
  FINAL_WIDTH_SHARE,
  FLATTEN_END,
  GL_FADE_END,
  GL_FADE_START,
  SPLASH_SECONDS,
  createSplashScene,
} from "@/features/quran/utils/splashScene";

/** Deep ink green, so the green-and-gold Quran stands out. Same as the native splash (app.json). */
const BACKGROUND = "#0C1A16";
/**
 * 3D -> 2D hand-over. From FLAT_START the camera is face-on, and the flat book (QuranBookMark)
 * sits exactly over the 3D one at the same size. Its layers fade in one at a time, so it looks
 * like the 3D details are flattening in place: leather cover, paper, gold frames, then the text.
 * Only when the flat book is fully opaque does the 3D one fade out underneath it.
 * After that the finishing touches arrive: the star behind the book, a sprout from the spine
 * and the title.
 */
const FLAT_LAYERS: readonly { layer: BookLayer; from: number; to: number }[] = [
  // Leather border, spine and bands (a frame with the pages cut out, so it hides nothing).
  { layer: "cover", from: FLATTEN_END - 0.25, to: FLATTEN_END + 0.15 },
  // Paper, gold frames and text arrive together over the already flat 3D book. The text only
  // lags slightly, so the 3D text never fades out alone.
  { layer: "pages", from: FLATTEN_END - 0.15, to: FLATTEN_END + 0.25 },
  { layer: "frame", from: FLATTEN_END - 0.15, to: FLATTEN_END + 0.25 },
  { layer: "text", from: FLATTEN_END - 0.15, to: FLATTEN_END + 0.3 },
];
const STAR_START = 4.4;
const STAR_END = 5.1;
const SPROUT_START = 4.7;
const SPROUT_END = 5.2;
const TITLE_START = 4.85;
const TITLE_END = 5.3;
/** The text lines write themselves (Skia), and a glint then sweeps over the finished book. */
const TEXT_START = 4.3;
const TEXT_END = 5.0;
const GLINT_START = 5.0;
const GLINT_END = 5.45;
const PULSE_START = 4.4;
const PULSE_END = 5.4;
/** The overlay itself fades out over the last quarter second. */
const OVERLAY_FADE_START = SPLASH_SECONDS - 0.25;
/** Where the clock starts when the 3D part is skipped (reduced motion or no WebGL). */
const LOGO_ONLY_START = FLATTEN_END - 0.3;
const LOGO_ONLY_HOLD_SECONDS = SPLASH_SECONDS - LOGO_ONLY_START;
/** The star is a little wider than the book, so its points show above, below and at the sides. */
const STAR_SCALE = 1.18;
/** Sprout height as a share of the book width. */
const SPROUT_SCALE = 0.2;

// Whoosh, cover thump, page turns and a soft chime, synthesized to match the timeline.
const SPLASH_SOUND =
  require("../../../../assets/sounds/splash/splash.wav") as number;

interface SplashIntroProps {
  onDone: () => void;
  /**
   * Called once the splash no longer needs the GPU/JS thread for the 3D book (it faded out, or
   * it was never started). The app uses it to start its own 3D scenes only after that point.
   */
  onGlReleased?: () => void;
}

/**
 * The GPU finish (SplashFinish) needs @shopify/react-native-skia. If the native module is not in
 * this build, or fails while drawing, the splash falls back to the plain SVG version of the same
 * finish, so the intro can never break.
 */
type FinishComponent = typeof import("@/features/quran/components/SplashFinish").SplashFinish;

let SkiaFinish: FinishComponent | null = null;

if (Platform.OS !== "web") {
  try {
    SkiaFinish = (
      require("@/features/quran/components/SplashFinish") as {
        SplashFinish: FinishComponent;
      }
    ).SplashFinish;
  } catch (error) {
    console.warn("[SPLASH] Skia is not available, using the SVG finish:", error);
  }
}

class FinishBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[SPLASH] Skia finish failed, using the SVG finish:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FlatLayer({
  clock,
  layer,
  from,
  to,
  bookWidth,
}: {
  clock: SharedValue<number>;
  layer: BookLayer;
  from: number;
  to: number;
  bookWidth: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(clock.value, [from, to], [0, 1], "clamp"),
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <QuranBookMark width={bookWidth} layers={[layer]} />
    </Animated.View>
  );
}

export function SplashIntro({ onDone, onGlReleased }: SplashIntroProps) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [glActive, setGlActive] = useState(USE_3D_SPLASH && !reduced);
  const clock = useSharedValue(0);
  const doneRef = useRef(false);
  const startedRef = useRef(false);
  const frameRef = useRef(0);
  const stoppedRef = useRef(false);
  const releasedRef = useRef(false);
  const onGlReleasedRef = useRef(onGlReleased);

  onGlReleasedRef.current = onGlReleased;
  // The flat book is laid exactly over the final 3D frame: same center, same width. The 3D
  // book measures about 1% narrower on screen than its flat grid (edge thickness, perspective).
  const bookWidth = width * FINAL_WIDTH_SHARE * 0.992;
  const bookHeight = bookWidth / BOOK_ASPECT;
  const starSize = bookWidth * STAR_SCALE;
  const sproutHeight = bookWidth * SPROUT_SCALE;
  // Half size of the book in the star's own 240 grid.
  const starBookHalfW = bookWidth / 2 / (starSize / 240);
  const starBookHalfH = bookHeight / 2 / (starSize / 240);
  const player = useAudioPlayer(SPLASH_SOUND);

  // Browsers refuse to start audio without a tap and reject play() asynchronously, so the
  // promise is handled too. The intro simply runs silent in that case.
  const playSound = useCallback(() => {
    // Web browsers block audio before a tap, and expo-audio cannot catch that rejection.
    if (Platform.OS === "web") {
      return;
    }

    const ignore = () => undefined;

    try {
      Promise.resolve(player.seekTo(0)).catch(ignore);
      Promise.resolve(player.play()).catch(ignore);
    } catch {
      // Sound is a bonus; never block the intro on it.
    }
  }, [player]);
  const stopSound = useCallback(() => {
    try {
      player.pause();
    } catch {
      // ignore
    }
  }, [player]);

  const release = useCallback(() => {
    if (!releasedRef.current) {
      releasedRef.current = true;
      onGlReleasedRef.current?.();
    }
  }, []);

  const finish = useCallback(() => {
    if (!doneRef.current) {
      doneRef.current = true;
      stopSound();
      onDone();
    }
  }, [onDone, stopSound]);

  const runTimeline = useCallback(
    (from: number, seconds: number) => {
      clock.value = from;
      clock.value = withTiming(
        SPLASH_SECONDS,
        { duration: seconds * 1000, easing: Easing.linear },
        (finished) => {
          if (finished) {
            runOnJS(finish)();
          }
        },
      );
    },
    [clock, finish],
  );

  // Without the 3D part, start straight on the logo and hold it briefly.
  const runLogoOnly = useCallback(() => {
    setGlActive(false);
    release();
    runTimeline(LOGO_ONLY_START, LOGO_ONLY_HOLD_SECONDS);
  }, [release, runTimeline]);

  useEffect(() => {
    if (!glActive && !startedRef.current) {
      startedRef.current = true;
      runLogoOnly();
    }
  }, [glActive, runLogoOnly]);

  useEffect(
    () => () => {
      stoppedRef.current = true;
      cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  // Free the GL context as soon as the 3D book has faded out.
  useAnimatedReaction(
    () => clock.value > GL_FADE_END + 0.05,
    (past, previous) => {
      if (past && !previous) {
        runOnJS(setGlActive)(false);
        runOnJS(release)();
      }
    },
  );

  const handleContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      try {
        const { renderer, width: bufferWidth, height: bufferHeight } =
          createGLRenderer(gl, { premultipliedAlpha: true });

        const buildStartedAt = Date.now();
        const splash = createSplashScene(
          bufferWidth / bufferHeight,
          bufferHeight,
        );

        // Compile every shader now, before the clocks start. Otherwise the pages' materials
        // compile in the middle of the animation, right when the cover opens, and it stutters.
        try {
          renderer.compile(splash.scene, splash.camera);
        } catch {
          // The first render compiles whatever is missing.
        }

        if (__DEV__) {
          console.log(
            `[SPLASH] scene built and shaders compiled in ${Date.now() - buildStartedAt} ms`,
          );
        }

        const startedAt = Date.now();
        let checked = false;

        startedRef.current = true;
        playSound();
        runTimeline(0, SPLASH_SECONDS);

        const render = () => {
          const seconds = (Date.now() - startedAt) / 1000;

          if (stoppedRef.current || seconds > GL_FADE_END + 0.1) {
            splash.dispose();
            renderer.dispose();

            return;
          }

          splash.update(seconds);
          renderer.render(splash.scene, splash.camera);
          gl.endFrameEXP();

          if (!checked) {
            checked = true;

            // Shader compile errors do not throw in three.js; detect them here.
            const programs = (
              renderer.info as unknown as {
                programs?: { diagnostics?: { runnable?: boolean } }[];
              }
            ).programs;

            if (
              programs?.some(
                (program) => program.diagnostics?.runnable === false,
              )
            ) {
              console.error("[SPLASH] shader failed, showing the flat logo");
              splash.dispose();
              renderer.dispose();
              runLogoOnly();

              return;
            }
          }

          frameRef.current = requestAnimationFrame(render);
        };

        render();
      } catch (error) {
        console.error(
          "[SPLASH] 3D intro failed, showing the flat logo:",
          error,
        );
        runLogoOnly();
      }
    },
    [playSound, runLogoOnly, runTimeline],
  );

  const skip = useCallback(() => {
    stopSound();
    clock.value = withTiming(
      SPLASH_SECONDS,
      { duration: 280, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) {
          runOnJS(finish)();
        }
      },
    );
  }, [clock, finish, stopSound]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      clock.value,
      [OVERLAY_FADE_START, SPLASH_SECONDS],
      [1, 0],
      "clamp",
    ),
  }));
  const glStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      clock.value,
      [GL_FADE_START, GL_FADE_END],
      [1, 0],
      "clamp",
    ),
  }));
  const starStyle = useAnimatedStyle(() => {
    const p = interpolate(clock.value, [STAR_START, STAR_END], [0, 1], "clamp");

    return {
      opacity: p,
      transform: [{ scale: 0.86 + 0.14 * (1 - Math.pow(1 - p, 3)) }],
    };
  });
  const sproutStyle = useAnimatedStyle(() => {
    const p = interpolate(
      clock.value,
      [SPROUT_START, SPROUT_END],
      [0, 1],
      "clamp",
    );
    // Grows upward out of the spine (scales from its bottom edge) with a small overshoot.
    const grow = 1 - Math.pow(1 - p, 3) + 0.06 * Math.sin(Math.PI * p) * p;

    return {
      opacity: Math.min(p * 3, 1),
      transform: [
        { translateY: (sproutHeight / 2) * (1 - grow) },
        { scaleY: grow },
      ],
    };
  });
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(clock.value, [TITLE_START, TITLE_END], [0, 1], "clamp"),
    transform: [
      {
        translateY: interpolate(
          clock.value,
          [TITLE_START, TITLE_END],
          [6, 0],
          "clamp",
        ),
      },
    ],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      clock.value,
      [PULSE_START, PULSE_START + 0.15, PULSE_END],
      [0, 0.28, 0],
      "clamp",
    ),
    transform: [
      {
        scale: interpolate(clock.value, [PULSE_START, PULSE_END], [1, 1.5], "clamp"),
      },
    ],
  }));

  // Layers of the flat book. With Skia the text writes itself on instead of fading in.
  const flatLayers = SkiaFinish
    ? FLAT_LAYERS.filter((item) => item.layer !== "text")
    : FLAT_LAYERS;
  const svgFinish = (
    <>
        {/* The 2D star, behind the book */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centered,
            {
              width: starSize,
              height: starSize,
              marginTop: -starSize / 2,
              marginLeft: -starSize / 2,
            },
            starStyle,
          ]}
        >
          <Svg width={starSize} height={starSize} viewBox="0 0 240 240">
            <Defs>
              {/* Everything except the book: the star's edges inside the book stay hidden */}
              <ClipPath id="outside-book">
                <Path
                  clipRule="evenodd"
                  d={`M-10 -10H250V250H-10Z M${120 - starBookHalfW} ${120 - starBookHalfH}h${starBookHalfW * 2}v${starBookHalfH * 2}h${-starBookHalfW * 2}Z`}
                />
              </ClipPath>
            </Defs>
            <G clipPath="url(#outside-book)">
              <Polygon
                points={STAR}
                fill="none"
                stroke={BOOK_COLORS.gold}
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeOpacity={0.85}
              />
            </G>
          </Svg>
        </Animated.View>


        {/* A sprout grows out of the spine */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centered,
            {
              width: sproutHeight * 0.7,
              height: sproutHeight,
              // The spine is a hair left of the book's center (97 of 200 units).
              marginLeft: -(sproutHeight * 0.7) / 2 - bookWidth * 0.015,
              marginTop: -bookHeight / 2 - sproutHeight + 1,
            },
            sproutStyle,
          ]}
        >
          <Svg
            width={sproutHeight * 0.7}
            height={sproutHeight}
            viewBox="0 0 70 100"
          >
            <Path
              d="M34 100 C34 80 35 62 35 44 L36 44 C36 62 37 80 37 100 Z"
              fill={BOOK_COLORS.gold}
            />
            <Path
              d="M35.5 60 C20 62 6 52 2 30 C20 28 33 40 35.5 60 Z"
              fill={BOOK_COLORS.gold}
            />
            <Path
              d="M35.5 44 C50 46 63 36 67 14 C50 12 38 24 35.5 44 Z"
              fill={BOOK_COLORS.gold}
            />
            <Ellipse cx={35.5} cy={43} rx={2} ry={2.6} fill={BOOK_COLORS.gold} />
          </Svg>
        </Animated.View>

      {SkiaFinish ? (
        <View
          pointerEvents="none"
          style={[
            styles.centered,
            {
              width: bookWidth,
              height: bookHeight,
              marginTop: -bookHeight / 2,
              marginLeft: -bookWidth / 2,
            },
          ]}
        >
          <FlatLayer
            clock={clock}
            bookWidth={bookWidth}
            layer="text"
            from={FLATTEN_END - 0.15}
            to={FLATTEN_END + 0.3}
          />
        </View>
      ) : null}
    </>
  );

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
        onPress={skip}
        style={StyleSheet.absoluteFill}
      >
        <View style={styles.glowOuter} pointerEvents="none" />
        <View style={styles.glowInner} pointerEvents="none" />

        {glActive ? (
          <Animated.View
            style={[StyleSheet.absoluteFill, glStyle]}
            pointerEvents="none"
          >
            <GLView
              style={StyleSheet.absoluteFill}
              onContextCreate={handleContextCreate}
            />
          </Animated.View>
        ) : null}

        <Svg
          style={StyleSheet.absoluteFill}
          width={width}
          height={height}
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient id="vignette" cx="50%" cy="50%" r="75%">
              <Stop offset="0.45" stopColor="#000" stopOpacity="0" />
              <Stop offset="1" stopColor="#000" stopOpacity="0.5" />
            </RadialGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill="url(#vignette)"
          />
        </Svg>

        {/* A ghost of the book expands outward when it lands */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centered,
            {
              width: bookWidth,
              height: bookHeight,
              marginTop: -bookHeight / 2,
              marginLeft: -bookWidth / 2,
            },
            ringStyle,
          ]}
        >
          <QuranBookMark width={bookWidth} layers={["frame"]} />
        </Animated.View>

        {/* The flat book: its layers fade in over the 3D book, in the same place */}
        <View
          pointerEvents="none"
          style={[
            styles.centered,
            {
              width: bookWidth,
              height: bookHeight,
              marginTop: -bookHeight / 2,
              marginLeft: -bookWidth / 2,
            },
          ]}
        >
          {flatLayers.map((item) => (
            <FlatLayer
              key={item.layer}
              clock={clock}
              bookWidth={bookWidth}
              {...item}
            />
          ))}
        </View>

        {SkiaFinish ? (
          <FinishBoundary fallback={svgFinish}>
            <SkiaFinish
              clock={clock}
              width={width}
              height={height}
              bookWidth={bookWidth}
              starSize={starSize}
              sproutHeight={sproutHeight}
              times={{
                textStart: TEXT_START,
                textEnd: TEXT_END,
                starStart: STAR_START,
                starEnd: STAR_END,
                sproutStart: SPROUT_START,
                sproutEnd: SPROUT_END,
                glintStart: GLINT_START,
                glintEnd: GLINT_END,
              }}
            />
          </FinishBoundary>
        ) : (
          svgFinish
        )}

        <Animated.View
          style={[StyleSheet.absoluteFill, titleStyle]}
          pointerEvents="none"
        >
          <View style={[styles.rule, { top: height / 2 + starSize / 2 + 8 }]} />
          <AppText
            variant="h2"
            forcePersian
            style={[styles.title, { top: height / 2 + starSize / 2 + 20 }]}
          >
            باغ حفظ قرآن
          </AppText>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const GLOW = 360;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKGROUND,
    zIndex: 1000,
    elevation: 1000,
  },
  glowOuter: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -GLOW / 2,
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    backgroundColor: "#1F5A43",
    opacity: 0.32,
  },
  glowInner: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -GLOW / 3,
    width: (GLOW * 2) / 3,
    height: (GLOW * 2) / 3,
    borderRadius: GLOW / 3,
    backgroundColor: "#2C7557",
    opacity: 0.24,
  },
  centered: {
    position: "absolute",
    top: "50%",
    left: "50%",
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    color: "#FBF3DC",
    textAlign: "center",
    fontWeight: "600",
  },
  rule: {
    position: "absolute",
    alignSelf: "center",
    width: 36,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#D9B864",
  },
});
