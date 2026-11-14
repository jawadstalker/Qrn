import React, { useCallback, useEffect, useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import { createGLRenderer } from "@/features/quran/utils/glRenderer";
import type { AvatarParams } from "@/features/rooms/avatar";
import { createAvatarPreviewScene } from "@/features/rooms/utils/stageScene";

const ROTATION_PER_PIXEL = 0.012;

interface AvatarView3DProps {
  width: number;
  height: number;
  avatar: AvatarParams;
  onFailure: () => void;
}

/** One character that turns slowly; drag sideways to rotate it. */
export function AvatarView3D({
  width,
  height,
  avatar,
  onFailure,
}: AvatarView3DProps) {
  const frameRef = useRef(0);
  const stoppedRef = useRef(false);
  const avatarRef = useRef(avatar);
  const rotationRef = useRef(0);
  const draggingRef = useRef(false);
  const lastDxRef = useRef(0);

  avatarRef.current = avatar;

  useEffect(
    () => () => {
      stoppedRef.current = true;
      cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) + 4,
      onPanResponderGrant: () => {
        draggingRef.current = true;
        lastDxRef.current = 0;
      },
      onPanResponderMove: (_event, gesture) => {
        rotationRef.current +=
          (gesture.dx - lastDxRef.current) * ROTATION_PER_PIXEL;
        lastDxRef.current = gesture.dx;
      },
      onPanResponderRelease: () => {
        draggingRef.current = false;
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
      },
    }),
  ).current;

  const handleContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      try {
        const {
          renderer,
          width: bufferWidth,
          height: bufferHeight,
        } = createGLRenderer(gl);
        const preview = createAvatarPreviewScene({
          width: bufferWidth,
          height: bufferHeight,
          avatar: avatarRef.current,
        });
        const startedAt = Date.now();
        let applied = avatarRef.current;

        const render = () => {
          if (stoppedRef.current) {
            preview.dispose();
            renderer.dispose();
            return;
          }

          if (applied !== avatarRef.current) {
            applied = avatarRef.current;
            preview.setAvatar(applied);
          }

          preview.update(
            (Date.now() - startedAt) / 1000,
            rotationRef.current,
            draggingRef.current,
          );
          renderer.render(preview.scene, preview.camera);
          gl.endFrameEXP();
          frameRef.current = requestAnimationFrame(render);
        };

        render();
      } catch (error) {
        console.error("[QURAN] 3D character failed:", error);
        onFailure();
      }
    },
    [onFailure],
  );

  return (
    <View
      style={[styles.container, { width, height }]}
      {...panResponder.panHandlers}
    >
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
