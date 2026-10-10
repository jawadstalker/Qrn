import React, { useCallback, useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { createPlantScene } from '@/features/quran/utils/plantScene';

const ROTATION_PER_PIXEL = 0.012;

interface Plant3DProps {
  width: number;
  height: number;
  leaves: number;
  flowers: number;
  hasNewLeaf?: boolean;
  reducedMotion: boolean;
  onFailure: () => void;
}

export function Plant3D({
  width,
  height,
  leaves,
  flowers,
  hasNewLeaf = false,
  reducedMotion,
  onFailure,
}: Plant3DProps) {
  const frameRef = useRef(0);
  const stoppedRef = useRef(false);
  const userRotationRef = useRef(0);
  const draggingRef = useRef(false);
  const lastDxRef = useRef(0);

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
        userRotationRef.current += (gesture.dx - lastDxRef.current) * ROTATION_PER_PIXEL;
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
        });
        renderer.setPixelRatio(1);
        renderer.setSize(bufferWidth, bufferHeight, false);
        renderer.setClearColor(0x000000, 0);

        const plant = createPlantScene({
          width: bufferWidth,
          height: bufferHeight,
          leaves,
          flowers,
          hasNewLeaf,
          reducedMotion,
        });
        const startedAt = Date.now();

        const render = () => {
          if (stoppedRef.current) {
            plant.dispose();
            renderer.dispose();
            return;
          }

          plant.update(
            (Date.now() - startedAt) / 1000,
            userRotationRef.current,
            draggingRef.current,
          );
          renderer.render(plant.scene, plant.camera);
          gl.endFrameEXP();

          if (!reducedMotion || Date.now() - startedAt < 200) {
            frameRef.current = requestAnimationFrame(render);
          }
        };

        render();
      } catch (error) {
        console.error('[QURAN] 3D plant failed, using the illustration:', error);
        onFailure();
      }
    },
    [flowers, hasNewLeaf, leaves, onFailure, reducedMotion],
  );

  return (
    <View style={[styles.container, { width, height }]} {...panResponder.panHandlers}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={handleContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
