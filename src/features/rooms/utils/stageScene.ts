import * as THREE from "three";
import { sanitizeAvatar, type AvatarParams } from "@/features/rooms/avatar";
import {
  createAvatar,
  type AvatarMood,
  type AvatarRig,
} from "@/features/rooms/utils/avatarModel";

export interface StagePlayer {
  userId: number;
  avatar: AvatarParams;
  /** Eliminated or gone players are greyed out and stop moving. */
  faded: boolean;
}

export interface StageState {
  players: StagePlayer[];
  /** The player whose turn it is; they walk up to the microphone. */
  turnUserId: number | null;
  /** The bot is playing its ayah (the floating bot glows and sends out rings). */
  speakerPlaying: boolean;
  /** The player at the microphone is reciting right now. */
  reciting: boolean;
}

export interface StageScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  setState: (state: StageState) => void;
  update: (seconds: number) => void;
  dispose: () => void;
}

interface Entry {
  rig: AvatarRig;
  key: string;
  speed: number;
}

/** Where the player in turn stands (in front of the microphone). */
const FRONT = new THREE.Vector3(0, 0, 0.7);
/** Slightly to one side so the speaker's mouth stays visible; the raised hand reaches for it. */
const MIC_POSITION = new THREE.Vector3(0.42, 0, 1.45);

/** Spots for players who are waiting, so the middle stays free for whoever is at the microphone. */
const WAITING_SLOTS: readonly [number, number][] = [
  [-1.55, -1.3],
  [1.55, -1.3],
  [-3.0, -1.8],
  [3.0, -1.8],
  [-0.8, -2.9],
  [0.8, -2.9],
  [0, -4],
];

function avatarKey(player: StagePlayer): string {
  return JSON.stringify(player.avatar);
}

function lights(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x7a6bd8, 0.6));

  const key = new THREE.DirectionalLight(0xffffff, 0.8);

  key.position.set(3, 6, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x88aaff, 0.5);

  rim.position.set(-4, 3, -4);
  scene.add(rim);
}

export function createStageScene(options: {
  width: number;
  height: number;
  floorColor: string;
}): StageScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    38,
    options.width / options.height,
    0.1,
    60,
  );

  camera.position.set(0, 2.7, 7.0);
  camera.lookAt(0, 1.2, 0.5);
  lights(scene);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const geo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const standard = (
    color: number | string,
    roughness = 0.5,
    metalness = 0,
  ): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });

    materials.push(m);
    return m;
  };
  const basic = (
    color: number | string,
    extra: THREE.MeshBasicMaterialParameters = {},
  ): THREE.MeshBasicMaterial => {
    const m = new THREE.MeshBasicMaterial({ color, ...extra });

    materials.push(m);
    return m;
  };

  // Floor with a glowing edge and a mark where the speaker stands.
  const floor = new THREE.Mesh(
    geo(new THREE.CircleGeometry(4.6, 56)),
    standard(options.floorColor, 0.85),
  );

  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const edge = new THREE.Mesh(
    geo(new THREE.TorusGeometry(4.55, 0.035, 8, 80)),
    basic(0x35d0e8, { transparent: true, opacity: 0.65 }),
  );

  edge.rotation.x = -Math.PI / 2;
  edge.position.y = 0.02;
  scene.add(edge);

  const markMaterial = basic(0x35d0e8, {
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mark = new THREE.Mesh(
    geo(new THREE.RingGeometry(0.55, 0.68, 48)),
    markMaterial,
  );

  mark.rotation.x = -Math.PI / 2;
  mark.position.set(FRONT.x, 0.025, FRONT.z);
  scene.add(mark);

  // Spotlight from above onto the microphone spot.
  const beamMaterial = basic(0xcfe6ff, {
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(
    geo(new THREE.CylinderGeometry(0.3, 1.15, 5, 36, 1, true)),
    beamMaterial,
  );

  beam.position.set(FRONT.x, 2.5, FRONT.z + 0.3);
  scene.add(beam);

  // The microphone on a stand, leaning towards the speaker.
  const mic = new THREE.Group();

  mic.position.copy(MIC_POSITION);
  scene.add(mic);

  const dark = standard(0x2b2f3a, 0.4, 0.35);
  const lightMetal = standard(0x9aa3b2, 0.35, 0.5);

  const base = new THREE.Mesh(
    geo(new THREE.CylinderGeometry(0.3, 0.34, 0.05, 36)),
    dark,
  );

  base.position.y = 0.025;
  mic.add(base);

  const pole = new THREE.Mesh(
    geo(new THREE.CylinderGeometry(0.02, 0.022, 1.2, 14)),
    lightMetal,
  );

  pole.position.y = 0.65;
  mic.add(pole);

  const micHead = new THREE.Group();

  micHead.position.set(0, 1.36, 0);
  micHead.rotation.set(-0.35, 0, 0.6);
  mic.add(micHead);

  const capsule = new THREE.Mesh(
    geo(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 28)),
    dark,
  );

  micHead.add(capsule);

  for (const y of [0.15, -0.15]) {
    const cap = new THREE.Mesh(
      geo(new THREE.SphereGeometry(0.08, 24, 16)),
      dark,
    );

    cap.position.y = y;
    micHead.add(cap);
  }

  for (const y of [-0.09, -0.03, 0.03, 0.09, 0.15, 0.21]) {
    const band = new THREE.Mesh(
      geo(new THREE.TorusGeometry(0.0805, 0.006, 6, 28)),
      lightMetal,
    );

    band.position.y = y;
    band.rotation.x = Math.PI / 2;
    micHead.add(band);
  }

  const ledMaterial = basic(0x555a66);
  const led = new THREE.Mesh(
    geo(new THREE.TorusGeometry(0.088, 0.012, 8, 28)),
    ledMaterial,
  );

  led.position.y = -0.2;
  led.rotation.x = Math.PI / 2;
  micHead.add(led);

  const mount = new THREE.Mesh(
    geo(new THREE.SphereGeometry(0.035, 12, 10)),
    lightMetal,
  );

  mount.position.set(0, 1.25, 0);
  mic.add(mount);

  // The bot: a little floating orb that glows while it plays the ayah.
  const bot = new THREE.Group();

  bot.position.set(-2.5, 2.4, 0.2);
  scene.add(bot);

  const orbMaterial = basic(0x7fd6ff);
  const orb = new THREE.Mesh(
    geo(new THREE.SphereGeometry(0.24, 24, 18)),
    orbMaterial,
  );

  bot.add(orb);

  const botEyeMaterial = basic(0x1b1240);
  const botEyeShine = basic(0xffffff);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      geo(new THREE.SphereGeometry(0.045, 12, 10)),
      botEyeMaterial,
    );

    eye.position.set(side * 0.09, 0.03, 0.2);
    bot.add(eye);

    const shine = new THREE.Mesh(
      geo(new THREE.SphereGeometry(0.014, 8, 6)),
      botEyeShine,
    );

    shine.position.set(side * 0.09 - 0.012, 0.045, 0.24);
    bot.add(shine);
  }

  const ringGeometry = geo(new THREE.TorusGeometry(0.34, 0.015, 8, 36));
  const rings: THREE.Mesh[] = [0, 1, 2].map(() => {
    const ring = new THREE.Mesh(
      ringGeometry,
      basic(0x7fd6ff, { transparent: true, opacity: 0, depthWrite: false }),
    );

    bot.add(ring);
    return ring;
  });

  const entries = new Map<number, Entry>();
  let state: StageState = {
    players: [],
    turnUserId: null,
    speakerPlaying: false,
    reciting: false,
  };
  let lastSeconds = 0;
  let beamLevel = 0;

  const arcPosition = (index: number, count: number): THREE.Vector3 => {
    const spacing = Math.min(1.6, 7.5 / Math.max(count, 1));
    const offset = index - (count - 1) / 2;

    return new THREE.Vector3(
      offset * spacing,
      0,
      -1.6 + offset * offset * 0.12,
    );
  };

  /** Where a player stands when not at the microphone. */
  const slotFor = (
    player: StagePlayer,
    waitingIndex: number,
    index: number,
    count: number,
    frontTaken: boolean,
  ): THREE.Vector3 => {
    if (!frontTaken) {
      return arcPosition(index, count);
    }

    const slot =
      WAITING_SLOTS[Math.min(waitingIndex, WAITING_SLOTS.length - 1)]!;

    return new THREE.Vector3(slot[0], 0, slot[1]);
  };

  const setState = (next: StageState) => {
    state = next;
    const wanted = new Set(next.players.map((p) => p.userId));

    for (const [id, entry] of entries) {
      if (!wanted.has(id)) {
        scene.remove(entry.rig.group);
        entry.rig.dispose();
        entries.delete(id);
      }
    }

    next.players.forEach((player, index) => {
      const key = avatarKey(player);
      const existing = entries.get(player.userId);

      if (existing && existing.key === key) {
        existing.rig.setFaded(player.faded);
        return;
      }

      const start = existing
        ? existing.rig.group.position.clone()
        : arcPosition(index, next.players.length).add(
            new THREE.Vector3(0, 0, -3.5),
          );

      if (existing) {
        scene.remove(existing.rig.group);
        existing.rig.dispose();
      }

      const rig = createAvatar(player.avatar);

      rig.group.position.copy(start);
      rig.setFaded(player.faded);
      scene.add(rig.group);
      entries.set(player.userId, { rig, key, speed: 0 });
    });
  };

  const update = (seconds: number) => {
    const dt = Math.min(0.1, Math.max(0.001, seconds - lastSeconds));

    lastSeconds = seconds;

    const count = state.players.length;
    const blend = Math.min(1, dt * 3.2);
    const frontPlayer = state.players.find(
      (p) => p.userId === state.turnUserId && !p.faded,
    );
    let waitingIndex = 0;

    state.players.forEach((player, index) => {
      const entry = entries.get(player.userId);

      if (!entry) {
        return;
      }

      const { rig } = entry;
      const inFront = frontPlayer?.userId === player.userId;
      const target = inFront
        ? FRONT
        : slotFor(
            player,
            waitingIndex,
            index,
            count,
            frontPlayer !== undefined,
          );

      if (!inFront) {
        waitingIndex += 1;
      }

      const before = rig.group.position.clone();

      rig.group.position.x += (target.x - rig.group.position.x) * blend;
      rig.group.position.z += (target.z - rig.group.position.z) * blend;

      const moved = Math.hypot(
        rig.group.position.x - before.x,
        rig.group.position.z - before.z,
      );

      entry.speed += (moved / dt - entry.speed) * Math.min(1, dt * 8);

      const scaleTarget = player.faded
        ? 0.74
        : inFront
          ? 1
          : count > 6
            ? 0.7
            : 0.78;
      const scale =
        rig.group.scale.x + (scaleTarget - rig.group.scale.x) * blend;

      rig.group.scale.setScalar(scale);

      // Walk towards the target while looking the way they move, then face the audience.
      const dx = target.x - rig.group.position.x;
      const dz = target.z - rig.group.position.z;
      const walking = entry.speed > 0.35;
      const faceYaw = inFront ? 0 : -rig.group.position.x * 0.1;
      const walkYaw = Math.atan2(dx, dz);
      const yawTarget =
        walking && Math.hypot(dx, dz) > 0.25 ? walkYaw : faceYaw;
      let diff = yawTarget - rig.group.rotation.y;

      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      rig.group.rotation.y += diff * Math.min(1, dt * 7);

      const mood: AvatarMood = {
        speed: entry.speed,
        talking: inFront && state.reciting,
        listening: inFront && state.speakerPlaying,
        faded: player.faded,
      };

      rig.animate(seconds, dt, mood, index);
    });

    // Microphone: the light turns red and pulses while someone recites.
    const live = frontPlayer !== undefined && state.reciting;

    ledMaterial.color.setHex(
      live ? (Math.sin(seconds * 8) > -0.2 ? 0xff4d5e : 0x992c38) : 0x555a66,
    );
    micHead.rotation.x = -0.35 + (live ? Math.sin(seconds * 9) * 0.015 : 0);

    // Spotlight and floor mark follow whoever is at the microphone.
    beamLevel += ((frontPlayer ? 0.13 : 0) - beamLevel) * Math.min(1, dt * 4);
    beamMaterial.opacity = beamLevel;
    markMaterial.opacity = frontPlayer
      ? 0.35 + Math.sin(seconds * 3) * 0.12
      : 0.15;

    // The bot floats and glows while it plays its ayah.
    bot.position.y = 2.4 + Math.sin(seconds * 1.4) * 0.07;
    orb.scale.setScalar(
      state.speakerPlaying ? 1 + Math.abs(Math.sin(seconds * 14)) * 0.12 : 1,
    );
    orbMaterial.color.setHex(state.speakerPlaying ? 0xa6e9ff : 0x7fd6ff);

    rings.forEach((ring, i) => {
      const material = ring.material as THREE.MeshBasicMaterial;

      if (!state.speakerPlaying) {
        material.opacity = 0;
        return;
      }

      const progress = (seconds * 0.9 + i / rings.length) % 1;

      ring.scale.setScalar(0.8 + progress * 1.8);
      material.opacity = (1 - progress) * 0.6;
    });
  };

  const dispose = () => {
    for (const entry of entries.values()) {
      scene.remove(entry.rig.group);
      entry.rig.dispose();
    }

    entries.clear();

    for (const g of geometries) {
      g.dispose();
    }

    for (const m of materials) {
      m.dispose();
    }
  };

  return { scene, camera, setState, update, dispose };
}

/** One character on a small stage that turns slowly; used by the character editor. */
export function createAvatarPreviewScene(options: {
  width: number;
  height: number;
  avatar: AvatarParams;
}): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (seconds: number, userRotation: number, dragging: boolean) => void;
  setAvatar: (avatar: AvatarParams) => void;
  dispose: () => void;
} {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    30,
    options.width / options.height,
    0.1,
    40,
  );

  camera.position.set(0, 1.3, 6.4);
  camera.lookAt(0, 1.12, 0);
  lights(scene);

  const discGeometry = new THREE.CircleGeometry(1.1, 40);
  const discMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    transparent: true,
    opacity: 0.55,
  });
  const disc = new THREE.Mesh(discGeometry, discMaterial);

  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.005;
  scene.add(disc);

  let rig = createAvatar(options.avatar);
  let lastSeconds = 0;

  scene.add(rig.group);

  const setAvatar = (avatar: AvatarParams) => {
    const yaw = rig.group.rotation.y;

    scene.remove(rig.group);
    rig.dispose();
    rig = createAvatar(sanitizeAvatar(avatar));
    rig.group.rotation.y = yaw;
    scene.add(rig.group);
  };

  const update = (seconds: number, userRotation: number, dragging: boolean) => {
    const dt = Math.min(0.1, Math.max(0.001, seconds - lastSeconds));

    lastSeconds = seconds;
    rig.group.rotation.y = dragging
      ? userRotation
      : userRotation + Math.sin(seconds * 0.6) * 0.4;

    // Says a few words every now and then so the mouth and arm can be seen.
    rig.animate(
      seconds,
      dt,
      { speed: 0, talking: seconds % 9 > 7, listening: false, faded: false },
      0,
    );
  };

  const dispose = () => {
    scene.remove(rig.group);
    rig.dispose();
    discGeometry.dispose();
    discMaterial.dispose();
  };

  return { scene, camera, update, setAvatar, dispose };
}
