import * as THREE from "three";
import {
  ACCENT_COLORS,
  FACE_TONES,
  GLOW_COLORS,
  HAIR_COLORS,
  HAT_COLORS,
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
  /** Eliminated or gone: grey, eyes closed, head down. */
  faded: boolean;
}

export interface AvatarRig {
  /** Root of the character; the feet are at y = 0. */
  group: THREE.Group;
  /** Approximate height including hair and hat. */
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
const HEAD_Y = 1.58;
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

/**
 * The app mascot as a smooth, low-poly 3D character (about 2 units tall with hair): big head, a puffy
 * "cloud" of hair with glowing lights, and a hoodie. Colours, hair, hat and clothes come from `params`.
 */
export function createAvatar(params: AvatarParams): AvatarRig {
  const faceColor = FACE_TONES[params.face] ?? FACE_TONES[0];
  const hairColor = HAIR_COLORS[params.hairColor] ?? HAIR_COLORS[0];
  const glowColor = GLOW_COLORS[params.glow] ?? GLOW_COLORS[0];
  const topColor = OUTFIT_COLORS[params.outfit] ?? OUTFIT_COLORS[0];
  const pantsColor = PANTS_COLORS[params.pants] ?? PANTS_COLORS[0];
  const accentColor = ACCENT_COLORS[params.accent] ?? ACCENT_COLORS[0];
  const hatColor = HAT_COLORS[params.hatColor] ?? HAT_COLORS[0];

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

  /** Shaded colour material (cached per colour). */
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

  /** Unlit material for lights and highlights. */
  const glowMat = (color: string, fades: boolean): THREE.MeshBasicMaterial => {
    const material = new THREE.MeshBasicMaterial({ color });

    materials.push(material);

    if (fades) {
      fadeable.push({ material, base: material.color.clone() });
    }

    return material;
  };

  const sphereHi = geo(new THREE.SphereGeometry(1, 28, 20));
  const sphereLo = geo(new THREE.SphereGeometry(1, 14, 10));
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

  const group = new THREE.Group();
  const robe = params.outfitStyle === "robe";
  const hasHood = params.outfitStyle === "hoodie";

  // ------------------------------------------------------------------ torso
  const torso = new THREE.Group();

  torso.scale.z = 0.84;
  group.add(torso);

  const profile: [number, number][] = robe
    ? [
        [0.42, 0.1],
        [0.41, 0.22],
        [0.33, 0.5],
        [0.32, 0.72],
        [0.33, 0.9],
        [0.3, 1.04],
        [0.2, 1.1],
        [0, 1.12],
      ]
    : [
        [0.23, 0.55],
        [0.28, 0.57],
        [0.33, 0.66],
        [0.35, 0.82],
        [0.33, 0.98],
        [0.28, 1.07],
        [0.18, 1.12],
        [0, 1.13],
      ];

  part(
    torso,
    geo(
      new THREE.LatheGeometry(
        profile.map(([r, y]) => new THREE.Vector2(r, y)),
        40,
      ),
    ),
    mat(topColor, 0.62),
  );

  // Hem band and chest details.
  part(
    torso,
    geo(new THREE.TorusGeometry(robe ? 0.415 : 0.265, 0.03, 10, 40)),
    mat(accentColor, 0.5),
    [0, robe ? 0.105 : 0.565, 0],
    [1, 1, 1],
    [Math.PI / 2, 0, 0],
  );

  const frontZ = 0.295;

  if (params.outfitStyle !== "robe") {
    // Anchor-like emblem like the one on the mascot's hoodie.
    const emblem = new THREE.Group();
    const emblemMaterial = mat(accentColor, 0.4);

    emblem.position.set(0, 0.86, frontZ + 0.004);
    torso.add(emblem);
    part(
      emblem,
      geo(new THREE.TorusGeometry(0.03, 0.009, 8, 20)),
      emblemMaterial,
      [0, 0.05, 0],
    );
    part(
      emblem,
      geo(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 8)),
      emblemMaterial,
      [0, -0.005, 0],
    );
    part(
      emblem,
      geo(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8)),
      emblemMaterial,
      [0, 0.02, 0],
      [1, 1, 1],
      [0, 0, Math.PI / 2],
    );
    part(
      emblem,
      geo(new THREE.TorusGeometry(0.05, 0.009, 8, 20, Math.PI)),
      emblemMaterial,
      [0, -0.03, 0],
      [1, 1, 1],
      [0, 0, Math.PI],
    );

    // Zipper.
    part(
      torso,
      geo(new THREE.BoxGeometry(0.014, 0.5, 0.012)),
      mat(accentColor, 0.4),
      [0, 0.84, frontZ - 0.012],
    );
  } else {
    // Robe: belt and collar trim.
    part(
      torso,
      geo(new THREE.TorusGeometry(0.33, 0.028, 10, 40)),
      mat(accentColor, 0.5),
      [0, 0.78, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
    part(
      torso,
      geo(new THREE.TorusGeometry(0.19, 0.026, 10, 32)),
      mat(accentColor, 0.5),
      [0, 1.1, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
  }

  if (hasHood) {
    // Hood resting behind the neck, drawstrings and a kangaroo pocket.
    part(
      torso,
      geo(new THREE.TorusGeometry(0.19, 0.095, 14, 28)),
      mat(topColor, 0.65),
      [0, 1.1, -0.1],
      [1, 1, 0.9],
      [Math.PI / 2.4, 0, 0],
    );
    for (const side of [-1, 1]) {
      part(
        torso,
        geo(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6)),
        mat(accentColor, 0.5),
        [side * 0.07, 0.98, frontZ - 0.01],
      );
      part(
        torso,
        sphereTiny,
        mat(accentColor, 0.5),
        [side * 0.07, 0.87, frontZ - 0.005],
        [0.016, 0.016, 0.016],
      );
    }

    part(
      torso,
      sphereLo,
      mat(shade(topColor, -0.12), 0.7),
      [0, 0.7, frontZ - 0.015],
      [0.17, 0.08, 0.03],
    );

    for (const side of [-1, 1]) {
      part(
        torso,
        geo(new THREE.BoxGeometry(0.012, 0.13, 0.012)),
        mat(accentColor, 0.45),
        [side * 0.16, 0.72, frontZ - 0.005],
        [1, 1, 1],
        [0, 0, side * 0.4],
      );
    }
  } else if (params.outfitStyle === "jacket") {
    part(
      torso,
      geo(new THREE.TorusGeometry(0.19, 0.055, 12, 32)),
      mat(topColor, 0.65),
      [0, 1.09, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
    part(
      torso,
      geo(new THREE.BoxGeometry(0.3, 0.02, 0.012)),
      mat(accentColor, 0.45),
      [0, 0.62, frontZ - 0.02],
    );
  }

  // ------------------------------------------------------------------ arms
  const makeArm = (side: -1 | 1) => {
    const pivot = new THREE.Group();

    pivot.position.set(side * 0.35, 1.04, 0);
    group.add(pivot);
    part(
      pivot,
      sphereLo,
      mat(topColor, 0.62),
      [0, 0, 0],
      [0.092, 0.092, 0.092],
    );

    const sleeveLength = params.outfitStyle === "tee" ? 0.17 : 0.46;
    const radiusTop = robe ? 0.105 : 0.088;
    const radiusEnd = robe ? 0.09 : 0.077;

    part(
      pivot,
      geo(new THREE.CylinderGeometry(radiusTop, radiusEnd, sleeveLength, 22)),
      mat(topColor, 0.62),
      [0, -sleeveLength / 2, 0],
    );

    if (params.outfitStyle === "tee") {
      // Bare forearm.
      part(
        pivot,
        geo(new THREE.CylinderGeometry(0.07, 0.064, 0.3, 18)),
        mat(faceColor, 0.62),
        [0, -sleeveLength - 0.14, 0],
      );
      part(
        pivot,
        geo(new THREE.TorusGeometry(0.095, 0.022, 8, 24)),
        mat(accentColor, 0.5),
        [0, -sleeveLength + 0.01, 0],
        [1, 1, 1],
        [Math.PI / 2, 0, 0],
      );
    } else {
      part(
        pivot,
        geo(new THREE.TorusGeometry(radiusEnd + 0.004, 0.03, 10, 28)),
        mat(accentColor, 0.5),
        [0, -sleeveLength + 0.015, 0],
        [1, 1, 1],
        [Math.PI / 2, 0, 0],
      );
    }

    const handY =
      params.outfitStyle === "tee"
        ? -sleeveLength - 0.32
        : -sleeveLength - 0.05;

    part(
      pivot,
      sphereLo,
      mat(faceColor, 0.62),
      [0, handY, 0],
      [0.078, 0.078, 0.078],
    );
    part(
      pivot,
      sphereTiny,
      mat(faceColor, 0.62),
      [-side * 0.055, handY + 0.02, 0.04],
      [0.03, 0.03, 0.03],
    );

    return pivot;
  };

  const armLeft = makeArm(-1);
  const armRight = makeArm(1);

  armLeft.rotation.z = 0.14;
  armRight.rotation.z = -0.14;

  // ------------------------------------------------------------------ legs and shoes
  const makeLeg = (side: -1 | 1) => {
    const pivot = new THREE.Group();

    pivot.position.set(side * 0.12, 0.6, 0);
    group.add(pivot);
    part(
      pivot,
      geo(new THREE.CylinderGeometry(0.1, 0.085, 0.5, 20)),
      mat(pantsColor, 0.7),
      [0, -0.25, 0],
    );
    part(
      pivot,
      geo(new THREE.BoxGeometry(0.014, 0.46, 0.04)),
      mat(accentColor, 0.45),
      [side * 0.094, -0.25, 0.005],
    );

    // Sneaker: white sole, coloured upper, accent stripe.
    part(
      pivot,
      sphereLo,
      mat("#F4F4FA", 0.5),
      [0, -0.575, 0.05],
      [0.135, 0.052, 0.23],
    );
    part(
      pivot,
      sphereLo,
      mat(shade(topColor, -0.05), 0.55),
      [0, -0.53, 0.045],
      [0.122, 0.085, 0.2],
    );
    part(
      pivot,
      geo(new THREE.BoxGeometry(0.012, 0.05, 0.15)),
      mat(accentColor, 0.45),
      [side * 0.117, -0.54, 0.03],
    );
    part(
      pivot,
      sphereTiny,
      mat(accentColor, 0.45),
      [0, -0.5, 0.215],
      [0.055, 0.033, 0.045],
    );

    return pivot;
  };

  const legLeft = makeLeg(-1);
  const legRight = makeLeg(1);

  // ------------------------------------------------------------------ head
  const head = new THREE.Group();

  head.position.y = HEAD_Y;
  group.add(head);

  const faceMaterial = mat(faceColor, 0.6);

  part(
    head,
    geo(new THREE.SphereGeometry(0.5, 48, 36)),
    faceMaterial,
    [0, 0, 0],
    [HEAD_SCALE.x, HEAD_SCALE.y, HEAD_SCALE.z],
  );
  for (const side of [-1, 1]) {
    part(
      head,
      sphereLo,
      faceMaterial,
      [side * 0.495, -0.03, -0.02],
      [0.05, 0.085, 0.07],
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

    object.position.set(
      cx * (0.5 * HEAD_SCALE.x + lift),
      cy * (0.5 * HEAD_SCALE.y + lift),
      cz * (0.5 * HEAD_SCALE.z + lift),
    );
    object.rotation.order = "YXZ";
    object.rotation.y = az;
    object.rotation.x = -el;
  };

  // Big glossy eyes.
  const eyes: THREE.Group[] = [];
  const eyeDark = mat("#1B1240", 0.25);
  const eyeIris = mat("#5A47D6", 0.3);
  const eyePupil = mat("#0F0A2A", 0.3);
  const white = glowMat("#FFFFFF", false);

  for (const side of [-1, 1]) {
    const eye = new THREE.Group();

    placeOnHead(eye, side * 0.43, -0.03, 0.0);
    head.add(eye);
    part(eye, sphereHi, eyeDark, [0, 0, 0], [0.105, 0.135, 0.04]);
    part(eye, sphereHi, eyeIris, [0, -0.02, 0.022], [0.078, 0.09, 0.03]);
    part(eye, sphereHi, eyePupil, [0, -0.006, 0.034], [0.05, 0.062, 0.03]);
    part(eye, sphereLo, white, [-0.032, 0.05, 0.05], [0.036, 0.04, 0.012]);
    part(eye, sphereLo, white, [0.03, -0.045, 0.05], [0.016, 0.016, 0.01]);
    eyes.push(eye);

    if (params.glasses) {
      part(
        eye,
        geo(new THREE.TorusGeometry(0.128, 0.011, 8, 28)),
        mat("#23262E", 0.35),
        [0, 0, 0.055],
      );
    }
  }

  if (params.glasses) {
    part(
      head,
      geo(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 6)),
      mat("#23262E", 0.35),
      [0, -0.01, 0.455],
      [1, 1, 1],
      [0, 0, Math.PI / 2],
    );
  }

  // Brows, blush and mouth.
  const browColor = params.face === 0 ? "#5A4B9A" : "#3B2A22";

  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(
      geo(new THREE.TorusGeometry(0.065, 0.009, 6, 14, Math.PI * 0.7)),
      mat(browColor, 0.5),
    );

    placeOnHead(brow, side * 0.43, 0.3, 0.0);
    brow.rotation.z = Math.PI * 0.15 - side * 0.1;
    head.add(brow);

    const blush = new THREE.Mesh(
      geo(new THREE.CircleGeometry(0.06, 20)),
      new THREE.MeshBasicMaterial({
        color: "#FF9DB8",
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );

    materials.push(blush.material as THREE.Material);
    placeOnHead(blush, side * 0.7, -0.2, 0.004);
    head.add(blush);
  }

  const mouth = new THREE.Group();

  placeOnHead(mouth, 0, -0.36, 0.004);
  head.add(mouth);
  const mouthShape = part(
    mouth,
    sphereHi,
    mat("#6A1D3A", 0.4),
    [0, 0, 0],
    [0.078, 0.05, 0.028],
  );

  part(
    mouth,
    sphereLo,
    mat("#FF6F91", 0.5),
    [0, -0.018, 0.012],
    [0.045, 0.02, 0.02],
  );

  // ------------------------------------------------------------------ hair
  const hairGroup = new THREE.Group();
  const glowDots: THREE.Mesh[] = [];

  head.add(hairGroup);

  const hatHidesTop =
    params.hat === "beanie" ||
    params.hat === "cap" ||
    params.hat === "kufi" ||
    params.hat === "grad";
  const showHair = params.hairStyle !== "none" && params.hat !== "hijab";
  let hairTop = 0.5;

  if (showHair) {
    const random = mulberry32(
      params.hairColor * 31 + params.hairStyle.length * 7 + 5,
    );
    const tones = [
      mat(hairColor, 0.42),
      mat(shade(hairColor, 0.16), 0.4),
      mat(shade(hairColor, -0.14), 0.45),
    ];
    const glowMaterial = glowMat(glowColor, true);
    const dotCenters: THREE.Vector3[] = [];

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
      const puff = part(
        hairGroup,
        sphereLo,
        tones[Math.floor(random() * tones.length)] ?? tones[0]!,
        [center.x, center.y, center.z],
        [radius, radius, radius],
      );

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

      return puff;
    };

    const count = params.hairStyle === "short" ? 36 : 50;
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
      const facing = direction.z > 0.3 && direction.y < 0.62;

      if (facing) {
        continue;
      }

      if (params.hairStyle === "short") {
        if (direction.y < 0.3) {
          continue;
        }

        addPuff(direction, 0.13 + random() * 0.06, 0.47 + 0.1, true);
        continue;
      }

      if (direction.y < -0.2 && params.hairStyle !== "long") {
        continue;
      }

      if (hatHidesTop && direction.y > 0.32) {
        continue;
      }

      const radius = 0.17 + random() * 0.12 + (direction.y > 0.6 ? 0.04 : 0);

      addPuff(direction, radius, 0.45 + radius * 0.75, true);
    }

    // Puffs above the forehead, like the mascot's fringe.
    if (params.hairStyle !== "short" && !hatHidesTop) {
      for (const az of [-0.5, 0, 0.5]) {
        addPuff(
          new THREE.Vector3(Math.sin(az), 0.82, Math.cos(az) * 0.6),
          0.16,
          0.62,
          true,
        );
      }
    } else if (params.hairStyle === "short") {
      for (const az of [-0.4, 0, 0.4]) {
        addPuff(
          new THREE.Vector3(Math.sin(az), 0.8, Math.cos(az) * 0.7),
          0.12,
          0.56,
          false,
        );
      }
    }

    if (params.hairStyle === "long") {
      for (let i = 0; i < 12; i++) {
        const angle = Math.PI * (0.55 + (i / 11) * 0.9) + Math.PI / 2;
        const drop = -0.35 - (i % 3) * 0.28;
        const radius = 0.2 + random() * 0.07;

        addPuff(
          new THREE.Vector3(
            Math.cos(angle) * 0.95,
            drop,
            -Math.abs(Math.sin(angle)) * 0.9 - 0.15,
          ),
          radius,
          0.62,
          false,
        );
      }
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

  // ------------------------------------------------------------------ hats
  const hatGroup = new THREE.Group();

  head.add(hatGroup);

  const hatMat = mat(hatColor, 0.55);

  if (params.hat === "beanie") {
    part(
      hatGroup,
      geo(
        new THREE.SphereGeometry(0.54, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
      ),
      hatMat,
      [0, 0.2, -0.01],
      [1, 0.86, 1],
    );
    part(
      hatGroup,
      geo(new THREE.TorusGeometry(0.535, 0.06, 12, 40)),
      mat(shade(hatColor, -0.1), 0.6),
      [0, 0.2, -0.01],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
    part(
      hatGroup,
      sphereLo,
      mat(shade(hatColor, 0.2), 0.7),
      [0, 0.2 + 0.54 * 0.86 + 0.04, -0.01],
      [0.1, 0.1, 0.1],
    );
    hairTop = Math.max(hairTop, 0.78);
  } else if (params.hat === "cap") {
    part(
      hatGroup,
      geo(
        new THREE.SphereGeometry(0.53, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
      ),
      hatMat,
      [0, 0.2, -0.01],
      [1, 0.9, 1],
    );
    part(
      hatGroup,
      geo(
        new THREE.CylinderGeometry(
          0.36,
          0.36,
          0.035,
          32,
          1,
          false,
          -Math.PI / 2,
          Math.PI,
        ),
      ),
      mat(shade(hatColor, -0.12), 0.55),
      [0, 0.2, 0.2],
      [1.05, 1, 1],
      [0.12, 0, 0],
    );
    part(
      hatGroup,
      sphereLo,
      mat(shade(hatColor, -0.2), 0.6),
      [0, 0.2 + 0.53 * 0.9 + 0.01, -0.01],
      [0.045, 0.045, 0.045],
    );
    hairTop = Math.max(hairTop, 0.72);
  } else if (params.hat === "kufi") {
    const kufiTheta = Math.PI * 0.43;

    part(
      hatGroup,
      geo(
        new THREE.SphereGeometry(0.515, 40, 16, 0, Math.PI * 2, 0, kufiTheta),
      ),
      hatMat,
      [0, 0.03, -0.01],
      [1, 0.93, 1],
    );
    part(
      hatGroup,
      geo(new THREE.TorusGeometry(0.515 * Math.sin(kufiTheta), 0.026, 8, 40)),
      mat(accentColor, 0.5),
      [0, 0.03 + 0.515 * 0.93 * Math.cos(kufiTheta), -0.01],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    );
    hairTop = Math.max(hairTop, 0.56);
  } else if (params.hat === "hijab") {
    part(
      hatGroup,
      geo(new THREE.SphereGeometry(0.58, 40, 28)),
      hatMat,
      [0, -0.02, -0.15],
      [1, 1.02, 0.97],
    );
    part(
      hatGroup,
      geo(new THREE.CylinderGeometry(0.47, 0.54, 0.42, 36)),
      hatMat,
      [0, -0.55, -0.1],
      [1, 1, 0.9],
    );
    hairTop = Math.max(hairTop, 0.58);
  } else if (params.hat === "grad") {
    part(
      hatGroup,
      geo(new THREE.CylinderGeometry(0.35, 0.4, 0.16, 28)),
      hatMat,
      [0, 0.46, 0],
    );
    part(
      hatGroup,
      geo(new THREE.BoxGeometry(1.0, 0.055, 1.0)),
      hatMat,
      [0, 0.58, 0],
      [1, 1, 1],
      [0, Math.PI / 4, 0],
    );
    part(
      hatGroup,
      sphereLo,
      mat("#E0B94A", 0.4),
      [0, 0.62, 0],
      [0.04, 0.04, 0.04],
    );
    part(
      hatGroup,
      geo(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 6)),
      mat("#E0B94A", 0.4),
      [0.6, 0.43, 0],
    );
    part(
      hatGroup,
      geo(new THREE.CylinderGeometry(0.035, 0.022, 0.11, 10)),
      mat("#E0B94A", 0.4),
      [0.6, 0.22, 0],
    );
    hairTop = Math.max(hairTop, 0.66);
  } else if (params.hat === "crown") {
    const gold = mat("#E0B94A", 0.32);
    const base = hairTop > 0.7 ? hairTop - 0.1 : 0.5;

    part(hatGroup, geo(new THREE.CylinderGeometry(0.36, 0.4, 0.16, 32)), gold, [
      0,
      base,
      0,
    ]);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const x = Math.sin(angle) * 0.36;
      const z = Math.cos(angle) * 0.36;

      part(hatGroup, geo(new THREE.ConeGeometry(0.07, 0.2, 10)), gold, [
        x,
        base + 0.17,
        z,
      ]);
      part(
        hatGroup,
        sphereTiny,
        mat(hatColor, 0.3),
        [x, base + 0.29, z],
        [0.032, 0.032, 0.032],
      );
    }

    hairTop = Math.max(hairTop, base + 0.3);
  }

  // Soft ground shadow.
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });

  materials.push(shadowMaterial);
  part(
    group,
    geo(new THREE.CircleGeometry(0.55, 28)),
    shadowMaterial,
    [0, 0.012, 0.02],
    [1, 1, 1],
    [-Math.PI / 2, 0, 0],
  );

  // ------------------------------------------------------------------ animation
  let walkPhase = 0;
  let walkAmount = 0;
  let headX = 0;
  let headY = 0;
  let headZ = 0;
  let mouthOpen = 0.45;
  let blink = 1;
  let rightArmX = 0;
  let rightArmZ = -0.14;
  let leftArmZ = 0.14;

  const animate = (
    seconds: number,
    dt: number,
    mood: AvatarMood,
    seed: number,
  ) => {
    const t = seconds + seed * 1.7;
    const k = dt * 9;

    walkAmount = damp(walkAmount, Math.min(1, mood.speed / 1.4), dt * 6);
    walkPhase += dt * (4 + mood.speed * 5);

    if (mood.faded) {
      headX = damp(headX, 0.38, k);
      headY = damp(headY, 0, k);
      headZ = damp(headZ, 0.05, k);
      blink = damp(blink, 0.08, k);
      mouthOpen = damp(mouthOpen, 0.2, k);
      rightArmX = damp(rightArmX, 0, k);
      rightArmZ = damp(rightArmZ, -0.1, k);
      leftArmZ = damp(leftArmZ, 0.1, k);
      walkAmount = 0;
    } else {
      // Blink every few seconds.
      const blinkTime = (t * 0.9) % 3.4;
      const blinkTarget = blinkTime < 0.13 ? 0.08 : 1;

      blink = damp(blink, blinkTarget, blinkTarget < 1 ? dt * 40 : dt * 22);

      const talking = mood.talking;
      const headXTarget = talking
        ? Math.sin(t * 5.5) * 0.05 - 0.02
        : Math.sin(t * 0.9) * 0.015;
      const headYTarget = mood.listening ? -0.28 : Math.sin(t * 0.55) * 0.05;
      const headZTarget = mood.listening ? 0.1 : Math.sin(t * 0.8) * 0.03;

      headX = damp(headX, headXTarget, k);
      headY = damp(headY, headYTarget, k);
      headZ = damp(headZ, headZTarget, k);

      const mouthTarget = talking
        ? 0.45 + Math.abs(Math.sin(t * 12.5)) * 0.85
        : 0.5 + Math.sin(t * 1.4) * 0.03;

      mouthOpen = damp(mouthOpen, mouthTarget, dt * 18);

      // The right hand rises towards the microphone while reciting.
      rightArmX = damp(
        rightArmX,
        talking ? -1.0 + Math.sin(t * 4.2) * 0.1 : 0,
        dt * 6,
      );
      rightArmZ = damp(
        rightArmZ,
        talking ? -0.3 : -0.14 - Math.sin(t * 1.6) * 0.02,
        dt * 6,
      );
      leftArmZ = damp(leftArmZ, 0.14 + Math.sin(t * 1.6 + 1) * 0.02, dt * 6);
    }

    const swing = Math.sin(walkPhase) * 0.6 * walkAmount;

    legLeft.rotation.x = swing;
    legRight.rotation.x = -swing;
    armLeft.rotation.x = -swing * 0.8;
    armLeft.rotation.z = leftArmZ;
    armRight.rotation.x = rightArmX + (mood.talking ? 0 : swing * 0.8);
    armRight.rotation.z = rightArmZ;

    const bob = Math.abs(Math.sin(walkPhase)) * 0.045 * walkAmount;
    const breathe = mood.faded ? 0 : Math.sin(t * 2) * 0.012;

    group.position.y = bob;
    torso.scale.y = 1 + breathe;
    head.position.y = HEAD_Y + breathe * 0.6;
    head.rotation.set(headX, headY, headZ);

    for (const eye of eyes) {
      eye.scale.y = blink;
    }

    mouth.scale.y = mouthOpen / 0.5;
    mouthShape.scale.x = 0.078 * (1 + (mouthOpen - 0.5) * 0.1);

    // The hair breathes a little and its lights pulse.
    hairGroup.rotation.z = Math.sin(t * 0.9) * 0.012;
    glowDots.forEach((dot, i) => {
      const pulse =
        0.03 * (1 + 0.35 * Math.sin(t * (mood.talking ? 6 : 2.2) + i * 1.3));

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

  return {
    group,
    height: Math.max(HEAD_Y + hairTop, 2),
    setFaded,
    animate,
    dispose,
  };
}
