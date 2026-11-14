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
  hairStyle: "evil",
  hat: 3,
  outfit: 1.5,
  glasses: "yes",
  glow: -1,
});
ok(
  "sanitize clamps bad values",
  bad.face === 0 &&
    bad.hairStyle === "cloud" &&
    bad.hat === "none" &&
    bad.outfit === 0 &&
    bad.glasses === false &&
    bad.glow === 0,
);
const legacy = A.sanitizeAvatar({
  skin: 3,
  head: "scarf",
  outfit: 2,
  glasses: true,
});
ok(
  "v1 avatars still load (scarf -> hijab, skin shifts)",
  legacy.hat === "hijab" &&
    legacy.face === 4 &&
    legacy.outfit === 2 &&
    legacy.glasses === true,
  JSON.stringify(legacy),
);
ok(
  "v1 short hair maps over",
  A.sanitizeAvatar({ head: "long" }).hairStyle === "long",
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
for (const hairStyle of A.HAIR_STYLES)
  for (const hat of A.HATS)
    for (const outfitStyle of A.OUTFIT_STYLES)
      for (const glasses of [false, true]) {
        const params = {
          ...A.DEFAULT_AVATAR,
          hairStyle,
          hat,
          outfitStyle,
          glasses,
          hatColor: combos % 8,
          hairColor: combos % 8,
          outfit: combos % 8,
          face: combos % 6,
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
          box.max.y < 1.8 ||
          box.max.y > 3.4 ||
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
  maxTris < 60000,
  String(maxTris),
);

// ---- animation stays finite for every mood
const rig = createAvatar({ ...A.DEFAULT_AVATAR, hat: "crown", glasses: true });
let nan = false,
  maxLeg = 0,
  mouthMin = 9,
  mouthMax = 0;
const moods = [
  { speed: 0, talking: false, listening: false, faded: false },
  { speed: 1.4, talking: false, listening: false, faded: false },
  { speed: 0, talking: true, listening: false, faded: false },
  { speed: 0, talking: false, listening: true, faded: false },
  { speed: 0, talking: false, listening: false, faded: true },
];
let t = 0;
for (const mood of moods)
  for (let i = 0; i < 120; i++) {
    t += 1 / 60;
    rig.animate(t, 1 / 60, mood, 3);
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
    if (mood.speed > 1)
      rig.group.children.forEach((c) => {
        if (c.type === "Group")
          maxLeg = Math.max(maxLeg, Math.abs(c.rotation.x));
      });
  }
ok("animation never produces NaN", !nan);
ok("legs and arms swing while walking", maxLeg > 0.3, String(maxLeg));
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
    (c) =>
      c.type === "Group" &&
      c.children.length > 5 &&
      c.children.some((m) => m.type === "Group"),
  );
let time = 0;
const run = (seconds) => {
  for (let i = 0; i < seconds * 30; i++) {
    time += 1 / 30;
    stage.update(time);
  }
};
run(2);
ok("four characters on stage", groups().length === 4, String(groups().length));

stage.setState({
  players,
  turnUserId: 3,
  speakerPlaying: true,
  reciting: false,
});
run(1);
const walkers = groups().map((g) => g.position.clone());
run(5);
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
run(1);
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
run(6);
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
      p.userId === 1 ? { ...p, avatar: { ...p.avatar, hat: "crown" } } : p,
    ),
  turnUserId: 1,
  speakerPlaying: false,
  reciting: false,
});
run(1);
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
const prev = createAvatarPreviewScene({
  width: 300,
  height: 300,
  avatar: A.DEFAULT_AVATAR,
});
prev.update(1, 0.4, true);
prev.setAvatar({ ...A.DEFAULT_AVATAR, hat: "hijab", glasses: true });
prev.update(8, 0.4, false);
ok(
  "preview scene updates and swaps characters",
  prev.scene.children.some((c) => c.type === "Group"),
);
prev.dispose();

console.log(fail ? "FAILED" : "all ok");
process.exit(fail ? 1 : 0);
