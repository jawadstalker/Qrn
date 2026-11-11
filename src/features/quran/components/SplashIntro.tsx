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
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { createGLRenderer } from "@/features/quran/utils/glRenderer";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AppText } from "@/shared/components/ui/AppText";
import {
  COVER_MARK_ASPECT,
  QuranCoverMark,
} from "@/features/quran/components/QuranCoverMark";
import { OPEN_FROM_RIGHT, USE_3D_SPLASH } from "@/features/quran/config";
import {
  FLATTEN_END,
  GL_FADE_END,
  GL_FADE_START,
  SPLASH_SECONDS,
  coverWidthShare,
  createSplashScene,
} from "@/features/quran/utils/splashScene";

/** Deep ink green, so the green-and-gold Quran stands out. Same as the native splash (app.json). */
const BACKGROUND = "#0C1A16";
/**
 * 3D -> 2D hand-over. The book has closed and flattened: from FLATTEN_END the camera is face-on and
 * orthographic, and the flat cover logo (QuranCoverMark) sits exactly over the 3D cover at the same
 * size. Same leather, same gold tooling, so the swap is invisible: the logo fades in over the 3D
 * cover and only when it is opaque does the 3D one fade out underneath it.
 * After that a glint sweeps across the gold and the title arrives.
 */
const COVER_FADE_START = FLATTEN_END - 0.2;
const COVER_FADE_END = FLATTEN_END + 0.2;
const TITLE_START = GL_FADE_END + 0.0;
const TITLE_END = GL_FADE_END + 0.45;
const GLINT_START = GL_FADE_END + 0.05;
const GLINT_END = GL_FADE_END + 0.75;
const BURST_START = GL_FADE_START - 0.15;
/** The overlay itself fades out over the last quarter second. */
const OVERLAY_FADE_START = SPLASH_SECONDS - 0.25;
/** Where the clock starts when the 3D part is skipped (reduced motion or no WebGL). */
const LOGO_ONLY_START = FLATTEN_END - 0.3;
const LOGO_ONLY_HOLD_SECONDS = SPLASH_SECONDS - LOGO_ONLY_START;
/**
 * The 3D cover measures a hair narrower on screen than its flat grid (edge thickness,
 * perspective), so the flat logo is scaled to match.
 */
const MARK_MATCH = 1.002;

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
  // The flat logo is laid exactly over the final 3D frame: same center, same width.
  const markWidth = width * coverWidthShare(width / height) * MARK_MATCH;
  const markHeight = markWidth / COVER_MARK_ASPECT;
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
  const coverStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      clock.value,
      [COVER_FADE_START, COVER_FADE_END],
      [0, 1],
      "clamp",
    ),
  }));
  // Cover-shaped echoes ripple outward from the logo, and a warm halo breathes behind it.
  const useEcho = (delay: number, grow: number) =>
    useAnimatedStyle(() => {
      const p = interpolate(
        clock.value,
        [BURST_START + delay, BURST_START + delay + 1.1],
        [0, 1],
        "clamp",
      );

      return {
        opacity: p <= 0 || p >= 1 ? 0 : 0.5 * Math.pow(1 - p, 1.5),
        transform: [{ scale: 1 + grow * (1 - Math.pow(1 - p, 3)) }],
      };
    });
  const echoA = useEcho(0, 0.32);
  const echoB = useEcho(0.18, 0.55);
  const haloStyle = useAnimatedStyle(() => {
    const p = interpolate(
      clock.value,
      [BURST_START, SPLASH_SECONDS - 0.2],
      [0, 1],
      "clamp",
    );

    return {
      opacity: 0.85 * Math.sin(Math.PI * Math.pow(p, 0.7)),
      transform: [{ scale: 0.8 + 0.5 * p }],
    };
  });
  // After the hand-over the logo breathes a little.
  const breatheStyle = useAnimatedStyle(() => {
    const p = interpolate(
      clock.value,
      [GL_FADE_END, SPLASH_SECONDS - 0.2],
      [0, 1],
      "clamp",
    );

    return { transform: [{ scale: 1 + 0.02 * Math.sin(Math.PI * p) }] };
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
            style={[StyleSheet.absoluteFill, mirror, glStyle]}
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

        <Animated.View
          pointerEvents="none"
          style={[
            styles.centered,
            {
              width: markWidth * 2.2,
              height: markWidth * 2.2,
              marginTop: -markWidth * 1.1,
              marginLeft: -markWidth * 1.1,
            },
            haloStyle,
          ]}
        >
          <Svg width={markWidth * 2.2} height={markWidth * 2.2}>
            <Defs>
              <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#F2D27A" stopOpacity="0.55" />
                <Stop offset="0.45" stopColor="#D9B864" stopOpacity="0.18" />
                <Stop offset="1" stopColor="#D9B864" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#halo)" />
          </Svg>
        </Animated.View>

        {[echoA, echoB].map((style, index) => (
          <Animated.View
            key={index}
            pointerEvents="none"
            style={[
              styles.centered,
              styles.echo,
              {
                width: markWidth,
                height: markHeight,
                marginTop: -markHeight / 2,
                marginLeft: -markWidth / 2,
              },
              style,
            ]}
          />
        ))}

        {/* The flat logo (the closed cover): fades in over the 3D cover, in the same place */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centered,
            {
              width: markWidth,
              height: markHeight,
              marginTop: -markHeight / 2,
              marginLeft: -markWidth / 2,
            },
            coverStyle,
          ]}
        >
          <Animated.View style={breatheStyle}>
            <QuranCoverMark width={markWidth} spineRight={OPEN_FROM_RIGHT} />
          </Animated.View>
        </Animated.View>

        {SkiaFinish ? (
          <FinishBoundary fallback={null}>
            <SkiaFinish
              clock={clock}
              width={width}
              height={height}
              markWidth={markWidth}
              mirrored={OPEN_FROM_RIGHT}
              times={{
                glintStart: GLINT_START,
                glintEnd: GLINT_END,
                burstStart: BURST_START,
              }}
            />
          </FinishBoundary>
        ) : null}

        <Animated.View
          style={[StyleSheet.absoluteFill, titleStyle]}
          pointerEvents="none"
        >
          <View style={[styles.rule, { top: height / 2 + markHeight / 2 + 22 }]} />
          <AppText
            variant="h2"
            forcePersian
            style={[styles.title, { top: height / 2 + markHeight / 2 + 34 }]}
          >
            باغ حفظ قرآن
          </AppText>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const GLOW = 360;
/**
 * The 3D book is built with its spine on the left (like a Latin book). A Quran has its spine on the
 * right, so only the 3D layer is flipped: the cover then opens from the right. Its printed
 * textures are flipped back inside splashScene.ts, so the writing is not reversed. The flat cover
 * that replaces the 3D book at the end is drawn with the spine on the right instead of being flipped.
 */
const mirror = OPEN_FROM_RIGHT ? { transform: [{ scaleX: -1 }] } : undefined;

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
    textShadowColor: "rgba(242, 210, 122, 0.55)",
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  echo: {
    borderWidth: 1.5,
    borderColor: "#E8C877",
    borderRadius: 4,
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
