import * as THREE from "three";

/**
 * Blazing sun: a boiling fractal-noise sphere plus a camera-facing plane behind it
 * that draws flame tongues and a soft corona. Everything is drawn by shaders,
 * so there are no textures to load.
 */

export interface SunScene {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  update: (seconds: number) => void;
  dispose: () => void;
}

/** Half the visible world size. The sphere has radius ~1, flames reach ~2. */
const VIEW_HALF = 2;
const SPHERE_RADIUS = 0.92;

const NOISE_3D = /* glsl */ `
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v;
  }
`;

const SPHERE_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  ${NOISE_3D}
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    float boil = fbm3(position * 2.2 + vec3(0.0, uTime * 0.45, uTime * 0.2));
    vec3 displaced = position * (1.0 + (boil - 0.5) * 0.07);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const SPHERE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  ${NOISE_3D}
  void main() {
    vec3 p = vPos * 2.6;
    float t = uTime * 0.5;
    float n = fbm3(p + vec3(0.0, t, 0.0) + fbm3(p * 1.7 - vec3(t, 0.0, t)) * 1.4);

    // Dark sunspot-like cells, bright cores.
    float heat = smoothstep(0.18, 0.88, n);
    vec3 deep = vec3(0.78, 0.12, 0.02);
    vec3 mid = vec3(1.0, 0.48, 0.05);
    vec3 hot = vec3(1.0, 0.92, 0.55);
    vec3 col = mix(deep, mid, smoothstep(0.0, 0.55, heat));
    col = mix(col, hot, smoothstep(0.5, 1.0, heat));

    // Limb: edges glow orange, the middle burns whiter.
    float facing = clamp(vNormal.z, 0.0, 1.0);
    col = mix(col * 1.05, col + vec3(0.35, 0.22, 0.06), pow(facing, 2.5));
    col *= 0.78 + 0.45 * pow(facing, 0.6);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const FLAME_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLAME_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uHalf;
  uniform float uInner;
  varying vec2 vUv;
  ${NOISE_3D}
  void main() {
    vec2 p = (vUv - 0.5) * 2.0 * uHalf;
    float r = length(p);
    vec2 dir = p / max(r, 0.0001);
    float t = uTime;

    // Noise is sampled on the unit circle (dir) so the angle never has a seam.
    float n1 = fbm3(vec3(dir * 2.6, 0.0) + vec3(0.0, 0.0, t * 0.55) + vec3(r * 1.1 - t * 1.1, 0.0, 0.0));
    float n2 = fbm3(vec3(dir * 5.5, 3.0) + vec3(-t * 0.7, r * 2.2 - t * 1.7, t * 0.3));
    float reach = 0.10 + 0.62 * n1 + 0.30 * n2;

    float d = r - uInner;
    float tongue = d <= 0.0 ? 1.0 : clamp(1.0 - d / reach, 0.0, 1.0);
    tongue = tongue * tongue * (3.0 - 2.0 * tongue);

    // Wispy erosion at the tips.
    float wisp = fbm3(vec3(dir * 8.0 + 11.0, r * 3.0 - t * 2.2));
    tongue *= smoothstep(0.12, 0.62, wisp + tongue * 0.55);

    float glow = d <= 0.0 ? 1.0 : exp(-d * 2.4);
    float fade = 1.0 - smoothstep(uHalf * 0.78, uHalf, r);

    vec3 inner = vec3(1.0, 0.86, 0.35);
    vec3 outer = vec3(1.0, 0.30, 0.04);
    vec3 col = mix(outer, inner, clamp(tongue * 1.2, 0.0, 1.0));
    vec3 halo = vec3(1.0, 0.55, 0.12);

    float a = clamp(tongue * 0.95 + glow * 0.32, 0.0, 1.0) * fade;
    vec3 rgb = mix(halo, col, clamp(tongue * 1.6, 0.0, 1.0));

    // Premultiplied alpha: low alpha stays additive, so glow never leaves a dark fringe.
    gl_FragColor = vec4(rgb * a, a);
  }
`;

export function createSunScene(): SunScene {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -VIEW_HALF,
    VIEW_HALF,
    VIEW_HALF,
    -VIEW_HALF,
    0.1,
    20,
  );
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);

  const timeUniform = { value: 0 };

  const flameMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uHalf: { value: VIEW_HALF },
      uInner: { value: SPHERE_RADIUS - 0.05 },
    },
    vertexShader: FLAME_VERTEX,
    fragmentShader: FLAME_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  flameMaterial.premultipliedAlpha = true;

  const flameGeometry = new THREE.PlaneGeometry(VIEW_HALF * 2, VIEW_HALF * 2);
  const flames = new THREE.Mesh(flameGeometry, flameMaterial);
  flames.position.z = -1;
  flames.renderOrder = 0;
  scene.add(flames);

  const sphereMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: timeUniform },
    vertexShader: SPHERE_VERTEX,
    fragmentShader: SPHERE_FRAGMENT,
  });
  const sphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, 48, 32);
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.renderOrder = 1;
  scene.add(sphere);

  return {
    scene,
    camera,
    update: (seconds) => {
      timeUniform.value = seconds;
      sphere.rotation.y = seconds * 0.12;
      sphere.rotation.x = Math.sin(seconds * 0.2) * 0.15;
    },
    dispose: () => {
      flameGeometry.dispose();
      flameMaterial.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
    },
  };
}
