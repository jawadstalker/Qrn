import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import * as THREE from "three";
import { createSunScene } from "@/features/quran/utils/sunScene";

interface Sun3DProps {
  size: number;
  reducedMotion: boolean;
  onFailure: () => void;
}

export function Sun3D({ size, reducedMotion, onFailure }: Sun3DProps) {
  const frameRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(
    () => () => {
      stoppedRef.current = true;
      cancelAnimationFrame(frameRef.current);
    },
    [],
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

        const sun = createSunScene();
        const startedAt = Date.now();
        let checked = false;

        const render = () => {
          if (stoppedRef.current) {
            sun.dispose();
            renderer.dispose();
            return;
          }

          // Freeze on a pleasant frame when motion is reduced.
          const seconds = reducedMotion ? 4 : (Date.now() - startedAt) / 1000;

          sun.update(seconds);
          renderer.render(sun.scene, sun.camera);
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
              console.error("[QURAN] sun shader failed, using the flat sun");
              onFailure();
              return;
            }
          }

          if (!reducedMotion) {
            frameRef.current = requestAnimationFrame(render);
          }
        };

        render();
      } catch (error) {
        console.error("[QURAN] 3D sun failed, using the flat sun:", error);
        onFailure();
      }
    },
    [onFailure, reducedMotion],
  );

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={handleContextCreate}
      />
    </View>
  );
}
