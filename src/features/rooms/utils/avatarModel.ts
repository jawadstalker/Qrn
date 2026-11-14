import * as THREE from "three";
import {
  ACCENT_COLORS,
  EYE_COLORS,
  FACE_TONES,
  GLOW_COLORS,
  HAIR_COLORS,
  OUTFIT_COLORS,
  PANTS_COLORS,
  type AvatarParams,
} from "@/features/rooms/avatar";

export interface AvatarMood {
  /** Horizontal speed in units per second (drives the walk cycle). */
  speed: number;
  /** Reciting into the microphone. */
  talking: boolean;
  /** Listening to the bot. */
  listening: boolean;
  /** Eliminated or gone: grey, eyes closed, slumped. */
  faded: boolean;
}

export interface AvatarRig {
  /** Root of the character; the feet are at y = 0. */
  group: THREE.Group;
  /** Approximate height including the hair. */
  height: number;
  setFaded: (faded: boolean) => void;
  animate: (
    seconds: number,
    dt: number,
    mood: AvatarMood,
    seed: number,
  ) => void;
  dispose: () => void;
}

const HEAD_SCALE = { x: 1, y: 0.95, z: 0.94 };
const FADE_COLOR = new THREE.Color("#9AA0A6");

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash01(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;

  return x - Math.floor(x);
}

/** Lightens (amount > 0) or darkens (amount < 0) a colour. */
function shade(hex: string, amount: number): string {
  const color = new THREE.Color(hex);

  color.lerp(
    new THREE.Color(amount > 0 ? "#ffffff" : "#000000"),
    Math.abs(amount),
  );

  return `#${color.getHexString()}`;
}

function damp(current: number, target: number, k: number): number {
  return current + (target - current) * Math.min(1, k);
}

/** Narrows the lower half of the head into a soft chin (yn is -1 at the bottom, 1 at the top). */
function taper(yn: number): number {
  return yn < 0 ? 1 - 0.2 * Math.pow(-yn, 1.6) : 1;
}

/** A smooth limb: a tapered tube with round ends. Its top end is at y = 0 and it hangs down by `length`. */
function capsule(
  rTop: number,
  rBottom: number,
  length: number,
  segments = 20,
): THREE.LatheGeometry {
  const points: THREE.Vector2[] = [];
  const steps = 6;

  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);

    points.push(
      new THREE.Vector2(rBottom * Math.cos(a), -length + rBottom * Math.sin(a)),
    );
  }

  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);

    points.push(new THREE.Vector2(rTop * Math.cos(a), rTop * Math.sin(a)));
  }

  return new THREE.LatheGeometry(points, segments);
}

interface ArmRig {
  shoulder: THREE.Group;
  elbow: THREE.Group;
  fingers: THREE.Group[];
}

interface LegRig {
  hip: THREE.Group;
  knee: THREE.Group;
  ankle: THREE.Group;
}

/**
 * The app mascot as a smooth, articulated 3D character: a big round head with large anime eyes, the
 * glowing "cloud" hair, and a body with shoulders, elbows, fingers, knees and feet that can pose
 * naturally. Colours and clothes come from `params`.
 */
export function createAvatar(params: AvatarParams): AvatarRig {
  const faceColor = FACE_TONES[params.face] ?? FACE_TONES[0];
  const hairColor = HAIR_COLORS[params.hairColor] ?? HAIR_COLORS[0];
  const glowColor = GLOW_COLORS[params.glow] ?? GLOW_COLORS[0];
  const eyeColor = EYE_COLORS[params.eyes] ?? EYE_COLORS[0];
  const topColor = OUTFIT_COLORS[params.outfit] ?? OUTFIT_COLORS[0];
  const pantsColor = PANTS_COLORS[params.pants] ?? PANTS_COLORS[0];
  const accentColor = ACCENT_COLORS[params.accent] ?? ACCENT_COLORS[0];

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const fadeable: {
    material: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
    base: THREE.Color;
  }[] = [];
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();

  const geo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  const mat = (color: string, roughness = 0.55): THREE.MeshStandardMaterial => {
    const key = `${color}:${roughness}`;
    const cached = materialCache.get(key);

    if (cached) {
      return cached;
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.02,
    });

    materialCache.set(key, material);
    materials.push(material);
    fadeable.push({ material, base: material.color.clone() });

    return material;
  };

  const glowMat = (color: string, fades: boolean): THREE.MeshBasicMaterial => {
    const material = new THREE.MeshBasicMaterial({ color });

    materials.push(material);

    if (fades) {
      fadeable.push({ material, base: material.color.clone() });
    }

    return material;
  };

  const sphereHi = geo(new THREE.SphereGeometry(1, 24, 18));
  const sphereMid = geo(new THREE.SphereGeometry(1, 18, 14));
  const sphereLo = geo(new THREE.SphereGeometry(1, 12, 9));
  const sphereTiny = geo(new THREE.SphereGeometry(1, 8, 6));

  const part = (
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
    rotation: [number, number, number] = [0, 0, 0],
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rotation);
    parent.add(mesh);

    return mesh;
  };

  const robe = params.outfitStyle === "robe";
  const tee = params.outfitStyle === "tee";
  const skin = mat(faceColor, 0.6);

  // ------------------------------------------------------------------ skeleton
  const root = new THREE.Group();
  const pelvis = new THREE.Group();

  pelvis.position.set(0, 0.66, 0);
  pelvis.name = "pelvis";
  root.add(pelvis);

  const chest = new THREE.Group();

  chest.position.set(0, 0.06, 0);
  pelvis.add(chest);

  part(
    pelvis,
    sphereMid,
    mat(pantsColor, 0.7),
    [0, -0.03, 0],
    [0.215, 0.14, 0.17],
  );

  // ------------------------------------------------------------------ torso
  const torso = new THREE.Group();

  torso.scale.z = 0.82;
  chest.add(torso);

  const torsoProfile: [number, number][] = [
    [0.23, -0.07],
    [0.28, -0.04],
    [0.315, 0.05],
    [0.345, 0.18],
    [0.35, 0.3],
    [0.31, 0.4],
    [0.2, 0.46],
    [0, 0.47],
  ];

  part(
    torso,
    geo(
      new THREE.LatheGeometry(
        torsoProfile.map(([r, y]) => new THREE.Vector2(r, y)),
        40,
      ),
    ),
    mat(topColor, 0.62),
  );

  const frontZ = 0.292;

  if (robe) {
    // A long skirt hanging from the hips, with trim at the hem, waist and neck.
    const skirt: [number, number][] = [
      [0.41, -0.58],
      [0.375, -0.42],
      [0.31, -0.2],
      [0.265, -0.04],
      [0.235, 0.04],
      [0, 0.06],
    ];

    part(
      pelvis,
      geo(
        new THREE.LatheGeometry(
          skirt.map(([r, y]) => new THREE.Vector2(r, y)),
          40,
        ),
      ),
      mat(topColor, 0.62),
      [0, 0, 0],
      [1, 1, 0.86],
    );
    part(
      pelvis,
      geo(new THREE.TorusGeometry(0.4, 0.026, 10, 40)),
      mat(accentColor, 0.5),
      [0, -0.575, 0],
      [1, 0.86, 1],
      [Math.PI / 2, 0, 0],
    );
    part(
      torso,
      geo(new THREE.TorusGeometry(0.3, 0.024, 10, 36)),
      mat(accentColor, 0.5),
      [0, 0.03, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
    part(
      torso,
      geo(new THREE.TorusGeometry(0.2, 0.024, 10, 32)),
      mat(accentColor, 0.5),
      [0, 0.44, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
  } else {
    part(
      torso,
      geo(new THREE.TorusGeometry(0.275, 0.028, 10, 40)),
      mat(accentColor, 0.5),
      [0, -0.045, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );

    // Anchor-like emblem like the one on the mascot's hoodie.
    const emblem = new THREE.Group();
    const emblemMaterial = mat(accentColor, 0.4);

    emblem.position.set(0, 0.27, frontZ + 0.003);
    torso.add(emblem);
    part(
      emblem,
      geo(new THREE.TorusGeometry(0.028, 0.008, 8, 20)),
      emblemMaterial,
      [0, 0.05, 0],
    );
    part(
      emblem,
      geo(new THREE.CylinderGeometry(0.007, 0.007, 0.12, 8)),
      emblemMaterial,
      [0, -0.005, 0],
    );
    part(
      emblem,
      geo(new THREE.CylinderGeometry(0.007, 0.007, 0.075, 8)),
      emblemMaterial,
      [0, 0.02, 0],
      [1, 1, 1],
      [0, 0, Math.PI / 2],
    );
    part(
      emblem,
      geo(new THREE.TorusGeometry(0.046, 0.008, 8, 20, Math.PI)),
      emblemMaterial,
      [0, -0.03, 0],
      [1, 1, 1],
      [0, 0, Math.PI],
    );

    part(
      torso,
      geo(new THREE.BoxGeometry(0.013, 0.46, 0.01)),
      mat(accentColor, 0.4),
      [0, 0.2, frontZ - 0.01],
    );
  }

  if (params.outfitStyle === "hoodie") {
    part(
      torso,
      geo(new THREE.TorusGeometry(0.19, 0.09, 14, 28)),
      mat(topColor, 0.65),
      [0, 0.46, -0.09],
      [1, 1, 0.9],
      [Math.PI / 2.3, 0, 0],
    );

    for (const side of [-1, 1]) {
      part(
        torso,
        geo(new THREE.CylinderGeometry(0.007, 0.007, 0.18, 6)),
        mat(accentColor, 0.5),
        [side * 0.06, 0.34, frontZ - 0.01],
      );
      part(
        torso,
        sphereTiny,
        mat(accentColor, 0.5),
        [side * 0.06, 0.245, frontZ - 0.005],
        [0.015, 0.015, 0.015],
      );
    }

    part(
      torso,
      sphereLo,
      mat(shade(topColor, -0.12), 0.7),
      [0, 0.07, frontZ - 0.012],
      [0.16, 0.075, 0.03],
    );

    for (const side of [-1, 1]) {
      part(
        torso,
        geo(new THREE.BoxGeometry(0.011, 0.12, 0.011)),
        mat(accentColor, 0.45),
        [side * 0.15, 0.09, frontZ - 0.005],
        [1, 1, 1],
        [0, 0, side * 0.4],
      );
    }
  } else if (params.outfitStyle === "jacket") {
    part(
      torso,
      geo(new THREE.TorusGeometry(0.19, 0.052, 12, 32)),
      mat(topColor, 0.65),
      [0, 0.45, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
  }

  // ------------------------------------------------------------------ neck and head
  const headPivot = new THREE.Group();

  headPivot.position.set(0, 0.42, 0);
  headPivot.name = "headPivot";
  chest.add(headPivot);
  part(headPivot, geo(capsule(0.075, 0.08, 0.14)), skin, [0, 0.1, 0]);

  const head = new THREE.Group();

  head.position.set(0, 0.47, 0);
  headPivot.add(head);

  const headGeometry = geo(new THREE.SphereGeometry(0.5, 56, 40));
  const headPositions = headGeometry.attributes.position;

  for (let i = 0; i < headPositions.count; i++) {
    const yn = headPositions.getY(i) / 0.5;
    const k = taper(yn);

    headPositions.setX(i, headPositions.getX(i) * k);
    headPositions.setZ(i, headPositions.getZ(i) * k);
  }

  headGeometry.computeVertexNormals();
  part(
    head,
    headGeometry,
    skin,
    [0, 0, 0],
    [HEAD_SCALE.x, HEAD_SCALE.y, HEAD_SCALE.z],
  );

  for (const side of [-1, 1]) {
    part(
      head,
      sphereLo,
      skin,
      [side * 0.488, -0.03, -0.02],
      [0.045, 0.08, 0.065],
    );
  }

  /** Places an object on the head's surface, facing outwards (az: left-right, el: up-down). */
  const placeOnHead = (
    object: THREE.Object3D,
    az: number,
    el: number,
    lift = 0,
  ) => {
    const cx = Math.sin(az) * Math.cos(el);
    const cy = Math.sin(el);
    const cz = Math.cos(az) * Math.cos(el);
    const k = taper(cy);

    object.position.set(
      cx * (0.5 * HEAD_SCALE.x * k + lift),
      cy * (0.5 * HEAD_SCALE.y + lift),
      cz * (0.5 * HEAD_SCALE.z * k + lift),
    );
    object.rotation.order = "YXZ";
    object.rotation.y = az;
    object.rotation.x = -el;
  };

  // ------------------------------------------------------------------ anime eyes
  const white = glowMat("#FFFFFF", false);
  const sclera = mat("#F7F5FF", 0.3);
  const irisOuter = mat(shade(eyeColor, -0.62), 0.25);
  const irisMain = mat(eyeColor, 0.25);
  const irisGlow = mat(shade(eyeColor, 0.5), 0.25);
  const pupil = mat("#120D2B", 0.3);
  const lidLine = mat("#241A44", 0.4);

  const eyeGroups: THREE.Group[] = [];
  const irisGroups: THREE.Group[] = [];

  for (const side of [-1, 1]) {
    const eye = new THREE.Group();

    placeOnHead(eye, side * 0.43, -0.03, 0);
    head.add(eye);
    eye.name = "eye";
    eyeGroups.push(eye);

    part(eye, sphereMid, sclera, [0, 0, 0], [0.125, 0.155, 0.032]);

    const iris = new THREE.Group();

    iris.name = "iris";
    eye.add(iris);
    irisGroups.push(iris);
    part(iris, sphereMid, irisOuter, [0, 0, 0.004], [0.104, 0.134, 0.034]);
    part(iris, sphereMid, irisMain, [0, -0.008, 0.009], [0.092, 0.118, 0.034]);
    part(iris, sphereMid, irisGlow, [0, -0.052, 0.013], [0.07, 0.048, 0.034]);
    part(iris, sphereMid, pupil, [0, 0.006, 0.018], [0.047, 0.066, 0.034]);

    // Highlights stay put while the iris moves, like in anime.
    part(eye, sphereLo, white, [-0.037, 0.058, 0.044], [0.036, 0.042, 0.012]);
    part(eye, sphereLo, white, [0.036, -0.054, 0.044], [0.016, 0.016, 0.01]);
    part(eye, sphereTiny, white, [0.022, 0.078, 0.044], [0.009, 0.009, 0.008]);

    // Heavy upper lid line and a few lashes flicking outwards.
    part(
      eye,
      geo(new THREE.TorusGeometry(0.128, 0.014, 8, 28, Math.PI * 1.05)),
      lidLine,
      [0, 0.005, 0.03],
      [1, 1.1, 1],
      [0, 0, -Math.PI * 0.025],
    );

    for (let i = 0; i < 3; i++) {
      part(
        eye,
        geo(new THREE.ConeGeometry(0.006, 0.05, 5)),
        lidLine,
        [side * (0.118 + i * 0.006), 0.05 + i * 0.022, 0.034],
        [1, 1, 1],
        [0, 0, -side * (1.0 + i * 0.28)],
      );
    }

    if (params.glasses) {
      part(
        eye,
        geo(new THREE.TorusGeometry(0.155, 0.011, 8, 30)),
        mat("#23262E", 0.35),
        [0, 0, 0.055],
      );
    }
  }

  if (params.glasses) {
    part(
      head,
      geo(new THREE.CylinderGeometry(0.009, 0.009, 0.1, 6)),
      mat("#23262E", 0.35),
      [0, -0.005, 0.455],
      [1, 1, 1],
      [0, 0, Math.PI / 2],
    );
  }

  // Brows, blush, nose and mouth.
  const browColor = params.face === 0 ? "#5A4B9A" : "#3B2A22";
  const brows: { mesh: THREE.Mesh; baseY: number }[] = [];

  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(
      geo(new THREE.TorusGeometry(0.07, 0.008, 6, 14, Math.PI * 0.62)),
      mat(browColor, 0.5),
    );

    placeOnHead(brow, side * 0.43, 0.31, 0);
    brow.rotation.z = Math.PI * 0.19 - side * 0.12;
    head.add(brow);
    brows.push({ mesh: brow, baseY: brow.position.y });

    const blush = new THREE.Mesh(
      geo(new THREE.CircleGeometry(0.065, 20)),
      new THREE.MeshBasicMaterial({
        color: "#FF9DB8",
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    );

    materials.push(blush.material as THREE.Material);
    placeOnHead(blush, side * 0.7, -0.2, 0.004);
    head.add(blush);
  }

  const nose = new THREE.Group();

  placeOnHead(nose, 0, -0.13, 0.002);
  head.add(nose);
  part(
    nose,
    sphereLo,
    mat(shade(faceColor, -0.1), 0.6),
    [0, 0, 0],
    [0.02, 0.013, 0.014],
  );

  const mouth = new THREE.Group();

  placeOnHead(mouth, 0, -0.345, 0.004);
  head.add(mouth);

  const smile = part(
    mouth,
    geo(new THREE.TorusGeometry(0.052, 0.007, 6, 18, Math.PI * 0.8)),
    mat("#B4506E", 0.5),
    [0, 0.03, 0],
    [1, 1, 1],
    [0, 0, Math.PI * 1.1],
  );
  const openMouth = new THREE.Group();

  openMouth.name = "openMouth";

  mouth.add(openMouth);
  part(
    openMouth,
    sphereMid,
    mat("#5C1A36", 0.4),
    [0, 0, 0],
    [0.066, 0.05, 0.022],
  );
  part(
    openMouth,
    sphereLo,
    mat("#FF6F91", 0.5),
    [0, -0.02, 0.008],
    [0.04, 0.02, 0.016],
  );
  openMouth.scale.y = 0.001;

  // ------------------------------------------------------------------ cloud hair
  const hairGroup = new THREE.Group();
  const glowDots: THREE.Mesh[] = [];
  const puffs: { mesh: THREE.Mesh; base: THREE.Vector3; phase: number }[] = [];

  head.add(hairGroup);

  let hairTop = 0.5;

  {
    const random = mulberry32(params.hairColor * 31 + 5);
    const tones = [
      mat(hairColor, 0.42),
      mat(shade(hairColor, 0.16), 0.4),
      mat(shade(hairColor, -0.14), 0.45),
    ];
    const glowMaterial = glowMat(glowColor, true);
    const dotCenters: THREE.Vector3[] = [];
    const puffGeometry = geo(new THREE.SphereGeometry(1, 18, 13));

    const addPuff = (
      direction: THREE.Vector3,
      radius: number,
      distance: number,
      withDot: boolean,
    ) => {
      const dir = direction.clone().normalize();
      const center = new THREE.Vector3(
        dir.x * distance * HEAD_SCALE.x,
        dir.y * distance * HEAD_SCALE.y,
        dir.z * distance * HEAD_SCALE.z,
      );
      const mesh = part(
        hairGroup,
        puffGeometry,
        tones[Math.floor(random() * tones.length)] ?? tones[0]!,
        [center.x, center.y, center.z],
        [radius, radius, radius],
      );

      puffs.push({ mesh, base: center.clone(), phase: random() * 6.28 });
      hairTop = Math.max(hairTop, center.y + radius);

      if (withDot && random() < 0.75) {
        const dot = part(
          hairGroup,
          sphereTiny,
          glowMaterial,
          [
            center.x + dir.x * radius * 0.97,
            center.y + dir.y * radius * 0.97,
            center.z + dir.z * radius * 0.97,
          ],
          [0.03, 0.03, 0.03],
        );

        glowDots.push(dot);
        dotCenters.push(dot.position.clone());
      }
    };

    const count = 50;
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = golden * i;
      const direction = new THREE.Vector3(
        Math.cos(angle) * ring,
        y,
        Math.sin(angle) * ring,
      );

      if ((direction.z > 0.3 && direction.y < 0.62) || direction.y < -0.2) {
        continue;
      }

      const radius = 0.17 + random() * 0.12 + (direction.y > 0.6 ? 0.04 : 0);

      addPuff(direction, radius, 0.45 + radius * 0.75, true);
    }

    // Puffs above the forehead, like the mascot's fringe.
    for (const az of [-0.5, 0, 0.5]) {
      addPuff(
        new THREE.Vector3(Math.sin(az), 0.82, Math.cos(az) * 0.6),
        0.16,
        0.62,
        true,
      );
    }

    // Faint "neural" lines between nearby lights.
    const linePoints: number[] = [];

    dotCenters.forEach((a, i) => {
      let best = -1;
      let bestDistance = 0.62;

      dotCenters.forEach((b, j) => {
        const d = a.distanceTo(b);

        if (j !== i && d < bestDistance && d > 0.08) {
          bestDistance = d;
          best = j;
        }
      });

      const other = best >= 0 ? dotCenters[best] : undefined;

      if (other) {
        linePoints.push(a.x, a.y, a.z, other.x, other.y, other.z);
      }
    });

    if (linePoints.length > 0) {
      const lineGeometry = geo(new THREE.BufferGeometry());

      lineGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePoints, 3),
      );

      const lineMaterial = new THREE.LineBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.55,
      });

      materials.push(lineMaterial);
      hairGroup.add(new THREE.LineSegments(lineGeometry, lineMaterial));
    }
  }

  // ------------------------------------------------------------------ arms
  const makeArm = (side: -1 | 1): ArmRig => {
    const shoulder = new THREE.Group();

    shoulder.position.set(side * 0.325, 0.34, 0);
    shoulder.name = side > 0 ? "shoulderPlus" : "shoulderMinus";
    chest.add(shoulder);

    const upperLength = 0.26;
    const foreLength = 0.24;
    const sleeve = mat(topColor, 0.62);
    const wide = (robe ? 1.18 : 1) * 1.18;

    // The upper arm is skin with a short sleeve over it for a t-shirt.
    part(
      shoulder,
      geo(capsule(0.066 * wide, 0.056 * wide, upperLength)),
      tee ? skin : sleeve,
    );

    if (tee) {
      part(shoulder, geo(capsule(0.082, 0.078, 0.1)), sleeve);
    }

    const elbow = new THREE.Group();

    elbow.position.set(0, -upperLength, 0);
    elbow.name = side > 0 ? "elbowPlus" : "elbowMinus";
    shoulder.add(elbow);
    part(
      elbow,
      geo(capsule(0.054 * wide, 0.044 * wide, foreLength)),
      tee ? skin : sleeve,
    );

    if (!tee) {
      part(
        elbow,
        geo(new THREE.TorusGeometry(0.047 * wide, 0.018, 10, 24)),
        mat(accentColor, 0.5),
        [0, -foreLength + 0.012, 0],
        [1, 1, 1],
        [Math.PI / 2, 0, 0],
      );
    }

    const wrist = new THREE.Group();

    wrist.position.set(0, -foreLength, 0);
    elbow.add(wrist);

    // Hand: palm, four fingers that can curl, and a thumb.
    part(wrist, sphereMid, skin, [0, -0.044, 0], [0.05, 0.062, 0.03]);

    const fingers: THREE.Group[] = [];
    const fingerGeometry = geo(capsule(0.0145, 0.0122, 0.056, 8));

    [-0.03, -0.01, 0.01, 0.03].forEach((x, i) => {
      const finger = new THREE.Group();

      finger.position.set(x, -0.096, 0);
      wrist.add(finger);
      part(
        finger,
        fingerGeometry,
        skin,
        [0, 0, 0],
        [1, 1 - Math.abs(i - 1.5) * 0.08, 1],
      );
      fingers.push(finger);
    });

    const thumb = new THREE.Group();

    thumb.position.set(-side * 0.044, -0.045, 0.014);
    thumb.rotation.z = side * 0.7;
    wrist.add(thumb);
    part(thumb, geo(capsule(0.016, 0.014, 0.045, 8)), skin);

    return { shoulder, elbow, fingers };
  };

  const armPlus = makeArm(1);
  const armMinus = makeArm(-1);

  // ------------------------------------------------------------------ legs
  const makeLeg = (side: -1 | 1): LegRig => {
    const hip = new THREE.Group();

    hip.position.set(side * 0.115, -0.03, 0);
    pelvis.add(hip);
    part(hip, geo(capsule(0.09, 0.072, 0.28)), mat(pantsColor, 0.7));
    part(
      hip,
      geo(new THREE.BoxGeometry(0.011, 0.24, 0.036)),
      mat(accentColor, 0.45),
      [side * 0.082, -0.15, 0.004],
    );

    const knee = new THREE.Group();

    knee.position.set(0, -0.28, 0);
    knee.name = side > 0 ? "kneePlus" : "kneeMinus";
    hip.add(knee);
    part(knee, geo(capsule(0.072, 0.052, 0.27)), mat(pantsColor, 0.7));
    part(
      knee,
      geo(new THREE.BoxGeometry(0.011, 0.22, 0.03)),
      mat(accentColor, 0.45),
      [side * 0.063, -0.14, 0.004],
    );

    const ankle = new THREE.Group();

    ankle.position.set(0, -0.27, 0);
    knee.add(ankle);

    // Sneaker: white sole, coloured upper, accent stripe.
    part(
      ankle,
      sphereMid,
      mat("#F4F4FA", 0.5),
      [0, -0.035, 0.05],
      [0.09, 0.036, 0.16],
    );
    part(
      ankle,
      sphereMid,
      mat(shade(topColor, -0.05), 0.55),
      [0, -0.008, 0.042],
      [0.079, 0.056, 0.135],
    );
    part(
      ankle,
      geo(new THREE.BoxGeometry(0.01, 0.034, 0.1)),
      mat(accentColor, 0.45),
      [side * 0.08, -0.012, 0.034],
    );
    part(
      ankle,
      sphereTiny,
      mat(accentColor, 0.45),
      [0, 0.014, 0.145],
      [0.045, 0.029, 0.038],
    );

    return { hip, knee, ankle };
  };

  const legPlus = makeLeg(1);
  const legMinus = makeLeg(-1);

  // Soft ground shadow.
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });

  materials.push(shadowMaterial);
  part(
    root,
    geo(new THREE.CircleGeometry(0.55, 28)),
    shadowMaterial,
    [0, 0.012, 0.02],
    [1, 1, 1],
    [-Math.PI / 2, 0, 0],
  );

  // ------------------------------------------------------------------ animation
  const pose: Record<string, number> = {
    pelvisX: 0,
    pelvisRoll: 0,
    pelvisYaw: 0,
    pelvisY: 0,
    chestX: 0,
    chestRoll: 0,
    chestYaw: 0,
    breath: 0,
    headX: 0,
    headY: 0,
    headZ: 0,
    pShX: 0,
    pShZ: -0.1,
    pElX: -0.25,
    pCurl: -0.35,
    mShX: 0,
    mShZ: 0.1,
    mElX: -0.25,
    mCurl: -0.35,
    pThigh: 0,
    pKnee: 0.05,
    pAnkle: 0,
    mThigh: 0,
    mKnee: 0.05,
    mAnkle: 0,
    gazeX: 0,
    gazeY: 0,
    brow: 0,
    mouth: 0,
    smile: 1,
    blink: 1,
  };
  const rates: Record<string, number> = {
    gazeX: 22,
    gazeY: 22,
    mouth: 18,
    smile: 8,
    brow: 8,
  };
  /** Fastest allowed movement of each joint in radians per second, so big pose changes never snap. */
  const maxSpeed: Record<string, number> = {
    pelvisYaw: 2,
    pelvisRoll: 2,
    chestX: 3,
    chestRoll: 3,
    chestYaw: 3,
    headX: 4,
    headY: 4,
    headZ: 4,
    pShX: 5,
    pShZ: 5,
    pElX: 5.5,
    mShX: 5,
    mShZ: 5,
    mElX: 5.5,
    pCurl: 5,
    mCurl: 5,
    pThigh: 8,
    mThigh: 8,
    pKnee: 8,
    mKnee: 8,
    pAnkle: 8,
    mAnkle: 8,
  };
  const target: Record<string, number> = { ...pose };

  let walkPhase = 0;
  let walkAmount = 0;
  let hairLag = 0;
  let hairLagRoll = 0;

  const animate = (
    seconds: number,
    dt: number,
    mood: AvatarMood,
    seed: number,
  ) => {
    const t = seconds + seed * 1.7;
    const s = seed * 2.3;

    walkAmount = damp(
      walkAmount,
      mood.faded ? 0 : Math.min(1, mood.speed / 1.4),
      dt * 6,
    );
    walkPhase += dt * (3.6 + mood.speed * 3.8);

    const idle = 1 - walkAmount;
    const w = Math.sin(t * 0.42 + s); // slow weight shift from one leg to the other
    const talking = mood.talking && !mood.faded;
    const listening = mood.listening && !mood.faded;

    // ---- targets
    target.pelvisX = w * 0.022 * idle;
    target.pelvisRoll = -w * 0.045 * idle;
    target.pelvisYaw = Math.sin(t * 0.3 + s) * 0.04 * idle;
    target.pelvisY = 0;
    target.chestRoll = w * 0.035 * idle;
    target.chestYaw = -pose.headY * 0.25 + Math.sin(t * 0.5) * 0.015;
    target.chestX = talking ? 0.05 : 0;
    target.breath = Math.sin(t * 1.9) * 0.5 + 0.5;

    // Where the eyes look: small jumps every second or two, towards the bot while listening.
    const gazeIndex = Math.floor(t * 0.62 + s * 0.37);

    target.gazeX = (hash01(gazeIndex) - 0.5) * 1.3;
    target.gazeY = (hash01(gazeIndex + 11) - 0.5) * 0.7;

    if (listening) {
      target.gazeX = -0.9;
      target.gazeY = 0.15;
    } else if (talking) {
      target.gazeX = (hash01(gazeIndex) - 0.5) * 0.35;
      target.gazeY = 0.05;
    }

    target.headX = talking
      ? Math.sin(t * 5.2) * 0.035 - 0.02
      : listening
        ? 0.04 + Math.sin(t * 1.6) * 0.045
        : Math.sin(t * 0.6 + s) * 0.02;
    target.headY = listening
      ? -0.3
      : target.gazeX * 0.22 + Math.sin(t * 0.37 + s) * 0.04;
    target.headZ = listening ? 0.09 : Math.sin(t * 0.5 + s) * 0.03 - w * 0.02;
    target.brow = talking
      ? 0.5 + Math.sin(t * 4) * 0.25
      : listening
        ? 0.7
        : Math.sin(t * 0.8) * 0.1;
    target.mouth = talking ? 0.25 + Math.abs(Math.sin(t * 11.5)) * 0.75 : 0;
    target.smile = talking ? 0.2 : 1;

    // Arms rest naturally with a soft bend and relaxed fingers.
    target.pShX = Math.sin(t * 0.9 + s) * 0.04;
    target.pShZ = -0.1 - Math.sin(t * 0.7 + s) * 0.02;
    target.pElX = -0.28 - Math.sin(t * 0.8) * 0.04;
    target.pCurl = -0.35;
    target.mShX = Math.sin(t * 0.9 + s + 1.5) * 0.04;
    target.mShZ = 0.1 + Math.sin(t * 0.7 + s + 1) * 0.02;
    target.mElX = -0.28 - Math.sin(t * 0.8 + 2) * 0.04;
    target.mCurl = -0.35;

    if (talking) {
      // The hand towards the microphone gestures while reciting; the other one joins in sometimes.
      const g = t * 1.9;

      target.pShX = -0.5 + Math.sin(g) * 0.18;
      target.pShZ = -0.5 + Math.sin(g * 0.7) * 0.08;
      target.pElX = -1.05 + Math.sin(g * 1.4 + 1) * 0.25;
      target.pCurl = -0.15 - Math.max(0, Math.sin(g * 1.4)) * 0.4;

      const other = Math.max(0, Math.sin(t * 0.7 + 1));

      target.mShX = -0.35 * other;
      target.mElX = -0.6 * other - 0.28;
    }

    if (listening) {
      // A hand up near the ear, as if listening closely.
      target.mShX = -0.55;
      target.mShZ = 0.55;
      target.mElX = -2.0;
      target.mCurl = -0.6;
    }

    // Standing: the unloaded leg bends a little. Walking: opposite legs and arms swing together.
    target.pThigh = Math.max(0, w) * 0.05 * idle;
    target.pKnee = 0.05 + Math.max(0, w) * 0.14 * idle;
    target.mThigh = Math.max(0, -w) * 0.05 * idle;
    target.mKnee = 0.05 + Math.max(0, -w) * 0.14 * idle;
    target.pAnkle = 0;
    target.mAnkle = 0;

    if (walkAmount > 0.02) {
      const swing = Math.sin(walkPhase) * 0.55 * walkAmount;
      const swingOpposite = -swing;
      const kneeP = Math.max(0, -Math.cos(walkPhase)) * 0.7 * walkAmount;
      const kneeM = Math.max(0, Math.cos(walkPhase)) * 0.7 * walkAmount;

      target.pThigh += swing;
      target.mThigh += swingOpposite;
      target.pKnee += kneeP;
      target.mKnee += kneeM;
      target.pAnkle = -(swing + kneeP) * 0.4;
      target.mAnkle = -(swingOpposite + kneeM) * 0.4;
      target.pShX += -swing * 0.8;
      target.mShX += -swingOpposite * 0.8;
      target.chestYaw += Math.sin(walkPhase) * 0.1 * walkAmount;
      target.pelvisYaw += -Math.sin(walkPhase) * 0.08 * walkAmount;
    }

    if (mood.faded) {
      target.chestX = 0.3;
      target.headX = 0.5;
      target.headY = 0;
      target.headZ = 0.06;
      target.pShX = 0.05;
      target.mShX = 0.05;
      target.pElX = -0.12;
      target.mElX = -0.12;
      target.pCurl = -0.15;
      target.mCurl = -0.15;
      target.pKnee = 0.25;
      target.mKnee = 0.25;
      target.pThigh = -0.12;
      target.mThigh = -0.12;
      target.pelvisY = -0.05;
      target.mouth = 0;
      target.smile = 0.3;
      target.brow = -0.3;
      target.gazeX = 0;
      target.gazeY = -0.5;
    }

    // Blinking: every few seconds, sometimes twice in a row. Faded characters keep their eyes closed.
    const blinkCycle = (t * 0.85 + s) % 3.6;
    const blinkClosed =
      blinkCycle < 0.12 ||
      (blinkCycle > 0.3 &&
        blinkCycle < 0.4 &&
        hash01(Math.floor(t * 0.85 + s) + 3) > 0.7);

    target.blink = mood.faded ? 0.12 : blinkClosed ? 0.08 : 1;

    // ---- ease towards the targets (never snap), then apply
    for (const key of Object.keys(pose)) {
      const rate =
        key === "blink" ? (target.blink < 0.5 ? 45 : 24) : (rates[key] ?? 7);

      const current = pose[key] ?? 0;
      let step = ((target[key] ?? 0) - current) * Math.min(1, dt * rate);
      const limit = maxSpeed[key];

      if (limit !== undefined) {
        const cap = limit * dt;

        step = Math.max(-cap, Math.min(cap, step));
      }

      pose[key] = current + step;
    }

    const bob = Math.abs(Math.sin(walkPhase)) * 0.04 * walkAmount;
    const breath = (pose.breath ?? 0) * (mood.faded ? 0.3 : 1);

    pelvis.position.set(pose.pelvisX ?? 0, 0.66 + bob + (pose.pelvisY ?? 0), 0);
    pelvis.rotation.set(0, pose.pelvisYaw ?? 0, pose.pelvisRoll ?? 0);
    chest.rotation.set(
      pose.chestX ?? 0,
      pose.chestYaw ?? 0,
      pose.chestRoll ?? 0,
    );
    chest.scale.set(1 + breath * 0.012, 1 + breath * 0.016, 1 + breath * 0.012);
    headPivot.rotation.set(pose.headX ?? 0, pose.headY ?? 0, pose.headZ ?? 0);

    armPlus.shoulder.rotation.set(pose.pShX ?? 0, 0, pose.pShZ ?? 0);
    armPlus.elbow.rotation.set(pose.pElX ?? 0, 0, 0);
    armMinus.shoulder.rotation.set(pose.mShX ?? 0, 0, pose.mShZ ?? 0);
    armMinus.elbow.rotation.set(pose.mElX ?? 0, 0, 0);

    armPlus.fingers.forEach((finger, i) => {
      finger.rotation.x = (pose.pCurl ?? 0) - (i % 2) * 0.12;
    });
    armMinus.fingers.forEach((finger, i) => {
      finger.rotation.x = (pose.mCurl ?? 0) - (i % 2) * 0.12;
    });

    legPlus.hip.rotation.x = pose.pThigh ?? 0;
    legPlus.knee.rotation.x = pose.pKnee ?? 0;
    legPlus.ankle.rotation.x = pose.pAnkle ?? 0;
    legMinus.hip.rotation.x = pose.mThigh ?? 0;
    legMinus.knee.rotation.x = pose.mKnee ?? 0;
    legMinus.ankle.rotation.x = pose.mAnkle ?? 0;

    // Eyes: the iris slides inside the eye, the lids close for a blink.
    const gx = (pose.gazeX ?? 0) * 0.03;
    const gy = (pose.gazeY ?? 0) * 0.024;

    for (const iris of irisGroups) {
      iris.position.set(gx, gy, 0);
    }

    for (const eye of eyeGroups) {
      eye.scale.y = pose.blink ?? 1;
    }

    for (const brow of brows) {
      brow.mesh.position.y = brow.baseY + (pose.brow ?? 0) * 0.022;
    }

    const open = Math.max(0.001, pose.mouth ?? 0);

    openMouth.scale.y = open;
    openMouth.scale.x = 1 + open * 0.15;
    smile.visible = open < 0.18;
    smile.scale.setScalar(0.85 + (pose.smile ?? 1) * 0.15);

    // Hair follows the head a moment late and its lights pulse.
    hairLag = damp(hairLag, pose.headY ?? 0, dt * 3);
    hairLagRoll = damp(hairLagRoll, pose.headZ ?? 0, dt * 2.5);
    hairGroup.rotation.y = (hairLag - (pose.headY ?? 0)) * 0.7;
    hairGroup.rotation.z =
      (hairLagRoll - (pose.headZ ?? 0)) * 0.6 + Math.sin(t * 0.9) * 0.01;

    for (const puff of puffs) {
      const wobble = mood.faded
        ? 0
        : Math.sin(t * 1.3 + puff.phase) * 0.005 * (1 + walkAmount * 1.5);

      puff.mesh.position.set(
        puff.base.x + wobble,
        puff.base.y + wobble * 0.7,
        puff.base.z,
      );
    }

    glowDots.forEach((dot, i) => {
      const pulse =
        0.03 * (1 + 0.35 * Math.sin(t * (talking ? 6 : 2.2) + i * 1.3));

      dot.scale.setScalar(mood.faded ? 0.02 : pulse);
    });
  };

  const setFaded = (faded: boolean) => {
    for (const entry of fadeable) {
      entry.material.color.copy(
        faded ? entry.base.clone().lerp(FADE_COLOR, 0.78) : entry.base,
      );
    }
  };

  const dispose = () => {
    for (const g of geometries) {
      g.dispose();
    }

    for (const m of materials) {
      m.dispose();
    }
  };

  // Start in the resting pose instead of jumping into it on the first frame.
  animate(
    0,
    1 / 60,
    { speed: 0, talking: false, listening: false, faded: false },
    0,
  );

  return {
    group: root,
    height: Math.max(0.66 + 0.06 + 0.42 + 0.47 + hairTop, 2),
    setFaded,
    animate,
    dispose,
  };
}
