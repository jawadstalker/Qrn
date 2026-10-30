// Creates assets/fonts/qcf4/QCF4_Hafs_45..47.ttf from the `quran-qcf4` npm package
// (Madinah Mushaf 1441H, calligraphy by Uthman Taha, King Fahd Complex).
// The package ships woff2 files, React Native needs ttf, so they are decompressed here.
// Runs automatically after `npm install` (postinstall); safe to run again.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "quran-qcf4", "fonts-woff2");
const target = join(root, "assets", "fonts", "qcf4");
// Juz 30 (pages 582-604) only needs these three page fonts.
const NEEDED = [45, 46, 47];

const name = (index) => `QCF4_Hafs_${String(index).padStart(2, "0")}`;
const missing = [];

for (const index of NEEDED) {
  if (!existsSync(join(target, `${name(index)}.ttf`))) {
    missing.push(index);
  }
}

if (missing.length === 0) {
  process.exit(0);
}

if (!existsSync(source)) {
  console.warn(
    "[qcf4] node_modules/quran-qcf4 not found. Run `npm install --legacy-peer-deps` first.",
  );
  process.exit(0);
}

const require = createRequire(import.meta.url);
const woff2 = require("wawoff2");

mkdirSync(target, { recursive: true });

for (const index of missing) {
  const input = readFileSync(join(source, `${name(index)}_W.woff2`));
  const output = await woff2.decompress(input);

  writeFileSync(join(target, `${name(index)}.ttf`), Buffer.from(output));
}

console.log(`[qcf4] created ${missing.length} font file(s) in assets/fonts/qcf4`);
