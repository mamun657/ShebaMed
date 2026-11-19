import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  extractPages,
  deterministicExtraction,
  needsAiExtraction,
  enrichWithAi,
  mergeExtraction,
} from "../lib/processing";

const fixtures: { file: string; mime: string }[] = [
  { file: "demo/fixtures/fixture-text-multipage.pdf", mime: "application/pdf" },
  {
    file: "demo/fixtures/fixture-multipage-scanned.pdf",
    mime: "application/pdf",
  },
  { file: "demo/fixtures/fixture-hba1c.png", mime: "image/png" },
  { file: "demo/fixtures/fixture-prescription.png", mime: "image/png" },
  { file: "demo/fixtures/fixture-resume.png", mime: "image/png" },
  { file: "demo/fixtures/fixture-no-date.png", mime: "image/png" },
  { file: "demo/fixtures/fixture-corrupt.pdf", mime: "application/pdf" },
];

for (const fixture of fixtures) {
  const started = Date.now();
  console.log("=====", fixture.file);
  try {
    const pages = await extractPages(
      await readFile(resolve(process.cwd(), fixture.file)),
      fixture.mime,
    );
    console.log(
      " pages:",
      pages.length,
      "methods:",
      pages.map((page) => page.method).join(","),
      "ms:",
      Date.now() - started,
    );
    const deterministic = deterministicExtraction(pages);
    console.log(
      " deterministic:",
      JSON.stringify({
        category: deterministic.category,
        reportDate: deterministic.reportDate,
        confidence: deterministic.confidence,
        observations: deterministic.observations,
      }),
    );
    if (
      deterministic.category !== "NON_MEDICAL" &&
      needsAiExtraction(deterministic, pages)
    ) {
      const ai = await enrichWithAi(pages, deterministic);
      console.log(" ai:", JSON.stringify(mergeExtraction(deterministic, ai)));
    }
  } catch (error) {
    console.log(
      " error:",
      error instanceof Error ? error.message : String(error),
      "retryable:",
      (error as { retryable?: boolean }).retryable,
    );
  }
}
process.exit(0);
