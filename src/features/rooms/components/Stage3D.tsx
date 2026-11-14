import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { createGLRenderer } from "@/features/quran/utils/glRenderer";
import {
  createStageScene,
  type StageState,
} from "@/features/rooms/utils/stageScene";

interface Stage3DProps {
  width: number;
  height: number;
  state: StageState;
  floorColor: string;
  onFailure: () => void;
}

/** The match stage: the bot's speaker and every player's 3D character. */
export function Stage3D({
  width,
  height,
  state,
  floorColor,
  onFailure,
}: Stage3DProps) {
  const frameRef = useRef(0);
  const stoppedRef = useRef(false);
  const stateRef = useRef(state);

  stateRef.current = state;

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
        const {
          renderer,
          width: bufferWidth,
          height: bufferHeight,
        } = createGLRenderer(gl);
        const stage = createStageScene({
          width: bufferWidth,
          height: bufferHeight,
          floorColor,
        });
        const startedAt = Date.now();
        let applied: StageState | null = null;

        const render = () => {
          if (stoppedRef.current) {
            stage.dispose();
            renderer.dispose();
            return;
          }

          if (applied !== stateRef.current) {
            applied = stateRef.current;
            stage.setState(applied);
          }

          stage.update((Date.now() - startedAt) / 1000);
          renderer.render(stage.scene, stage.camera);
          gl.endFrameEXP();
          frameRef.current = requestAnimationFrame(render);
        };

        render();
      } catch (error) {
        console.error("[QURAN] 3D stage failed:", error);
        onFailure();
      }
    },
    [floorColor, onFailure],
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={handleContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
