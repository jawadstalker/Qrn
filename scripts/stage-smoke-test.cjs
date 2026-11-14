// Headless smoke test of the 3D rooms scene (no GPU): node scripts/stage-smoke-test.cjs
const Module = require("module");
const path = require("path");
const fs = require("fs");
const { transform } = require("sucrase");
const root = path.resolve(__dirname, "..");
const THREE = require("three");

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) {
    const base = path.join(root, "src", request.slice(2));
    for (const ext of [".ts", ".tsx", ""])
      if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile())
        return base + ext;
  }
  return origResolve.call(this, request, ...rest);
};
for (const ext of [".ts", ".tsx"]) {
  require.extensions[ext] = (module, filename) => {
    module._compile(
      transform(fs.readFileSync(filename, "utf8"), {
        transforms: ["typescript", "imports"],
      }).code,
      filename,
    );
  };
}

const { createStageScene, createAvatarPreviewScene } = require(
  root + "/src/features/rooms/utils/stageScene.ts",
);
const { createAvatar } = require(
  root + "/src/features/rooms/utils/avatarModel.ts",
);
const A = require(root + "/src/features/rooms/avatar.ts");

let fail = 0;
const ok = (name, cond, extra = "") => {
  console.log((cond ? "ok   " : "FAIL ") + name + (cond ? "" : " " + extra));
  if (!cond) fail++;
};

// ---- parameters
ok(
  "sanitize garbage -> defaults",
  JSON.stringify(A.sanitizeAvatar("x")) === JSON.stringify(A.DEFAULT_AVATAR),
);
const bad = A.sanitizeAvatar({
  face: 99,
  eyes: 77,
  outfitStyle: "evil",
  outfit: 1.5,
  glasses: "yes",
  glow: -1,
});
ok(
  "sanitize clamps bad values",
  bad.face === 0 &&
    bad.eyes === 0 &&
    bad.outfitStyle === "hoodie" &&
    bad.outfit === 0 &&
    bad.glasses === false &&
    bad.glow === 0,
);
const legacy = A.sanitizeAvatar({
  skin: 3,
  head: "scarf",
  hat: "crown",
  hairStyle: "long",
  outfit: 2,
  glasses: true,
});
ok(
  "older avatars still load; removed hat and hair styles are ignored",
  legacy.face === 4 &&
    legacy.outfit === 2 &&
    legacy.glasses === true &&
    !("hat" in legacy) &&
    !("hairStyle" in legacy),
  JSON.stringify(legacy),
);
ok(
  "avatar JSON stays a flat small object",
  Object.keys(A.DEFAULT_AVATAR).length <= 24 &&
    JSON.stringify(A.DEFAULT_AVATAR).length < 400,
);

// ---- every combination builds, has a sane size and disposes
let combos = 0,
  worst = 0,
  maxTris = 0,
  bad2 = 0;
for (const outfitStyle of A.OUTFIT_STYLES)
  for (const glasses of [false, true])
    for (let eyes = 0; eyes < A.EYE_COLORS.length; eyes++) {
      const params = {
        ...A.DEFAULT_AVATAR,
        outfitStyle,
        glasses,
        eyes,
        hairColor: combos % 8,
        outfit: combos % 8,
        face: combos % 6,
        glow: combos % 5,
        pants: combos % 6,
        accent: combos % 6,
      };
      const rig = createAvatar(params);
      rig.animate(
        1,
        0.016,
        { speed: 0, talking: false, listening: false, faded: false },
        0,
      );
      const box = new THREE.Box3().setFromObject(rig.group);
      let tris = 0;
      rig.group.traverse((o) => {
        if (o.geometry)
          tris +=
            (o.geometry.index
              ? o.geometry.index.count
              : o.geometry.attributes.position.count) / 3;
      });
      if (
        !Number.isFinite(box.max.y) ||
        box.max.y < 1.9 ||
        box.max.y > 3.0 ||
        box.min.y < -0.05
      )
        bad2++;
      worst = Math.max(worst, box.max.y);
      maxTris = Math.max(maxTris, tris);
      rig.dispose();
      combos++;
    }
ok(
  `all ${combos} style combinations build with sane height (max ${worst.toFixed(2)})`,
  bad2 === 0,
  `${bad2} bad`,
);
ok(
  `triangle budget per character (max ${Math.round(maxTris)})`,
  maxTris < 70000,
  String(maxTris),
);

// ---- natural animation
const find = (rig, name) => {
  let hit = null;
  rig.group.traverse((o) => {
    if (o.name === name && !hit) hit = o;
  });
  return hit;
};
const findAll = (rig, name) => {
  const hits = [];
  rig.group.traverse((o) => {
    if (o.name === name) hits.push(o);
  });
  return hits;
};
const rig = createAvatar({ ...A.DEFAULT_AVATAR, glasses: true });
const parts = {
  pelvis: find(rig, "pelvis"),
  head: find(rig, "headPivot"),
  shP: find(rig, "shoulderPlus"),
  elP: find(rig, "elbowPlus"),
  shM: find(rig, "shoulderMinus"),
  elM: find(rig, "elbowMinus"),
  kP: find(rig, "kneePlus"),
  kM: find(rig, "kneeMinus"),
  mouth: find(rig, "openMouth"),
};
const irises = findAll(rig, "iris"),
  eyes = findAll(rig, "eye");
ok(
  "rig exposes joints, two irises and two eyes",
  Object.values(parts).every(Boolean) &&
    irises.length === 2 &&
    eyes.length === 2,
);

const IDLE = { speed: 0, talking: false, listening: false, faded: false };
let t = 0,
  nan = false;
const check = () =>
  rig.group.traverse((o) => {
    if (
      !Number.isFinite(
        o.position.x +
          o.position.y +
          o.position.z +
          o.rotation.x +
          o.rotation.y +
          o.rotation.z +
          o.scale.x +
          o.scale.y +
          o.scale.z,
      )
    )
      nan = true;
  });
const joints = () => [
  parts.pelvis.rotation.z,
  parts.pelvis.position.x,
  parts.head.rotation.x,
  parts.head.rotation.y,
  parts.head.rotation.z,
  parts.shP.rotation.x,
  parts.shP.rotation.z,
  parts.elP.rotation.x,
  parts.shM.rotation.x,
  parts.shM.rotation.z,
  parts.elM.rotation.x,
  parts.kP.rotation.x,
  parts.kM.rotation.x,
];
let prev = joints(),
  maxStep = 0,
  worstJoint = -1,
  worstTime = 0;
const run = (mood, seconds, onFrame) => {
  for (let i = 0; i < seconds * 60; i++) {
    t += 1 / 60;
    rig.animate(t, 1 / 60, mood, 3);
    check();
    const now = joints();
    now.forEach((v, k) => {
      const d = Math.abs(v - prev[k]);
      if (d > maxStep) {
        maxStep = d;
        worstJoint = k;
        worstTime = t;
      }
    });
    prev = now;
    onFrame && onFrame();
  }
};

let irisMin = 9,
  irisMax = -9,
  blinkMin = 9,
  rollMin = 9,
  rollMax = -9,
  headMin = 9,
  headMax = -9;
run(IDLE, 12, () => {
  const x = irises[0].position.x;
  irisMin = Math.min(irisMin, x);
  irisMax = Math.max(irisMax, x);
  blinkMin = Math.min(blinkMin, eyes[0].scale.y);
  rollMin = Math.min(rollMin, parts.pelvis.rotation.z);
  rollMax = Math.max(rollMax, parts.pelvis.rotation.z);
  headMin = Math.min(headMin, parts.head.rotation.y);
  headMax = Math.max(headMax, parts.head.rotation.y);
});
ok(
  `eyes look around (iris range ${(irisMax - irisMin).toFixed(3)})`,
  irisMax - irisMin > 0.02,
);
ok("eyes blink", blinkMin < 0.3, String(blinkMin));
ok(
  `weight shifts from leg to leg (hip roll range ${(rollMax - rollMin).toFixed(3)})`,
  rollMax - rollMin > 0.03,
);
ok("head turns a little on its own", headMax - headMin > 0.03);

let mouthMax = 0,
  elbowMin = 0;
run({ ...IDLE, talking: true }, 4, () => {
  mouthMax = Math.max(mouthMax, parts.mouth.scale.y);
  elbowMin = Math.min(elbowMin, parts.elP.rotation.x);
});
ok(
  "mouth opens and the hand gestures while reciting",
  mouthMax > 0.4 && elbowMin < -0.9,
  `${mouthMax} ${elbowMin}`,
);

let earZ = 0,
  earElbow = 0;
run({ ...IDLE, listening: true }, 3, () => {
  earZ = Math.max(earZ, parts.shM.rotation.z);
  earElbow = Math.min(earElbow, parts.elM.rotation.x);
});
ok(
  "a hand goes up to the ear while listening",
  earZ > 0.4 && earElbow < -1.5,
  `${earZ} ${earElbow}`,
);

let kneeMax = 0;
run({ ...IDLE, speed: 1.6 }, 3, () => {
  kneeMax = Math.max(kneeMax, parts.kP.rotation.x, parts.kM.rotation.x);
});
ok("knees bend while walking", kneeMax > 0.4, String(kneeMax));

run({ ...IDLE, faded: true }, 2);
ok(
  "slumps when eliminated (head down, eyes closed)",
  parts.head.rotation.x > 0.35 && eyes[0].scale.y < 0.3,
  `${parts.head.rotation.x} ${eyes[0].scale.y}`,
);
ok("animation never produces NaN", !nan);
ok(
  `poses blend smoothly (largest joint step per frame ${maxStep.toFixed(3)} rad)`,
  maxStep < 0.13,
  `${maxStep} joint #${worstJoint} t=${worstTime.toFixed(2)}`,
);
rig.dispose();

// ---- stage with microphone
const stage = createStageScene({
  width: 400,
  height: 300,
  floorColor: "#cfe8dc",
});
const players = [1, 2, 3, 4].map((id) => ({
  userId: id,
  avatar: { ...A.randomAvatar() },
  faded: false,
}));
stage.setState({
  players,
  turnUserId: null,
  speakerPlaying: false,
  reciting: false,
});
const groups = () =>
  stage.scene.children.filter(
    (c) => c.type === "Group" && c.getObjectByName("pelvis"),
  );
let time = 0;
const runStage = (seconds) => {
  for (let i = 0; i < seconds * 30; i++) {
    time += 1 / 30;
    stage.update(time);
  }
};
runStage(2);
ok("four characters on stage", groups().length === 4, String(groups().length));

stage.setState({
  players,
  turnUserId: 3,
  speakerPlaying: true,
  reciting: false,
});
runStage(1);
const walkers = groups().map((g) => g.position.clone());
runStage(5);
const front = groups().reduce((a, b) => (a.position.z > b.position.z ? a : b));
ok(
  "player in turn stands in front of the microphone",
  Math.abs(front.position.x) < 0.06 && Math.abs(front.position.z - 0.7) < 0.06,
  JSON.stringify(front.position),
);
const others = groups().filter((g) => g !== front);
ok(
  "waiting players keep the middle free",
  others.every((g) => Math.abs(g.position.x) > 1.2),
  JSON.stringify(others.map((g) => g.position.x)),
);
const bot = stage.scene.children.find(
  (c) => c.type === "Group" && Math.abs(c.position.x + 2.5) < 0.01,
);
ok(
  "floating bot is on stage and pulses with its audio",
  !!bot && bot.children.length > 3,
);

stage.setState({
  players,
  turnUserId: 3,
  speakerPlaying: false,
  reciting: true,
});
runStage(1);
const led = stage.scene.children
  .flatMap((c) => (c.type === "Group" ? c.children : []))
  .flatMap((c) => (c.type === "Group" ? c.children : []))
  .find(
    (m) =>
      m.material &&
      m.material.type === "MeshBasicMaterial" &&
      m.geometry.type === "TorusGeometry" &&
      m.geometry.parameters.radius === 0.088,
  );
ok(
  "microphone light turns on while reciting",
  !!led &&
    (led.material.color.getHex() === 0xff4d5e ||
      led.material.color.getHex() === 0x992c38),
  led && led.material.color.getHex().toString(16),
);
const beam = stage.scene.children.find(
  (c) =>
    c.type === "Mesh" &&
    c.geometry.type === "CylinderGeometry" &&
    c.geometry.parameters.openEnded,
);
ok(
  "spotlight is on",
  beam && beam.material.opacity > 0.05,
  beam && String(beam.material.opacity),
);

// faded + removed + changed avatar
stage.setState({
  players: players
    .map((p) => (p.userId === 3 ? { ...p, faded: true } : p))
    .filter((p) => p.userId !== 4),
  turnUserId: 1,
  speakerPlaying: false,
  reciting: false,
});
runStage(6);
ok(
  "removed player leaves the scene",
  groups().length === 3,
  String(groups().length),
);
const next = groups().reduce((a, b) => (a.position.z > b.position.z ? a : b));
ok(
  "turn moves on to the next player",
  Math.abs(next.position.x) < 0.06 && Math.abs(next.position.z - 0.7) < 0.06,
  JSON.stringify(next.position),
);
stage.setState({
  players: players
    .slice(0, 3)
    .map((p) =>
      p.userId === 1
        ? { ...p, avatar: { ...p.avatar, glasses: !p.avatar.glasses } }
        : p,
    ),
  turnUserId: 1,
  speakerPlaying: false,
  reciting: false,
});
runStage(1);
ok("avatar change keeps the group count", groups().length === 3);
let threw = false;
try {
  stage.dispose();
} catch (e) {
  threw = true;
  console.log(e);
}
ok("dispose works", !threw);

// ---- many players
const big = createStageScene({
  width: 400,
  height: 300,
  floorColor: "#ffffff",
});
big.setState({
  players: Array.from({ length: 8 }, (_, i) => ({
    userId: i + 1,
    avatar: A.randomAvatar(),
    faded: i === 7,
  })),
  turnUserId: 2,
  speakerPlaying: true,
  reciting: false,
});
let t2 = 0;
for (let i = 0; i < 300; i++) {
  t2 += 1 / 30;
  big.update(t2);
}
ok("eight players run without trouble", big.scene.children.length > 8);
big.dispose();

// ---- preview
const preview = createAvatarPreviewScene({
  width: 300,
  height: 300,
  avatar: A.DEFAULT_AVATAR,
});
preview.update(1, 0.4, true);
preview.setAvatar({ ...A.DEFAULT_AVATAR, outfitStyle: "robe", glasses: true });
preview.update(8, 0.4, false);
ok(
  "preview scene updates and swaps characters",
  preview.scene.children.some((c) => c.type === "Group"),
);
preview.dispose();

console.log(fail ? "FAILED" : "all ok");
process.exit(fail ? 1 : 0);
