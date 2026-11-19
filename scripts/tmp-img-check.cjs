/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const p = "c:/shebamed/images/img1.png";
const b = fs.readFileSync(p);
console.log("bytes", b.length);
console.log("width", b.readUInt32BE(16), "height", b.readUInt32BE(20));
console.log("bitDepth", b[24], "colorType", b[25]);
let i = 8;
const chunks = [];
while (i < b.length) {
  const len = b.readUInt32BE(i);
  const type = b.toString("ascii", i + 4, i + 8);
  chunks.push(type + ":" + len);
  if (type === "IEND") break;
  i += 12 + len;
}
console.log("chunks", chunks.join(", "));
