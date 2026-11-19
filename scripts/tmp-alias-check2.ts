import { requestedTestNames } from "../lib/medical";

const cases: [string, string[]][] = [
  ["Have I done an HbA1c test before?", ["HbA1c"]],
  ["Have I done a Troponin test before?", ["Troponin"]],
  ["What was my previous CBC result?", ["CBC"]],
  ["Which medical tests did I perform in 2026?", []],
  ["Show me the original report.", []],
  ["What laboratory tests were performed previously?", []],
  ["Do I have diabetes?", []],
  ["Was creatinine tested before?", ["Creatinine"]],
  ["Which documents contain a creatinine result?", ["Creatinine"]],
  ["Is there a previous hemoglobin report?", ["Hemoglobin"]],
  ["Which reports were created in 2026?", []],
];
let failures = 0;
for (const [question, expected] of cases) {
  const got = requestedTestNames(question);
  const ok =
    got.length === expected.length && expected.every((e) => got.includes(e));
  if (!ok) failures++;
  console.log(
    `${ok ? "OK  " : "FAIL"} ${JSON.stringify(question)} -> ${JSON.stringify(got)} expected ${JSON.stringify(expected)}`,
  );
}
console.log(failures ? `${failures} mismatch(es)` : "all cases matched");
process.exit(failures ? 1 : 0);
