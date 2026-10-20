import * as THREE from "three";
import type { ExpoWebGLRenderingContext } from "expo-gl";

/**
 * three r128 reads `gl.canvas.width/height` inside WebGLState, but expo-gl
 * contexts have no `canvas`. Attach a minimal canvas shim to the context
 * before the renderer is created.
 */
export function createGLRenderer(
  gl: ExpoWebGLRenderingContext,
  options: { premultipliedAlpha?: boolean } = {},
) {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;

  const canvas = {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    style: {},
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    getContext: () => gl,
  } as unknown as HTMLCanvasElement;

  (gl as unknown as { canvas: HTMLCanvasElement }).canvas = canvas;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: gl as unknown as WebGLRenderingContext,
    antialias: true,
    alpha: true,
    premultipliedAlpha: options.premultipliedAlpha,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);

  return { renderer, width, height };
}
