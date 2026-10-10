import * as THREE from "three";

export interface PlantSceneOptions {
  width: number;
  height: number;
  leaves: number;
  flowers: number;
  hasNewLeaf: boolean;
  reducedMotion: boolean;
}

export interface PlantScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (seconds: number, userRotation: number, dragging: boolean) => void;
  dispose: () => void;
}

interface LeafPart {
  holder: THREE.Group;
  start: number;
  isNew: boolean;
}

interface PetalPart {
  mesh: THREE.Mesh;
  open: number;
}

interface FlowerPart {
  group: THREE.Group;
  petals: PetalPart[];
  start: number;
  baseScale: number;
  branch?: THREE.Mesh;
}

const STEM_BASE_Y = 0.66;
const LEAF_BASE_COLOR = 0x2f6b4f;
const LEAF_TIP_COLORS = [0x5daa7f, 0x6db88d, 0x4a9a70, 0x7cc79b];
const NEW_LEAF_TIP_COLOR = 0xa5e3bd;

const clamp = THREE.MathUtils.clamp;

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

const easeBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function shapedGeometry(
  length: number,
  width: number,
  curl: number,
  fold: number,
  baseColor: number,
  tipColor: number,
  round: number,
): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(1, 1, 6, 12);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const base = new THREE.Color(baseColor);
  const tip = new THREE.Color(tipColor);
  const mixed = new THREE.Color();

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const v = position.getY(index) + 0.5;
    const w = width * Math.pow(Math.sin(Math.PI * Math.pow(v, round)), 0.8);
    const worldX = x * 2 * w;

    position.setXYZ(
      index,
      worldX,
      v * length,
      curl * v * v * length - Math.abs(worldX) * fold,
    );
    mixed.copy(base).lerp(tip, v);
    colors[index * 3] = mixed.r;
    colors[index * 3 + 1] = mixed.g;
    colors[index * 3 + 2] = mixed.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  return geometry;
}

function surfaceMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });
}

function solidMaterial(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
}

function createFlower(scale: number): FlowerPart {
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.x = 0.75;
  group.add(tilt);

  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 24, 16),
    solidMaterial(0xe8b96a),
  );
  center.scale.y = 0.55;
  tilt.add(center);

  const rings = [
    {
      count: 9,
      length: 0.46,
      width: 0.15,
      open: 1.2,
      lift: 0,
      base: 0xf6c27b,
      tip: 0xf2a7b8,
      offset: 0,
    },
    {
      count: 9,
      length: 0.38,
      width: 0.14,
      open: 0.85,
      lift: 0.012,
      base: 0xf8d9a0,
      tip: 0xf8c9d4,
      offset: 0.5,
    },
    {
      count: 7,
      length: 0.25,
      width: 0.1,
      open: 0.5,
      lift: 0.024,
      base: 0xf2b45e,
      tip: 0xf6c27b,
      offset: 0.25,
    },
  ];
  const petals: PetalPart[] = [];

  rings.forEach((ring) => {
    for (let index = 0; index < ring.count; index += 1) {
      const pivot = new THREE.Group();
      pivot.rotation.y = ((index + ring.offset) / ring.count) * Math.PI * 2;
      pivot.position.y = ring.lift;

      const petal = new THREE.Mesh(
        shapedGeometry(
          ring.length,
          ring.width,
          0.12,
          -0.3,
          ring.base,
          ring.tip,
          1.4,
        ),
        surfaceMaterial(),
      );
      petal.rotation.x = 0.1;
      pivot.add(petal);
      tilt.add(pivot);
      petals.push({ mesh: petal, open: ring.open });
    }
  });

  group.scale.setScalar(scale);

  return { group, petals, start: 0, baseScale: scale };
}

export function createPlantScene(options: PlantSceneOptions): PlantScene {
  const { width, height, leaves, flowers, hasNewLeaf, reducedMotion } = options;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50);
  camera.position.set(0, 1.45, 6.2);
  camera.lookAt(0, 1.35, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe5d6, 0.95));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75);
  sun.position.set(2, 4, 3);
  scene.add(sun);

  const root = new THREE.Group();
  scene.add(root);

  const potProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.46, 0),
    new THREE.Vector2(0.6, 0.5),
    new THREE.Vector2(0.68, 0.52),
    new THREE.Vector2(0.68, 0.7),
    new THREE.Vector2(0.58, 0.7),
  ];
  root.add(
    new THREE.Mesh(
      new THREE.LatheGeometry(potProfile, 40),
      solidMaterial(0xc98b5e),
    ),
  );

  const soil = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 32),
    solidMaterial(0x5e4230),
  );
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = STEM_BASE_Y;
  root.add(soil);

  const stemPoints = [
    new THREE.Vector3(0, STEM_BASE_Y, 0),
    new THREE.Vector3(0.06, 1.1, 0.03),
    new THREE.Vector3(-0.05, 1.6, -0.02),
    new THREE.Vector3(0.04, 2.1, 0.02),
    new THREE.Vector3(0, 2.55, 0.04),
  ];
  const curve = new THREE.CatmullRomCurve3(stemPoints);
  const relativeCurve = new THREE.CatmullRomCurve3(
    stemPoints.map(
      (point) => new THREE.Vector3(point.x, point.y - STEM_BASE_Y, point.z),
    ),
  );

  const stemGroup = new THREE.Group();
  stemGroup.position.set(0, STEM_BASE_Y, 0);
  stemGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(relativeCurve, 56, 0.045, 8, false),
      solidMaterial(0x2f6b4f),
    ),
  );
  root.add(stemGroup);

  const leafParts: LeafPart[] = [];

  for (let index = 0; index < leaves; index += 1) {
    const position = 0.12 + (0.78 * index) / Math.max(leaves - 1, 1);
    const isNew = hasNewLeaf && index === leaves - 1;
    const size = 0.92 - 0.045 * index;
    const tipColor = isNew
      ? NEW_LEAF_TIP_COLOR
      : LEAF_TIP_COLORS[index % LEAF_TIP_COLORS.length]!;
    const mesh = new THREE.Mesh(
      shapedGeometry(
        0.78 * size,
        0.2 * size,
        0.28,
        0.35,
        LEAF_BASE_COLOR,
        tipColor,
        0.85,
      ),
      surfaceMaterial(),
    );
    mesh.rotation.x = 1.15 + (index % 2) * 0.12;

    const holder = new THREE.Group();
    holder.add(mesh);
    holder.position.copy(curve.getPoint(position));
    holder.rotation.y = index * 2.4;
    root.add(holder);
    leafParts.push({ holder, start: 0.2 + 1.5 * position + 0.1, isNew });
  }

  const flowerParts: FlowerPart[] = [];
  const tip = curve.getPoint(1);

  for (let index = 0; index < flowers; index += 1) {
    const flower = createFlower(index === 0 ? 1 : 0.7);
    flower.start = 2.1 + 0.4 * index;

    if (index === 0) {
      flower.group.position.set(tip.x, tip.y + 0.04, tip.z);
    } else {
      const origin = curve.getPoint(0.55);
      const end = new THREE.Vector3(
        origin.x + 0.55,
        origin.y + 0.5,
        origin.z + 0.08,
      );
      const branchCurve = new THREE.CatmullRomCurve3([
        origin.clone(),
        new THREE.Vector3(origin.x + 0.2, origin.y + 0.2, origin.z + 0.05),
        end,
      ]);
      flower.branch = new THREE.Mesh(
        new THREE.TubeGeometry(branchCurve, 24, 0.03, 6, false),
        solidMaterial(0x2f6b4f),
      );
      root.add(flower.branch);
      flower.group.position.copy(end);
    }

    root.add(flower.group);
    flowerParts.push(flower);
  }

  let glow: THREE.Mesh | null = null;
  const firstFlower = flowerParts[0];

  if (hasNewLeaf && firstFlower) {
    glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.75, 40),
      new THREE.MeshBasicMaterial({
        color: 0xffecbe,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.position.copy(firstFlower.group.position);
    glow.position.z -= 0.08;
    root.add(glow);
  }

  const update = (seconds: number, userRotation: number, dragging: boolean) => {
    const t = reducedMotion ? 99 : seconds;

    stemGroup.scale.y = Math.max(easeOut(clamp((t - 0.2) / 1.5, 0, 1)), 0.001);

    leafParts.forEach((part) => {
      const progress = clamp((t - part.start) / 0.6, 0, 1);
      const scale =
        part.isNew && progress >= 1
          ? 1 + 0.06 * Math.sin(t * 3)
          : Math.max(easeBack(progress), 0.001);

      part.holder.scale.setScalar(scale);
    });

    flowerParts.forEach((flower) => {
      const progress = clamp((t - flower.start) / 1.1, 0, 1);
      const open = easeBack(progress);

      flower.group.scale.setScalar(
        Math.max(0.001, easeBack(clamp(progress * 1.4, 0, 1))) *
          flower.baseScale,
      );
      flower.petals.forEach((petal) => {
        petal.mesh.rotation.x = 0.1 + (petal.open - 0.1) * open;
      });

      if (flower.branch) {
        flower.branch.scale.setScalar(
          Math.max(0.001, easeOut(clamp((t - 1.6) / 0.6, 0, 1))),
        );
      }
    });

    if (glow) {
      (glow.material as THREE.MeshBasicMaterial).opacity =
        0.5 + 0.25 * Math.sin(t * 2.2);
    }

    root.rotation.z = Math.sin(t * 1.1) * 0.025;
    root.rotation.y = userRotation + (dragging ? 0 : Math.sin(t * 0.5) * 0.3);
  };

  const dispose = () => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      const material = mesh.material as
        THREE.Material | THREE.Material[] | undefined;

      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else if (material) {
        material.dispose();
      }
    });
  };

  return { scene, camera, update, dispose };
}
