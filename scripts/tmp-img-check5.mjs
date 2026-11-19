import fs from "fs";
import zlib from "zlib";

const buf = fs.readFileSync("c:/shebamed/images/img1.png");
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

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

const px = (x, y) => {
  const p = (y * width + x) * 4;
  return [out[p], out[p + 1], out[p + 2], out[p + 3]];
};

const fullyTransparent = [];
for (let y = 0; y < height; y += 3) {
  for (let x = 0; x < width; x += 3) {
    const [r, g, b, a] = px(x, y);
    if (a === 0) fullyTransparent.push([r, g, b]);
  }
}
const rgbSet = new Set(fullyTransparent.map((c) => c.join(",")));
console.log("fully-transparent sampled pixels:", fullyTransparent.length);
console.log("distinct RGB among them:", rgbSet.size);
console.log("sample RGB values:", [...rgbSet].slice(0, 12).join(" | "));

let checker = 0;
for (const c of fullyTransparent) {
  if (c[0] > 200 && c[1] > 200 && c[2] > 200) checker++;
}
console.log("light-gray 'checkerboard' candidates among transparent pixels:", checker);

const coarse = (x0, y0, w, h) => {
  const chars = " .:-=+*#%@";
  let s = "";
  for (let y = y0; y < y0 + h; y += 16) {
    let row = "";
    for (let x = x0; x < x0 + w; x += 16) {
      const [r, g, b, a] = px(x, y);
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const ch = a === 0 ? " " : chars[Math.min(9, Math.max(1, Math.round(lum * 9)))];
      row += ch;
    }
    s += row + "\n";
  }
  return s;
};
console.log("coarse luminance map (transparent = space):");
console.log(coarse(0, 0, width, height));

console.log("sample composite colors over white:");
const comp = (x, y) => {
  const [r, g, b, a] = px(x, y);
  const k = a / 255;
  return [Math.round(r * k + 255 * (1 - k)), Math.round(g * k + 255 * (1 - k)), Math.round(b * k + 255 * (1 - k))];
};
[[836, 470], [836, 60], [400, 200], [1200, 200], [836, 200], [836, 120], [836, 30]].forEach(([x, y]) => {
  console.log(`  (${x},${y}) raw=${px(x, y).join(",")} over-white=${comp(x, y).join(",")}`);
});
