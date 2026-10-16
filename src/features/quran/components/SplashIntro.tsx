import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
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

/** Same green as the native splash (app.json), so the hand-off has no flash. */
const BACKGROUND = "#2F6B4F";
const LOGO_FADE_START = 3.75;
const LOGO_FADE_END = 4.4;
/** The overlay itself fades out over the last quarter second of the 5 seconds. */
const OVERLAY_FADE_START = SPLASH_SECONDS - 0.25;
/** Where the clock starts when the 3D part is skipped (reduced motion or no WebGL). */
const LOGO_ONLY_START = LOGO_FADE_START - 0.15;
const LOGO_ONLY_HOLD_SECONDS = 1.6;

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

  const finish = useCallback(() => {
    if (!doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  }, [onDone]);

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
    [runLogoOnly, runTimeline],
  );

  const skip = useCallback(() => {
    clock.value = withTiming(
      SPLASH_SECONDS,
      { duration: 280, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) {
          runOnJS(finish)();
        }
      },
    );
  }, [clock, finish]);

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
          [LOGO_FADE_START, LOGO_FADE_END + 0.2],
          [0.9, 1],
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
            style={[StyleSheet.absoluteFill, glStyle]}
            pointerEvents="none"
          >
            <GLView
              style={StyleSheet.absoluteFill}
              onContextCreate={handleContextCreate}
            />
          </Animated.View>
        ) : null}

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
    backgroundColor: "#3E8A63",
    opacity: 0.25,
  },
  glowInner: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -GLOW / 3,
    width: (GLOW * 2) / 3,
    height: (GLOW * 2) / 3,
    borderRadius: GLOW / 3,
    backgroundColor: "#4C9C73",
    opacity: 0.22,
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
