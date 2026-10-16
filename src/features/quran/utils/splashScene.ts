import * as THREE from "three";

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
const PAGE_SEGMENTS = 14;

/** Cover opens, then pages flip one after another. */
const COVER_OPEN_START = 1.45;
const COVER_OPEN_END = 2.3;
const PAGE_START = 2.1;
const PAGE_STAGGER = 0.14;
const PAGE_DURATION = 0.5;

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

/** Green cover: gold frame, geometric ground and an 8-pointed star medallion. */
function makeCoverTexture(): THREE.DataTexture {
  const green = rgb(GREEN);
  const greenDark = rgb(GREEN_DARK);
  const gold = rgb(GOLD);
  const goldLight: [number, number, number] = [0.98, 0.9, 0.62];
  const aa = 0.0045;

  return paint(256, 512, (x, y) => {
    const radial = clamp01(Math.hypot(x / 0.62, y / 0.82));
    let color = mix3(green, greenDark, smooth(radial));
    // Faint woven grid, only to keep the big green area from looking flat.
    const weave = 0.5 + 0.5 * Math.cos(x * 70) * Math.cos(y * 70);

    color = mix3(color, greenDark, 0.18 * weave);

    const edge = Math.min(COVER_W / 2 - Math.abs(x), COVER_H / 2 - Math.abs(y));
    const frame = Math.max(
      stroke(edge - 0.04, 0.009, aa),
      stroke(edge - 0.075, 0.004, aa),
    );

    color = mix3(color, gold, frame);

    const cy = y - 0.08;
    const r = Math.hypot(x, cy);
    const theta = Math.atan2(cy, x);
    const star = starCoverage(r, theta, 0.29, 0.15, aa);
    const ring = Math.max(
      stroke(r - 0.34, 0.007, aa),
      stroke(r - 0.31, 0.003, aa),
    );
    const hub = clamp01((0.075 - r) / (2 * aa) + 0.5);
    const hubRing = stroke(r - 0.095, 0.004, aa);

    color = mix3(color, gold, ring);
    color = mix3(color, goldLight, star * 0.95);
    color = mix3(color, greenDark, hub);
    color = mix3(color, goldLight, Math.max(hubRing, hub * 0.0));

    // Lower ornament: two rules and a row of small diamonds.
    const bandY = y + 0.44;
    const rules = Math.max(
      stroke(bandY - 0.04, 0.004, aa),
      stroke(bandY + 0.04, 0.004, aa),
    );
    const diamondX = ((x + 0.5) * 10) % 1;
    const diamond = clamp01(
      (0.16 - (Math.abs(diamondX - 0.5) + Math.abs(bandY * 10))) / 0.05,
    );

    if (Math.abs(x) < 0.3) {
      color = mix3(color, gold, Math.max(rules, diamond * 0.9));
    }

    return color;
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

/** Cream page with a gold frame and lines of small ink strokes standing in for the text. */
function makePageTexture(): THREE.DataTexture {
  const paper = rgb(CREAM);
  const paperShade: [number, number, number] = [0.88, 0.8, 0.6];
  const gold = rgb(GOLD);
  const ink: [number, number, number] = [0.13, 0.09, 0.04];
  const aa = 0.005;
  const lines = 15;

  return paint(256, 512, (x, y) => {
    let color = mix3(
      paper,
      paperShade,
      smooth(clamp01(Math.hypot(x / 0.9, y / 1.2))) * 0.6,
    );
    const edge = Math.min(COVER_W / 2 - Math.abs(x), COVER_H / 2 - Math.abs(y));

    color = mix3(color, gold, stroke(edge - 0.045, 0.006, aa));
    color = mix3(color, gold, stroke(edge - 0.065, 0.0025, aa));

    const area = Math.abs(x) < 0.38 && Math.abs(y) < 0.52;

    if (area) {
      const slot = ((y + 0.52) / 1.04) * lines;
      const index = Math.floor(slot);
      const within = (slot - index - 0.5) * (1.04 / lines);
      const word = Math.floor((x + 0.38) / 0.09);
      const wordX = ((x + 0.38) % 0.09) / 0.09;
      const present =
        hash(index + 1, word + 3) > 0.16 && wordX > 0.08 && wordX < 0.92;
      const wobble = 0.004 * Math.sin(x * 90 + index * 3);

      color = mix3(
        color,
        ink,
        present ? stroke(within + wobble, 0.0085, aa) * 0.92 : 0,
      );
    }

    return color;
  });
}

const SPARKLE_VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uPx;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * 0.18 + aPhase * 3.0, 3.2) - 1.6;
    p.x += sin(uTime * 0.7 + aPhase * 12.0) * 0.08;
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
  const pageTexture = makePageTexture();
  const coverFace = new THREE.MeshPhongMaterial({
    map: coverTexture,
    shininess: 40,
    specular: 0x6a5a2a,
  });
  const pageFace = new THREE.MeshPhongMaterial({
    map: pageTexture,
    shininess: 6,
    specular: 0x222222,
  });
  const pageFaceDouble = new THREE.MeshPhongMaterial({
    map: pageTexture,
    shininess: 6,
    specular: 0x222222,
    side: THREE.DoubleSide,
  });
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

  // Flipping pages: a polyline of PAGE_SEGMENTS strips from the hinge, re-laid every frame.
  interface Page {
    mesh: THREE.Mesh;
    positions: THREE.BufferAttribute;
  }

  const pages: Page[] = [];
  const vertexCount = (PAGE_SEGMENTS + 1) * 2;

  for (let index = 0; index < PAGE_COUNT; index += 1) {
    const geometry = new THREE.BufferGeometry();
    const positions = new THREE.BufferAttribute(
      new Float32Array(vertexCount * 3),
      3,
    );
    const uvs = new Float32Array(vertexCount * 2);
    const indices: number[] = [];

    for (let k = 0; k <= PAGE_SEGMENTS; k += 1) {
      const u = k / PAGE_SEGMENTS;

      uvs.set([u, 0, u, 1], k * 4);

      if (k < PAGE_SEGMENTS) {
        const a = k * 2;

        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }

    geometry.setAttribute("position", positions);
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    const mesh = new THREE.Mesh(geometry, pageFaceDouble);

    mesh.frustumCulled = false;
    pivot.add(mesh);
    pages.push({ mesh, positions });
  }

  /** Lays page `index` out for flip progress p (0 = on the right, 1 = on the left). */
  const layoutPage = (page: Page, index: number, p: number) => {
    const eased = easeInOutCubic(p);
    const theta = eased * Math.PI;
    const lag = 0.75 * Math.sin(eased * Math.PI);
    const zRight = BLOCK_HALF - 0.002 - index * PAGE_STEP;
    const zOffset = lerp(zRight, -zRight, smooth(eased));
    const step = PAGE_W / PAGE_SEGMENTS;
    const array = page.positions.array as Float32Array;
    let x = 0;
    let z = 0;

    for (let k = 0; k <= PAGE_SEGMENTS; k += 1) {
      if (k > 0) {
        const angle = theta - lag * (k / PAGE_SEGMENTS);

        x += step * Math.cos(angle);
        z += step * Math.sin(angle);
      }

      const at = k * 6;

      array[at] = x;
      array[at + 1] = -PAGE_H / 2;
      array[at + 2] = z + zOffset;
      array[at + 3] = x;
      array[at + 4] = PAGE_H / 2;
      array[at + 5] = z + zOffset;
    }

    page.positions.needsUpdate = true;
    page.mesh.geometry.computeVertexNormals();
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
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);

  sparkles.frustumCulled = false;
  scene.add(sparkles);

  const update = (seconds: number) => {
    const t = Math.min(Math.max(seconds, 0), SPLASH_SECONDS);

    /* Camera: orbit, dolly and a dolly-zoom, ending face-on */
    const azimuth = curve(CAMERA_AZIMUTH, t);
    const elevation = curve(CAMERA_ELEVATION, t);
    const distance = curve(CAMERA_DISTANCE, t) * finalDistance;
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

    pages.forEach((page, index) => {
      const p = range(
        t,
        PAGE_START + index * PAGE_STAGGER,
        PAGE_START + index * PAGE_STAGGER + PAGE_DURATION,
      );

      flipped += easeInOutCubic(p);
      layoutPage(page, index, p);
      // Pages that have not started stay hidden inside the block.
      page.mesh.visible =
        t >= PAGE_START + index * PAGE_STAGGER - 0.001 && open > 0.2;
    });

    const topZ = BLOCK_HALF - 0.004 - flipped * PAGE_STEP;
    const thickness = topZ + BLOCK_HALF;

    blockMesh.scale.z = Math.max(thickness, 0.001);
    blockMesh.position.z = -BLOCK_HALF + thickness / 2;

    /* Light and glow swell as the book opens */
    const reveal = smooth(range(t, COVER_OPEN_START, COVER_OPEN_END + 0.4));
    const fade = 1 - smooth(range(t, GL_FADE_START, GL_FADE_END));

    pointLight.intensity = 0.16 * reveal * fade;
    root.updateMatrixWorld(true);
    glow.quaternion.copy(camera.quaternion);
    glow.position.set(0, 0, -0.5).applyMatrix4(root.matrixWorld);
    glowMaterial.uniforms.uOpacity!.value =
      (0.1 + 0.26 * reveal + 0.1 * smooth(range(t, 3, 3.65))) *
      fade *
      smooth(range(t, 0.2, 1));

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
