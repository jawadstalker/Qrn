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
import * as THREE from "three";
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
import { QuranLogo } from "@/features/quran/components/QuranLogo";
import { USE_3D_SPLASH } from "@/features/quran/config";
import {
  GL_FADE_END,
  GL_FADE_START,
  SPLASH_SECONDS,
  createSplashScene,
} from "@/features/quran/utils/splashScene";

/** Deep ink green, so the green-and-gold Quran stands out. Same as the native splash (app.json). */
const BACKGROUND = "#0C1A16";
const LOGO_FADE_START = 3.75;
const LOGO_FADE_END = 4.4;
/** The overlay itself fades out over the last quarter second of the 5 seconds. */
const OVERLAY_FADE_START = SPLASH_SECONDS - 0.25;
/** Where the clock starts when the 3D part is skipped (reduced motion or no WebGL). */
const LOGO_ONLY_START = LOGO_FADE_START - 0.15;
const LOGO_ONLY_HOLD_SECONDS = 1.6;

// Whoosh, cover thump, page turns and a soft chime, synthesized to match the timeline.
const SPLASH_SOUND =
  require("../../../../assets/sounds/splash/splash.wav") as number;

interface SplashIntroProps {
  onDone: () => void;
}

export function SplashIntro({ onDone }: SplashIntroProps) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [glActive, setGlActive] = useState(USE_3D_SPLASH && !reduced);
  const clock = useSharedValue(0);
  const doneRef = useRef(false);
  const startedRef = useRef(false);
  const frameRef = useRef(0);
  const stoppedRef = useRef(false);
  const logoSize = Math.min(width * 0.74, 320);
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
    runTimeline(LOGO_ONLY_START, LOGO_ONLY_HOLD_SECONDS);
  }, [runTimeline]);

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
      }
    },
  );

  const handleContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      try {
        const bufferWidth = gl.drawingBufferWidth;
        const bufferHeight = gl.drawingBufferHeight;
        const canvas = {
          width: bufferWidth,
          height: bufferHeight,
          clientWidth: bufferWidth,
          clientHeight: bufferHeight,
          style: {},
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          getContext: () => gl,
        } as unknown as HTMLCanvasElement;
        const renderer = new THREE.WebGLRenderer({
          canvas,
          context: gl as unknown as WebGLRenderingContext,
          antialias: true,
          alpha: true,
          premultipliedAlpha: true,
        });

        renderer.setPixelRatio(1);
        renderer.setSize(bufferWidth, bufferHeight, false);
        renderer.setClearColor(0x000000, 0);

        const splash = createSplashScene(
          bufferWidth / bufferHeight,
          bufferHeight,
        );
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
  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      clock.value,
      [LOGO_FADE_START, LOGO_FADE_END],
      [0, 1],
      "clamp",
    ),
    transform: [
      {
        scale: interpolate(
          clock.value,
          [LOGO_FADE_START, LOGO_FADE_END, 4.62, 4.9],
          [0.9, 1, 1.045, 1],
          "clamp",
        ),
      },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(clock.value, [4.1, 4.25, 4.95], [0, 0.75, 0], "clamp"),
    transform: [
      { scale: interpolate(clock.value, [4.1, 4.95], [0.92, 1.75], "clamp") },
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

        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize / 2,
              marginTop: -logoSize / 2,
              marginLeft: -logoSize / 2,
            },
            ringStyle,
          ]}
        />

        <Animated.View style={[styles.logo, logoStyle]} pointerEvents="none">
          <QuranLogo size={logoSize} />
          <AppText
            variant="h2"
            forcePersian
            style={[styles.title, { top: height / 2 + logoSize / 2 + 6 }]}
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
  ring: {
    position: "absolute",
    top: "50%",
    left: "50%",
    borderWidth: 3,
    borderColor: "#E8C872",
  },
  logo: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    color: "#FBF3DC",
    textAlign: "center",
    fontWeight: "800",
  },
});
