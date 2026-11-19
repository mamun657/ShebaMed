import { readFile } from "node:fs/promises";
const files = ["lib/rag.ts", "lib/medical.ts", "components/ai-assistant.tsx"];
for (const file of files) {
  const text = await readFile(file, "utf8");
  const bengali = text.match(/[\u0980-\u09FF]/g);
  const mojibake = text.match(/[âÂ][\u0080-\u00BF]|Ã[\u0080-\u00BF]/g);
  console.log(file, "bengaliChars:", bengali ? bengali.length : 0, "mojibakeSeq:", mojibake ? mojibake.length : 0);
}
const rag = await readFile("lib/rag.ts", "utf8");
const idx = rag.indexOf("helpResponses");
console.log("--- snippet ---");
console.log(rag.slice(idx, idx + 700));
