// Generates /public/icon-192.png and /public/icon-512.png — green tile with
// a white "KX" wordmark. Run with `node scripts/generate-icons.mjs`.

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");

const BG = "#1B5E20";
const FG = "#FFFFFF";

function svg(size) {
  // Letter sized at ~52% of canvas; sits visually centered.
  const fontSize = Math.round(size * 0.52);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="100%" height="100%" rx="${Math.round(size * 0.22)}" ry="${Math.round(size * 0.22)}" fill="${BG}"/>
  <text x="50%" y="50%"
        fill="${FG}"
        font-family="Helvetica, Arial, sans-serif"
        font-weight="800"
        font-size="${fontSize}"
        text-anchor="middle"
        dominant-baseline="central">KX</text>
</svg>`;
}

async function writeIcon(size) {
  const out = path.join(publicDir, `icon-${size}.png`);
  await sharp(Buffer.from(svg(size))).png().toFile(out);
  console.log(`✓ ${path.relative(process.cwd(), out)}`);
}

await Promise.all([writeIcon(192), writeIcon(512)]);
