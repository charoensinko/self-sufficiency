// สร้างไอคอน PWA (public/icons/) จาก SVG ต้นกล้าพื้นเขียว — รัน: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = new URL("../public/icons/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1"
);
mkdirSync(OUT, { recursive: true });

function sprout(rounded) {
  const rx = rounded ? 112 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rx}" fill="#4a7c50"/>
  <g stroke="#fdfcf7" stroke-width="26" stroke-linecap="round" fill="none">
    <path d="M256 420 V250"/>
  </g>
  <path d="M256 268 C 252 200 208 152 128 144 C 132 224 180 268 256 268 Z" fill="#fdfcf7"/>
  <path d="M256 218 C 260 158 300 116 384 108 C 380 180 336 218 256 218 Z" fill="#a8d5ae"/>
  <path d="M160 430 h192" stroke="#fdfcf7" stroke-width="22" stroke-linecap="round"/>
</svg>`;
}

const jobs = [
  { file: "icon-192.png", size: 192, rounded: true },
  { file: "icon-512.png", size: 512, rounded: true },
  { file: "icon-512-maskable.png", size: 512, rounded: false },
  { file: "apple-touch-icon.png", size: 180, rounded: false },
];

for (const job of jobs) {
  await sharp(Buffer.from(sprout(job.rounded)))
    .resize(job.size, job.size)
    .png()
    .toFile(`${OUT}/${job.file}`);
  console.log("created", job.file);
}
