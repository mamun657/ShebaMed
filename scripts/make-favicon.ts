import { createCanvas } from "@napi-rs/canvas";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const charcoal = "#17191D";
const orange = "#FF9800";

function drawIcon(size: number) {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");
  context.fillStyle = charcoal;
  context.fillRect(0, 0, size, size);
  const unit = size / 32;
  const thickness = 6 * unit;
  const armLength = 20 * unit;
  const centre = size / 2;
  context.fillStyle = orange;
  context.fillRect(
    centre - thickness / 2,
    centre - armLength / 2,
    thickness,
    armLength,
  );
  context.fillRect(
    centre - armLength / 2,
    centre - thickness / 2,
    armLength,
    thickness,
  );
  return canvas.toBuffer("image/png");
}

function buildIco(png: Buffer, size: number) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const size = 64;
const png = drawIcon(size);
const ico = buildIco(png, size);

const outputDirectory = resolve(process.cwd(), "app");
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, "favicon.ico"), ico);

console.log("favicon written to app/favicon.ico", ico.length, "bytes");
process.exit(0);
