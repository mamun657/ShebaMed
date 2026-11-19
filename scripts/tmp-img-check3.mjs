import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";

const buf = fs.readFileSync("c:/shebamed/images/img1.png");
const img = await loadImage(buf);
const canvas = createCanvas(img.width, img.height);
const ctx = canvas.getContext("2d");
ctx.drawImage(img, 0, 0);
const data = ctx.getImageData(0, 0, img.width, img.height).data;

const hist = new Map();
for (let i = 3; i < data.length; i += 4) {
  const a = data[i];
  const bucket = a === 0 ? 0 : a === 255 ? 255 : Math.floor(a / 16) * 16;
  hist.set(bucket, (hist.get(bucket) || 0) + 1);
}
const total = data.length / 4;
console.log("alpha histogram (bucket: count, pct):");
[...hist.entries()]
  .sort((a, b) => a[0] - b[0])
  .forEach(([k, v]) =>
    console.log(`  ${k}: ${v} (${((100 * v) / total).toFixed(2)}%)`)
  );

function render(bg, name) {
  const c = createCanvas(img.width, img.height);
  const g = c.getContext("2d");
  g.fillStyle = bg;
  g.fillRect(0, 0, img.width, img.height);
  g.drawImage(img, 0, 0);
  fs.writeFileSync(name, c.toBuffer("image/png"));
}
render("#ffffff", "c:/shebamed/scripts/tmp-white.png");
render("#ff00ff", "c:/shebamed/scripts/tmp-magenta.png");

const opaqueCheck = createCanvas(img.width, img.height);
const oc = opaqueCheck.getContext("2d");
oc.fillStyle = "#ffffff";
oc.fillRect(0, 0, img.width, img.height);
const flattened = oc.getImageData(0, 0, img.width, img.height).data;
let checkerLike = 0;
for (let y = 0; y < img.height; y += 8) {
  for (let x = 0; x < img.width; x += 8) {
    const i = (y * img.width + x) * 4;
    if (flattened[i] > 235 && flattened[i + 1] > 235 && flattened[i + 2] > 235) checkerLike++;
  }
}
console.log("near-white samples on flattened:", checkerLike);
