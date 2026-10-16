import * as THREE from "three";
import {
  COVER_GOLD,
  PAGE_A,
  PAGE_B,
  PAGE_C,
  type PackedMask,
} from "@/features/quran/data/splashArt";

/**
 * Splash intro: a 3D Quran flies in spinning, the cover opens, pages flip, and the camera settles
 * face-on so the open book can crossfade into the flat 2D logo.
 *
 * Everything is procedural (geometry, DataTexture covers and pages, shader sparkles), so there
 * are no files to load. `update(seconds)` is a pure function of time, so the scene can be
 * scrubbed, tested and rendered the same way on every device.
 */

/** Length of the whole intro, including the final fade-out of the overlay. */
export const SPLASH_SECONDS = 5;
/** The 3D book fades out between these seconds while the 2D logo fades in. */
export const GL_FADE_START = 3.65;
export const GL_FADE_END = 4.25;

const COVER_W = 1;
const COVER_H = 1.4;
const COVER_T = 0.03;
const BLOCK_HALF = 0.115;
const PAGE_COUNT = 6;
const PAGE_STEP = 0.01;
const PAGE_W = 0.97;
const PAGE_H = 1.34;
const PAGE_SEGMENTS = 22;
const PAGE_ROWS = 6;

/** Cover opens, then pages flip one after another. */
const COVER_OPEN_START = 1.45;
const COVER_OPEN_END = 2.3;
/** Hand-tuned, slightly irregular turns: start second and duration of each page. */
export const PAGE_STARTS: readonly number[] = [2.1, 2.24, 2.35, 2.5, 2.6, 2.76];
const PAGE_DURATIONS: readonly number[] = [0.72, 0.62, 0.7, 0.6, 0.68, 0.64];

const GREEN_DARK = 0x174a34;
const GREEN = 0x1f5c42;
const GOLD = 0xd9b864;
const CREAM = 0xf7efd6;

export interface SplashScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (seconds: number) => void;
  dispose: () => void;
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const range = (t: number, from: number, to: number) =>
  clamp01((t - from) / (to - from));
const smooth = (x: number) => x * x * (3 - 2 * x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

type Key = readonly [number, number];

/** Smooth curve through keyframes (cubic Hermite, Catmull-Rom tangents, flat ends). */
function curve(keys: readonly Key[], t: number): number {
  const last = keys.length - 1;

  if (t <= keys[0]![0]) {
    return keys[0]![1];
  }

  if (t >= keys[last]![0]) {
    return keys[last]![1];
  }

  let index = 0;

  while (t > keys[index + 1]![0]) {
    index += 1;
  }

  const slope = (k: number) =>
    k <= 0 || k >= last
      ? 0
      : (keys[k + 1]![1] - keys[k - 1]![1]) /
        (keys[k + 1]![0] - keys[k - 1]![0]);
  const [t0, v0] = keys[index]!;
  const [t1, v1] = keys[index + 1]!;
  const h = t1 - t0;
  const s = (t - t0) / h;
  const m0 = slope(index) * h;
  const m1 = slope(index + 1) * h;
  const s2 = s * s;
  const s3 = s2 * s;

  return (
    (2 * s3 - 3 * s2 + 1) * v0 +
    (s3 - 2 * s2 + s) * m0 +
    (-2 * s3 + 3 * s2) * v1 +
    (s3 - s2) * m1
  );
}

const CAMERA_AZIMUTH: readonly Key[] = [
  [0, -0.9],
  [1.5, -0.3],
  [2.5, 0.22],
  [3.2, 0.1],
  [3.6, 0],
  [5, 0],
];
const CAMERA_ELEVATION: readonly Key[] = [
  [0, 0.35],
  [1.5, 0.3],
  [2.6, 0.2],
  [3.6, 0],
  [5, 0],
];
const CAMERA_DISTANCE: readonly Key[] = [
  [0, 1.7],
  [1.5, 0.68],
  [2.3, 0.72],
  [3.6, 1],
  [5, 1],
];
const CAMERA_FOV: readonly Key[] = [
  [0, 44],
  [1.5, 38],
  [2.6, 34],
  [3.6, 30],
  [5, 30],
];
const CAMERA_ROLL: readonly Key[] = [
  [0, 0.18],
  [1.6, -0.05],
  [3.6, 0],
  [5, 0],
];
const FINAL_FOV = 30;
/** Share of the screen width the open book fills at the end. */
const FINAL_WIDTH_SHARE = 0.58;

/** 0 -> 1 -> 0 over [a, b]. */
const bump = (t: number, a: number, b: number) =>
  Math.pow(Math.sin(Math.PI * clamp01((t - a) / (b - a))), 2);

/** Soft black blob (radial) or one-sided ramp (shadow of a lifted page) as an alpha texture. */
function makeShadowTexture(kind: "blob" | "ramp"): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const u = (col + 0.5) / size;
      const v = (row + 0.5) / size;
      const alpha =
        kind === "blob"
          ? Math.pow(clamp01(1 - Math.hypot(u - 0.5, v - 0.5) * 2), 1.6)
          : Math.pow(1 - u, 1.4) *
            Math.pow(clamp01(1 - Math.abs(v - 0.5) * 2.2), 0.7);
      const at = (row * size + col) * 4;

      data[at + 3] = Math.round(clamp01(alpha) * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);

  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

function hash(a: number, b: number): number {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;

  return value - Math.floor(value);
}

function mix3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  x: number,
): [number, number, number] {
  return [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
}

/** Coverage of a line of half-width `w` around distance 0, softened by `aa`. */
const stroke = (distance: number, w: number, aa: number) =>
  clamp01((w + aa - Math.abs(distance)) / (2 * aa));

function paint(
  width: number,
  height: number,
  pixel: (x: number, y: number) => readonly [number, number, number],
): THREE.DataTexture {
  const data = new Uint8Array(width * height * 4);

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      // World units on the 1 x 1.4 face, origin in the middle.
      const x = ((col + 0.5) / width - 0.5) * COVER_W;
      const y = ((row + 0.5) / height - 0.5) * COVER_H;
      const [r, g, b] = pixel(x, y);
      const at = (row * width + col) * 4;

      data[at] = Math.round(clamp01(r) * 255);
      data[at + 1] = Math.round(clamp01(g) * 255);
      data[at + 2] = Math.round(clamp01(b) * 255);
      data[at + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);

  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

/** Like paint(), but the callback also gets the pixel column/row. Textures come out upright. */
function paintPixels(
  width: number,
  height: number,
  pixel: (
    col: number,
    row: number,
    x: number,
    y: number,
  ) => readonly [number, number, number],
): THREE.DataTexture {
  const data = new Uint8Array(width * height * 4);

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const x = ((col + 0.5) / width - 0.5) * COVER_W;
      const y = ((row + 0.5) / height - 0.5) * COVER_H;
      const [r, g, b] = pixel(col, row, x, y);
      const at = (row * width + col) * 4;

      data[at] = Math.round(clamp01(r) * 255);
      data[at + 1] = Math.round(clamp01(g) * 255);
      data[at + 2] = Math.round(clamp01(b) * 255);
      data[at + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);

  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

const rgb = (hex: number): [number, number, number] => [
  ((hex >> 16) & 255) / 255,
  ((hex >> 8) & 255) / 255,
  (hex & 255) / 255,
];

/**
 * Coverage of an n-pointed star polygon (outer radius R, inner radius ri) at polar (r, theta).
 * The point is folded into one half-sector, then tested against the edge outer -> inner vertex.
 */
function starCoverage(
  r: number,
  theta: number,
  outer: number,
  inner: number,
  aa: number,
  points = 8,
): number {
  const sector = (Math.PI * 2) / points;
  const half = sector / 2;
  const folded = Math.abs((((theta % sector) + sector) % sector) - half);
  // folded is 0 at an inner vertex and `half` at an outer point; mirror so 0 = outer point.
  const a = half - folded;
  const qx = r * Math.cos(a);
  const qy = r * Math.sin(a);
  const px = outer;
  const py = 0;
  const vx = inner * Math.cos(half) - px;
  const vy = inner * Math.sin(half) - py;
  const length = Math.hypot(vx, vy);
  // Signed distance to the edge line: positive inside the star.
  const distance = -((qx - px) * vy - (qy - py) * vx) / length;

  return clamp01(distance / (2 * aa) + 0.5);
}

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Unpacks a PackedMask to ink coverage 0..1, one float per pixel (row-major). */
function decodeMask(mask: PackedMask): Float32Array {
  const lookup = new Uint8Array(128);

  for (let i = 0; i < BASE64.length; i += 1) {
    lookup[BASE64.charCodeAt(i)] = i;
  }

  const levels = (1 << mask.bits) - 1;
  const perByte = 8 / mask.bits;
  const out = new Float32Array(mask.width * mask.height);
  const text = mask.data;
  let bitBuffer = 0;
  let bitCount = 0;
  let pixel = 0;

  for (let i = 0; i < text.length && pixel < out.length; i += 1) {
    const ch = text.charCodeAt(i);

    if (ch === 61) {
      break; // '='
    }

    bitBuffer = (bitBuffer << 6) | lookup[ch];
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;

      const byte = (bitBuffer >> bitCount) & 255;

      bitBuffer &= (1 << bitCount) - 1;

      for (let k = perByte - 1; k >= 0 && pixel < out.length; k -= 1) {
        out[pixel] = ((byte >> (k * mask.bits)) & levels) / levels;
        pixel += 1;
      }
    }
  }

  return out;
}

/** Cover: deep green leather with a gold-tooled Mushaf design (the ornaments are baked offline). */
function makeCoverTexture(): THREE.DataTexture {
  const green = rgb(GREEN);
  const greenDark = rgb(GREEN_DARK);
  const goldDark: [number, number, number] = [0.7, 0.52, 0.2];
  const goldLight: [number, number, number] = [1, 0.92, 0.62];
  const ink = decodeMask(COVER_GOLD);
  const { width, height } = COVER_GOLD;

  return paintPixels(width, height, (col, row, x, y) => {
    const radial = clamp01(Math.hypot(x / 0.7, y / 0.9));
    let color = mix3(green, greenDark, smooth(radial) * 0.9);
    // Leather grain.
    const grain = 0.5 + 0.5 * Math.cos(x * 210 + Math.sin(y * 90) * 2);

    color = mix3(color, greenDark, 0.1 * grain * hash(col % 7, row % 5));

    // Gold shimmer diagonal across the tooling.
    const shine = smooth(
      clamp01(0.5 + 1.1 * (x * 0.6 - y * 0.4) + 0.2 * Math.sin(y * 9)),
    );
    const gold = mix3(goldDark, goldLight, shine);

    return mix3(color, gold, ink[(height - 1 - row) * width + col]);
  });
}

/** Inner side of the covers: green endpaper with a gold frame, no medallion. */
function makeEndpaperTexture(): THREE.DataTexture {
  const green = rgb(GREEN);
  const greenDark = rgb(GREEN_DARK);
  const gold = rgb(GOLD);
  const aa = 0.0045;

  return paint(128, 256, (x, y) => {
    const weave =
      0.5 + 0.5 * Math.cos(x * 55 + y * 20) * Math.cos(y * 55 - x * 20);
    let color = mix3(green, greenDark, 0.25 + 0.35 * weave);
    const edge = Math.min(COVER_W / 2 - Math.abs(x), COVER_H / 2 - Math.abs(y));

    color = mix3(
      color,
      gold,
      Math.max(stroke(edge - 0.05, 0.007, aa), stroke(edge - 0.08, 0.003, aa)),
    );

    return color;
  });
}

/** Cream Mushaf page: gold frame plus real Quran text from a baked ink mask. */
function makePageTexture(mask: PackedMask, mirror: boolean): THREE.DataTexture {
  const paper = rgb(CREAM);
  const paperShade: [number, number, number] = [0.9, 0.82, 0.62];
  const gold = rgb(GOLD);
  const inkColor: [number, number, number] = [0.1, 0.07, 0.04];
  const ink = decodeMask(mask);
  const { width, height } = mask;
  const aa = 0.005;

  return paintPixels(width, height, (col, row, x, y) => {
    const sx = mirror ? width - 1 - col : col;
    const fx = mirror ? -x : x;
    let color = mix3(
      paper,
      paperShade,
      smooth(clamp01(Math.hypot(fx / 0.9, y / 1.2))) * 0.6,
    );
    const edge = Math.min(COVER_W / 2 - Math.abs(x), COVER_H / 2 - Math.abs(y));

    color = mix3(color, gold, stroke(edge - 0.045, 0.006, aa));
    color = mix3(color, gold, stroke(edge - 0.065, 0.0025, aa));

    return mix3(color, inkColor, ink[(height - 1 - row) * width + sx] * 0.95);
  });
}

const SPARKLE_VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uPx;
  uniform float uOpacity;
  uniform float uGather;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * 0.18 + aPhase * 3.0, 3.2) - 1.6;
    p.x += sin(uTime * 0.7 + aPhase * 12.0) * 0.08;
    p = mix(p, vec3(0.0, 0.0, 0.25), uGather);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPx / max(-mv.z, 0.1);
    float twinkle = 0.45 + 0.55 * sin(uTime * 3.2 + aPhase * 40.0);
    vAlpha = twinkle * uOpacity;
  }
`;

const SPARKLE_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.0, d);
    float cross = smoothstep(0.06, 0.0, min(abs(c.x), abs(c.y))) * smoothstep(0.5, 0.1, d);
    float a = (core * core + cross * 0.6) * vAlpha;
    gl_FragColor = vec4(vec3(1.0, 0.84, 0.46) * a, a);
  }
`;

const MOTE_VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute vec3 aDir;
  uniform float uTime;
  uniform float uStart;
  uniform float uPx;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float age = fract((uTime - uStart) * 0.5 + aPhase);
    vec3 p = position + aDir * age * 1.4;
    p.y += age * 0.9;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (1.0 - 0.6 * age) * uPx / max(-mv.z, 0.1);
    float twinkle = 0.6 + 0.4 * sin(uTime * 6.0 + aPhase * 50.0);
    vAlpha = sin(age * 3.14159) * twinkle * uOpacity;
  }
`;

const BOKEH_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.3, d) * (0.55 + 0.45 * smoothstep(0.3, 0.5, d)) * vAlpha * 0.16;
    gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * a, a);
  }
`;

const RAYS_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    float ang = atan(c.y, c.x);
    float r1 = pow(0.5 + 0.5 * sin(ang * 13.0 + uTime * 0.7), 3.0);
    float r2 = pow(0.5 + 0.5 * sin(ang * 7.0 - uTime * 0.45 + 1.7), 4.0);
    float a = (r1 * 0.6 + r2 * 0.5) * pow(clamp(1.0 - d, 0.0, 1.0), 1.5) * uOpacity;
    gl_FragColor = vec4(vec3(1.0, 0.86, 0.5) * a, a);
  }
`;

const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOW_FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.2) * uOpacity;
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.42) * a, a);
  }
`;

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;

    mesh.geometry?.dispose();

    const material = mesh.material as
      THREE.Material | THREE.Material[] | undefined;
    const list = Array.isArray(material)
      ? material
      : material
        ? [material]
        : [];

    list.forEach((item) => {
      const textured = item as THREE.MeshPhongMaterial;

      textured.map?.dispose();
      item.dispose();
    });
  });
}

/**
 * @param aspect width / height of the drawing buffer
 * @param height drawing buffer height in pixels (sizes the sparkle points)
 */
export function createSplashScene(aspect: number, height: number): SplashScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV[0]![1],
    aspect,
    0.1,
    60,
  );

  // Distance at which the open book fills FINAL_WIDTH_SHARE of the screen width.
  const finalDistance =
    2 /
    FINAL_WIDTH_SHARE /
    (2 * Math.tan((FINAL_FOV * Math.PI) / 360) * aspect);

  /* Lights */
  scene.add(new THREE.AmbientLight(0xfff1d6, 0.5));

  const key = new THREE.DirectionalLight(0xfff0d0, 0.55);

  key.position.set(1.5, 2.2, 3.5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9fe6c0, 0.4);

  rim.position.set(-2.5, 1.2, -2);
  scene.add(rim);

  const pointLight = new THREE.PointLight(0xffd27a, 0, 7, 2);

  pointLight.position.set(0, 0.2, 1.2);
  scene.add(pointLight);

  /* Materials */
  const coverTexture = makeCoverTexture();
  const textureA = makePageTexture(PAGE_A, false);
  const textureB = makePageTexture(PAGE_B, false);
  const textureC = makePageTexture(PAGE_C, false);
  const mirroredB = makePageTexture(PAGE_B, true);
  const mirroredC = makePageTexture(PAGE_C, true);
  const coverFace = new THREE.MeshPhongMaterial({
    map: coverTexture,
    shininess: 40,
    specular: 0x6a5a2a,
  });
  const pageMaterial = (map: THREE.Texture, side: THREE.Side) =>
    new THREE.MeshPhongMaterial({
      map,
      shininess: 6,
      specular: 0x222222,
      side,
    });
  const pageFace = pageMaterial(textureC, THREE.FrontSide);
  const goldEdge = new THREE.MeshPhongMaterial({
    color: GOLD,
    shininess: 80,
    specular: 0xfff0b0,
  });
  const greenEdge = new THREE.MeshPhongMaterial({
    color: GREEN_DARK,
    shininess: 20,
  });
  const creamEdge = new THREE.MeshPhongMaterial({
    color: 0xe9ddb8,
    shininess: 4,
  });
  const paperPlain = new THREE.MeshPhongMaterial({
    map: makeEndpaperTexture(),
    shininess: 14,
    specular: 0x333322,
  });

  /* Book: root (flight) > pivot (centering) > parts */
  const root = new THREE.Group();
  const pivot = new THREE.Group();

  root.add(pivot);
  scene.add(root);

  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  const coverGeometry = new THREE.BoxGeometry(COVER_W, COVER_H, COVER_T);
  const frontCover = new THREE.Group();
  const frontMesh = new THREE.Mesh(coverGeometry, [
    goldEdge,
    greenEdge,
    greenEdge,
    greenEdge,
    coverFace,
    paperPlain,
  ]);

  frontMesh.position.set(COVER_W / 2, 0, BLOCK_HALF + COVER_T / 2);
  frontCover.add(frontMesh);
  pivot.add(frontCover);

  const backMesh = new THREE.Mesh(coverGeometry, [
    goldEdge,
    greenEdge,
    greenEdge,
    greenEdge,
    paperPlain,
    coverFace,
  ]);

  backMesh.position.set(COVER_W / 2, 0, -BLOCK_HALF - COVER_T / 2);
  pivot.add(backMesh);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, COVER_H, BLOCK_HALF * 2 + COVER_T * 2 + 0.01),
    new THREE.MeshPhongMaterial({
      color: GREEN,
      shininess: 50,
      specular: 0x4a5a3a,
    }),
  );

  spine.position.set(-0.03, 0, 0);
  pivot.add(spine);

  [-0.45, 0.45].forEach((y) => {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.064, 0.035, BLOCK_HALF * 2 + COVER_T * 2 + 0.014),
      goldEdge,
    );

    band.position.set(-0.03, y, 0);
    pivot.add(band);
  });

  // Page block on the right. Its top sinks as pages leave it (see update).
  const blockMesh = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W, PAGE_H, 1), [
    creamEdge,
    creamEdge,
    creamEdge,
    creamEdge,
    pageFace,
    creamEdge,
  ]);

  blockMesh.position.x = PAGE_W / 2 + 0.005;
  pivot.add(blockMesh);

  // Flipping pages: a grid of PAGE_SEGMENTS x PAGE_ROWS quads from the hinge, re-laid every frame.
  interface Page {
    meshes: THREE.Mesh[];
    positions: THREE.BufferAttribute;
    geometry: THREE.BufferGeometry;
    tipX: number;
    shadow: THREE.Mesh;
  }

  const shadowRamp = makeShadowTexture("ramp");
  const pages: Page[] = [];
  const columns = PAGE_SEGMENTS + 1;
  const vertexCount = columns * (PAGE_ROWS + 1);

  // Page n shows front[n] on the right and back[n] once turned (text reads correctly on both).
  const fronts = [textureA, textureB, textureC, textureB, textureC, textureB];
  const backs = [
    mirroredC,
    mirroredB,
    mirroredC,
    mirroredB,
    mirroredC,
    mirroredB,
  ];

  for (let index = 0; index < PAGE_COUNT; index += 1) {
    const geometry = new THREE.BufferGeometry();
    const positions = new THREE.BufferAttribute(
      new Float32Array(vertexCount * 3),
      3,
    );
    const uvs = new Float32Array(vertexCount * 2);
    const indices: number[] = [];

    for (let j = 0; j <= PAGE_ROWS; j += 1) {
      for (let k = 0; k <= PAGE_SEGMENTS; k += 1) {
        const at = j * columns + k;

        uvs[at * 2] = k / PAGE_SEGMENTS;
        uvs[at * 2 + 1] = j / PAGE_ROWS;

        if (j < PAGE_ROWS && k < PAGE_SEGMENTS) {
          const a = at;
          const b = at + 1;
          const c = at + columns;
          const d = at + columns + 1;

          indices.push(a, b, c, b, d, c);
        }
      }
    }

    geometry.setAttribute("position", positions);
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    const front = new THREE.Mesh(
      geometry,
      pageMaterial(fronts[index], THREE.FrontSide),
    );
    const back = new THREE.Mesh(
      geometry,
      pageMaterial(backs[index], THREE.BackSide),
    );

    [front, back].forEach((mesh) => {
      mesh.frustumCulled = false;
      pivot.add(mesh);
    });
    const shadowGeometry = new THREE.PlaneGeometry(1, PAGE_H * 0.98);

    shadowGeometry.translate(0.5, 0, 0);

    const shadow = new THREE.Mesh(
      shadowGeometry,
      new THREE.MeshBasicMaterial({
        map: shadowRamp,
        color: 0x000000,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );

    shadow.frustumCulled = false;
    shadow.visible = false;
    pivot.add(shadow);
    pages.push({ meshes: [front, back], positions, geometry, tipX: 0, shadow });
  }

  /**
   * Lays page `index` out for flip progress p (0 = on the right, 1 = on the left).
   * The page is a soft sheet: the free edge trails behind the hinge (lag), the top and bottom
   * corners trail a little more than the middle (cup), and a small ripple runs along it.
   */
  const layoutPage = (page: Page, index: number, p: number, t: number) => {
    const eased = easeInOutCubic(p);
    const theta = eased * Math.PI;
    const swing = Math.sin(eased * Math.PI);
    const lag = 1.35 * Math.pow(swing, 0.85);
    const cup = 0.55 * swing;
    // Resting pages breathe a little (wind): lift away from their stack, never into it.
    const resting = p <= 0 ? 1 : p >= 1 ? -1 : 0;
    const flutter =
      resting * 0.07 * (0.5 + 0.5 * Math.sin(t * 5.2 + index * 1.9));
    const ripple = 0.16 * swing + flutter;
    const zRight = BLOCK_HALF - 0.002 - index * PAGE_STEP;
    const zOffset = lerp(zRight, -zRight, smooth(eased));
    const step = PAGE_W / PAGE_SEGMENTS;
    const array = page.positions.array as Float32Array;

    for (let j = 0; j <= PAGE_ROWS; j += 1) {
      const v = (j / PAGE_ROWS) * 2 - 1;
      let x = 0;
      let z = 0;

      for (let k = 0; k <= PAGE_SEGMENTS; k += 1) {
        const u = k / PAGE_SEGMENTS;

        if (k > 0) {
          const angle =
            theta -
            lag * Math.pow(u, 1.15) -
            cup * v * v * u +
            ripple *
              Math.sin(u * 7 + index) *
              u *
              (1 + 0.4 * Math.sin(t * 9 + index));

          x += step * Math.cos(angle);
          z += step * Math.sin(angle);
        }

        const at = (j * columns + k) * 3;

        array[at] = x;
        array[at + 1] = (v * PAGE_H) / 2;
        array[at + 2] = z + zOffset;
      }
    }

    page.tipX = array[((PAGE_ROWS >> 1) * columns + PAGE_SEGMENTS) * 3]!;
    page.positions.needsUpdate = true;
    page.geometry.computeVertexNormals();
  };

  /* Soft glow behind the book and sparkles around it */
  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
    uniforms: { uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMaterial);

  glow.scale.set(7, 7, 1);
  scene.add(glow);

  const sparkleCount = 140;
  const sparklePositions = new Float32Array(sparkleCount * 3);
  const sparklePhase = new Float32Array(sparkleCount);
  const sparkleSize = new Float32Array(sparkleCount);

  for (let i = 0; i < sparkleCount; i += 1) {
    const angle = hash(i, 1) * Math.PI * 2;
    const radius = 0.9 + hash(i, 2) * 1.9;

    sparklePositions.set(
      [
        Math.cos(angle) * radius,
        (hash(i, 3) - 0.5) * 2.2,
        Math.sin(angle) * radius * 0.7,
      ],
      i * 3,
    );
    sparklePhase[i] = hash(i, 4);
    sparkleSize[i] = 0.025 + hash(i, 5) * 0.05;
  }

  const sparkleGeometry = new THREE.BufferGeometry();

  sparkleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(sparklePositions, 3),
  );
  sparkleGeometry.setAttribute(
    "aPhase",
    new THREE.BufferAttribute(sparklePhase, 1),
  );
  sparkleGeometry.setAttribute(
    "aSize",
    new THREE.BufferAttribute(sparkleSize, 1),
  );

  const sparkleMaterial = new THREE.ShaderMaterial({
    vertexShader: SPARKLE_VERTEX,
    fragmentShader: SPARKLE_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPx: { value: 1 },
      uOpacity: { value: 0 },
      uGather: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);

  sparkles.frustumCulled = false;
  scene.add(sparkles);

  /* Rays of light that burst out of the book as the cover opens */
  const raysMaterial = new THREE.ShaderMaterial({
    vertexShader: GLOW_VERTEX,
    fragmentShader: RAYS_FRAGMENT,
    uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rays = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), raysMaterial);

  rays.scale.set(9, 9, 1);
  scene.add(rays);

  /* Golden motes rising out of the open pages */
  const moteCount = 90;
  const motePositions = new Float32Array(moteCount * 3);
  const moteDirs = new Float32Array(moteCount * 3);
  const motePhase = new Float32Array(moteCount);
  const moteSize = new Float32Array(moteCount);

  for (let i = 0; i < moteCount; i += 1) {
    motePositions.set(
      [
        (hash(i, 11) - 0.5) * 1.5,
        (hash(i, 12) - 0.5) * 0.9,
        0.06 + hash(i, 13) * 0.1,
      ],
      i * 3,
    );
    moteDirs.set(
      [(hash(i, 14) - 0.5) * 0.9, hash(i, 15) * 0.5, 0.2 + hash(i, 16) * 0.8],
      i * 3,
    );
    motePhase[i] = hash(i, 17);
    moteSize[i] = 0.02 + hash(i, 18) * 0.035;
  }

  const moteGeometry = new THREE.BufferGeometry();

  moteGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(motePositions, 3),
  );
  moteGeometry.setAttribute("aDir", new THREE.BufferAttribute(moteDirs, 3));
  moteGeometry.setAttribute("aPhase", new THREE.BufferAttribute(motePhase, 1));
  moteGeometry.setAttribute("aSize", new THREE.BufferAttribute(moteSize, 1));

  const moteMaterial = new THREE.ShaderMaterial({
    vertexShader: MOTE_VERTEX,
    fragmentShader: SPARKLE_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uStart: { value: 2 },
      uPx: { value: 1 },
      uOpacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const motes = new THREE.Points(moteGeometry, moteMaterial);

  motes.frustumCulled = false;
  scene.add(motes);

  /* Large soft bokeh discs near the lens: cheap depth of field */
  const bokehCount = 16;
  const bokehPositions = new Float32Array(bokehCount * 3);
  const bokehPhase = new Float32Array(bokehCount);
  const bokehSize = new Float32Array(bokehCount);

  for (let i = 0; i < bokehCount; i += 1) {
    const side = hash(i, 21) > 0.5 ? 1 : -1;

    bokehPositions.set(
      [
        side * (1.15 + hash(i, 22) * 0.9),
        (hash(i, 23) - 0.5) * 3,
        0.5 + hash(i, 24) * 1.1,
      ],
      i * 3,
    );
    bokehPhase[i] = hash(i, 25);
    bokehSize[i] = 0.16 + hash(i, 26) * 0.2;
  }

  const bokehGeometry = new THREE.BufferGeometry();

  bokehGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(bokehPositions, 3),
  );
  bokehGeometry.setAttribute(
    "aPhase",
    new THREE.BufferAttribute(bokehPhase, 1),
  );
  bokehGeometry.setAttribute("aSize", new THREE.BufferAttribute(bokehSize, 1));

  const bokehMaterial = new THREE.ShaderMaterial({
    vertexShader: SPARKLE_VERTEX,
    fragmentShader: BOKEH_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPx: { value: 1 },
      uOpacity: { value: 0 },
      uGather: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const bokeh = new THREE.Points(bokehGeometry, bokehMaterial);

  bokeh.frustumCulled = false;
  scene.add(bokeh);

  /* Soft contact shadow of the book on the floor */
  const groundShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: makeShadowTexture("blob"),
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );

  groundShadow.rotation.x = -Math.PI / 2;
  scene.add(groundShadow);

  const update = (seconds: number) => {
    const t = Math.min(Math.max(seconds, 0), SPLASH_SECONDS);

    /* Camera: orbit, dolly and a dolly-zoom, ending face-on */
    const azimuth = curve(CAMERA_AZIMUTH, t);
    const elevation = curve(CAMERA_ELEVATION, t);
    // Punch-in as the cover opens, a gentle push as the book settles; both end at exactly 1.
    const distance =
      curve(CAMERA_DISTANCE, t) *
      finalDistance *
      (1 - 0.07 * bump(t, 1.45, 2.0) - 0.04 * bump(t, 3.0, 3.6));
    const fov = curve(CAMERA_FOV, t);

    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.position.set(
      distance * Math.sin(azimuth) * Math.cos(elevation),
      distance * Math.sin(elevation),
      distance * Math.cos(azimuth) * Math.cos(elevation),
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.rotateZ(curve(CAMERA_ROLL, t));

    // Handheld shake that dies out before the camera locks off.
    const shake =
      0.009 * smooth(range(t, 0.15, 0.7)) * (1 - smooth(range(t, 2.5, 3.3)));

    camera.rotateX(shake * (Math.sin(t * 9.7) + 0.6 * Math.sin(t * 17.3 + 1)));
    camera.rotateY(shake * (Math.sin(t * 8.1 + 2) + 0.6 * Math.sin(t * 19.1)));

    /* Flight: the book rises out of the dark, spinning and levelling out */
    const fly = easeOutCubic(range(t, 0, 1.65));
    const spin = easeOutQuart(range(t, 0, 1.8));
    const float = 0.035 * Math.sin(t * 2.2) * (1 - range(t, 2.4, 3.4));

    root.position.set(
      -1.1 * (1 - fly),
      -2.3 * (1 - fly) + float,
      -3.6 * (1 - fly),
    );
    root.rotation.set(
      -0.55 * (1 - easeOutCubic(range(t, 0, 2.4))),
      5.4 * (1 - spin),
      0.45 * (1 - easeOutCubic(range(t, 0, 2.1))),
    );
    root.scale.setScalar(lerp(0.5, 1, fly));

    /* Cover opens about the spine, pages flip */
    const open = easeInOutCubic(range(t, COVER_OPEN_START, COVER_OPEN_END));

    frontCover.rotation.y = -open * Math.PI;
    pivot.position.x = -(COVER_W / 2) * (1 - smooth(open));

    let flipped = 0;

    let landed = 0;
    const progress: number[] = [];

    pages.forEach((page, index) => {
      const start = PAGE_STARTS[index]!;
      const p = range(t, start, start + PAGE_DURATIONS[index]!);

      progress.push(p);
      flipped += easeInOutCubic(p);
      landed += p >= 1 ? 1 : 0;
      layoutPage(page, index, p, t);
      // Unturned pages lie stacked on the block (page 0 shows the first Mushaf page).
      page.meshes.forEach((mesh) => {
        mesh.visible = open > 0.05;
      });
    });

    const topZ = BLOCK_HALF - 0.004 - flipped * PAGE_STEP;
    const thickness = topZ + BLOCK_HALF;

    blockMesh.scale.z = Math.max(thickness, 0.001);
    blockMesh.position.z = -BLOCK_HALF + thickness / 2;

    /* Shadows: each lifted page darkens the surface it hovers over */
    const leftTop = -BLOCK_HALF + 0.002 + landed * PAGE_STEP;

    pages.forEach((page, index) => {
      const p = progress[index]!;
      const lifted = p > 0 && p < 1 && open > 0.5;
      const eased = easeInOutCubic(p);
      const strength = Math.pow(Math.sin(eased * Math.PI), 0.8);

      page.shadow.visible = lifted && Math.abs(page.tipX) > 0.02;

      if (page.shadow.visible) {
        const onRight = page.tipX > 0;
        const rightZ = Math.max(
          BLOCK_HALF - 0.002 - Math.min(index + 1, PAGE_COUNT) * PAGE_STEP,
          topZ,
        );

        page.shadow.scale.x = page.tipX;
        page.shadow.position.z = (onRight ? rightZ : leftTop) + 0.003;
        (page.shadow.material as THREE.MeshBasicMaterial).opacity =
          0.4 * strength;
      }
    });

    /* Light and glow swell as the book opens */
    const reveal = smooth(range(t, COVER_OPEN_START, COVER_OPEN_END + 0.4));
    const fade = 1 - smooth(range(t, GL_FADE_START, GL_FADE_END));

    pointLight.intensity =
      (0.16 * reveal + 0.5 * bump(t, 1.55, 2.4) + 0.3 * bump(t, 3.45, 4.1)) *
      fade;
    root.updateMatrixWorld(true);
    glow.quaternion.copy(camera.quaternion);
    glow.position.set(0, 0, -0.5).applyMatrix4(root.matrixWorld);
    glowMaterial.uniforms.uOpacity!.value =
      (0.1 +
        0.26 * reveal +
        0.1 * smooth(range(t, 3, 3.65)) +
        0.55 * bump(t, 3.45, 4.15)) *
      fade *
      smooth(range(t, 0.2, 1));

    rays.quaternion.copy(camera.quaternion);
    rays.position.set(0, 0, -0.45).applyMatrix4(root.matrixWorld);
    raysMaterial.uniforms.uTime!.value = t;
    raysMaterial.uniforms.uOpacity!.value = 0.5 * bump(t, 1.6, 3.3) * fade;

    moteMaterial.uniforms.uTime!.value = t;
    moteMaterial.uniforms.uPx!.value =
      height / (2 * Math.tan((fov * Math.PI) / 360));
    moteMaterial.uniforms.uOpacity!.value =
      smooth(range(t, 2.0, 2.4)) * fade * (1 - smooth(range(t, 3.2, 3.9)));

    bokehMaterial.uniforms.uTime!.value = t;
    bokehMaterial.uniforms.uPx!.value =
      height / (2 * Math.tan((fov * Math.PI) / 360));
    bokehMaterial.uniforms.uOpacity!.value = smooth(range(t, 0.3, 1.2)) * fade;

    groundShadow.position.set(
      root.position.x,
      root.position.y - 0.95 * root.scale.x,
      root.position.z,
    );
    groundShadow.scale.set(2.2 * root.scale.x, 1.6 * root.scale.x, 1);
    (groundShadow.material as THREE.MeshBasicMaterial).opacity =
      0.5 * smooth(range(t, 0.2, 1)) * (1 - smooth(range(t, 2.4, 3.2)));

    sparkleMaterial.uniforms.uGather!.value = smooth(range(t, 3.1, 3.9));
    sparkleMaterial.uniforms.uTime!.value = t;
    sparkleMaterial.uniforms.uPx!.value =
      height / (2 * Math.tan((fov * Math.PI) / 360));
    sparkleMaterial.uniforms.uOpacity!.value =
      smooth(range(t, 0.5, 1.4)) * fade;
  };

  const dispose = () => {
    disposeObject(scene);
  };

  update(0);

  return { scene, camera, update, dispose };
}
