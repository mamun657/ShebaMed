import fs from "fs";
import zlib from "zlib";

const buf = fs.readFileSync("c:/shebamed/images/img1.png");
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
const bitDepth = buf[24];
const colorType = buf[25];

let i = 8;
const idat = [];
while (i < buf.length) {
  const len = buf.readUInt32BE(i);
  const type = buf.toString("ascii", i + 4, i + 8);
  if (type === "IDAT") idat.push(buf.subarray(i + 8, i + 8 + len));
  if (type === "IEND") break;
  i += 12 + len;
}

const raw = zlib.inflateSync(Buffer.concat(idat));
const bpp = 4;
const stride = width * bpp;
const out = Buffer.alloc(height * stride);
let pos = 0;
for (let y = 0; y < height; y++) {
  const filter = raw[pos++];
  const line = raw.subarray(pos, pos + stride);
  pos += stride;
  const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
  const cur = out.subarray(y * stride, (y + 1) * stride);
  for (let x = 0; x < stride; x++) {
    const a = x >= bpp ? cur[x - bpp] : 0;
    const b = prev[x];
    const c = x >= bpp ? prev[x - bpp] : 0;
    let v = line[x];
    switch (filter) {
      case 0: break;
      case 1: v = v + a; break;
      case 2: v = v + b; break;
      case 3: v = v + ((a + b) >> 1); break;
      case 4: {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        break;
      }
    }
    cur[x] = v & 0xff;
  }
}

console.log("width", width, "height", height, "bitDepth", bitDepth, "colorType", colorType);
const hist = new Map();
for (let p = 0; p < width * height; p++) {
  const a = out[p * 4 + 3];
  hist.set(a, (hist.get(a) || 0) + 1);
}
const total = width * height;
console.log("distinct alpha values:", hist.size);
[...hist.entries()]
  .sort((x, y) => y[1] - x[1])
  .slice(0, 12)
  .forEach(([k, v]) => console.log(`  alpha ${k}: ${v} (${((100 * v) / total).toFixed(2)}%)`));

const at = (x, y) => {
  const p = (y * width + x) * 4;
  return [out[p], out[p + 1], out[p + 2], out[p + 3]];
};
console.log("corners/edges:", [[0,0],[1671,0],[0,940],[1671,940],[836,470],[836,5],[5,470]].map(([x,y]) => `${x},${y}=${at(x,y).join(",")}`).join("  "));

let minX = width, maxX = -1, minY = height, maxY = -1;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (out[(y * width + x) * 4 + 3] > 10) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
console.log("content bbox (alpha>10):", { minX, maxX, minY, maxY });

const _png = zlib.deflateSync(Buffer.from([0]));
