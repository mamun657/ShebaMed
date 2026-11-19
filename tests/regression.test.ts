import { describe, it, expect } from "vitest";
import {
  matchKnownTest,
  textContainsAlias,
  testAliasIndex,
} from "../lib/medical";
import { chunkMatchScoreForTest } from "../lib/rag";
import { needsAiExtraction } from "../lib/processing";

describe("Medical synonym boundaries", () => {
  it("does not treat an HbA1c request as a Hemoglobin request", () => {
    expect(matchKnownTest("Have I done an HbA1c test before?")).toEqual([
      "HbA1c",
    ]);
    expect(matchKnownTest("Have I done an HbA1c test before?")).not.toContain(
      "Hemoglobin",
    );
  });
  it("keeps distinct abbreviations apart", () => {
    expect(matchKnownTest("Was creatinine tested before?")).toEqual([
      "Creatinine",
    ]);
    expect(matchKnownTest("What was my previous CBC result?")).toEqual(["CBC"]);
  });
  it("matches an alias only on a whole-word boundary", () => {
    const hemoglobin = testAliasIndex.find(
      (entry) => entry.canonical === "Hemoglobin",
    )!;
    expect(textContainsAlias("hba1c", hemoglobin.aliases)).toBe(false);
    expect(textContainsAlias("hemoglobin", hemoglobin.aliases)).toBe(true);
    expect(textContainsAlias("hb 12.4", hemoglobin.aliases)).toBe(true);
  });
  it("returns no test for a general question", () => {
    expect(matchKnownTest("Which medical tests did I perform in 2026?")).toEqual(
      [],
    );
    expect(matchKnownTest("Show me the original report.")).toEqual([]);
  });
});

describe("Chunk ranking resilience", () => {
  it("scores a chunk that has no filename instead of throwing", () => {
    const score = chunkMatchScoreForTest(
      { text: "HbA1c 6.8 %", page: 1 },
      ["hba1c"],
      ["HbA1c"],
    );
    expect(score).toBeGreaterThan(0);
  });
  it("scores a chunk with every field present", () => {
    const score = chunkMatchScoreForTest(
      {
        text: "HbA1c 6.8 %",
        filename: "report.pdf",
        page: 1,
        reportDate: "2026-01-12",
        verification: "PATIENT_CONFIRMED",
      },
      ["hba1c"],
      ["HbA1c"],
    );
    expect(score).toBeGreaterThan(0);
  });
});

describe("Extraction cost control", () => {
  const pages = [
    {
      page: 1,
      text: "Test: HbA1c",
      method: "SELECTABLE_TEXT" as const,
      confidence: 95,
    },
  ];
  it("skips the model when deterministic parsing is complete", () => {
    const deterministic = {
      title: "Report",
      category: "LAB_REPORT" as const,
      reportDate: "2026-01-12",
      laboratory: null,
      hospital: null,
      observations: [
        {
          test: "HbA1c",
          result: "6.8",
          unit: "%",
          referenceRange: "4.0 - 5.6 %",
          page: 1,
        },
      ],
      medications: [],
      diagnoses: [],
      confidence: 0.9,
      reason: "lab",
    };
    expect(needsAiExtraction(deterministic, pages)).toBe(false);
  });
  it("never sends a non-medical document to the model", () => {
    expect(
      needsAiExtraction(
        {
          title: "Resume",
          category: "NON_MEDICAL" as const,
          reportDate: null,
          laboratory: null,
          hospital: null,
          observations: [],
          medications: [],
          diagnoses: [],
          confidence: 0.9,
          reason: "resume",
        },
        pages,
      ),
    ).toBe(false);
  });
});
