import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";

const buf = fs.readFileSync("c:/shebamed/images/img1.png");
const img = await loadImage(buf);
console.log("loaded", img.width, img.height);
const canvas = createCanvas(img.width, img.height);
const ctx = canvas.getContext("2d");
ctx.drawImage(img, 0, 0);
const data = ctx.getImageData(0, 0, img.width, img.height).data;
const at = (x, y) => {
  const idx = (y * img.width + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
};
const pts = [
  [0, 0],
  [1671, 0],
  [0, 940],
  [1671, 940],
  [836, 470],
  [836, 5],
  [5, 470],
  [1666, 470],
  [836, 935],
];
for (const [x, y] of pts) {
  const [r, g, b, a] = at(x, y);
  console.log(`(${x},${y}) rgba=${r},${g},${b},${a}`);
}
let transparent = 0;
let semi = 0;
let opaque = 0;
for (let i = 3; i < data.length; i += 4) {
  if (data[i] === 0) transparent++;
  else if (data[i] < 255) semi++;
  else opaque++;
}
const total = transparent + semi + opaque;
console.log("total px", total);
console.log("fully transparent", transparent, (100 * transparent / total).toFixed(2) + "%");
console.log("semi transparent", semi, (100 * semi / total).toFixed(2) + "%");
console.log("opaque", opaque, (100 * opaque / total).toFixed(2) + "%");
