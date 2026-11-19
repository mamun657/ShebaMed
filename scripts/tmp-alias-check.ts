import { matchKnownTest } from "../lib/medical";

const cases: [string, string[]][] = [
  ["Have I done an HbA1c test before?", ["HbA1c"]],
  ["What was my previous CBC result?", ["CBC"]],
  ["Have I done a lipase test before?", ["Lipase"]],
  ["Show me the original report.", []],
  ["Was creatinine tested before?", ["Creatinine"]],
  ["Which medical tests did I perform in 2026?", []],
  ["Do I have diabetes?", []],
  ["hemoglobin a1c", ["HbA1c"]],
  ["complete blood count", ["CBC"]],
];
let failures = 0;
for (const [question, expected] of cases) {
  const got = matchKnownTest(question);
  const ok =
    got.length === expected.length && expected.every((e) => got.includes(e));
  if (!ok) failures++;
  console.log(
    `${ok ? "OK  " : "FAIL"} ${JSON.stringify(question)} -> ${JSON.stringify(got)} expected ${JSON.stringify(expected)}`,
  );
}
console.log(failures ? `${failures} mismatch(es)` : "all alias cases matched");
process.exit(failures ? 1 : 0);
