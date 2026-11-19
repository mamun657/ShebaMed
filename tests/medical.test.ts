import { describe, it, expect } from "vitest";
import {
  classifyIntent,
  matchKnownTest,
  normalizeCategory,
  isClinicalCategory,
  findReportDate,
  normalizeDate,
  parseReportText,
  classifyDocument,
} from "../lib/medical";

describe("Answer intent routing", () => {
  it("routes a greeting away from medical retrieval", () => {
    expect(classifyIntent("hello")).toBe("GREETING");
    expect(classifyIntent("Hello!")).toBe("GREETING");
    expect(classifyIntent("good morning")).toBe("GREETING");
    expect(classifyIntent("thanks")).toBe("GREETING");
    expect(classifyIntent("hi")).toBe("GREETING");
  });
  it("routes application help away from medical retrieval", () => {
    expect(classifyIntent("How do I upload a report?")).toBe("HELP");
    expect(classifyIntent("How can I share records with my doctor?")).toBe(
      "HELP",
    );
    expect(classifyIntent("walk me through uploading a PDF")).toBe("HELP");
  });
  it("routes clinical decision requests to the safety path", () => {
    expect(classifyIntent("Do I have diabetes?")).toBe("UNSAFE");
    expect(classifyIntent("What medication should I take?")).toBe("UNSAFE");
    expect(classifyIntent("should I stop taking my medicine")).toBe("UNSAFE");
  });
  it("routes history questions to retrieval", () => {
    expect(classifyIntent("Have I done an HbA1c test before?")).toBe(
      "MISSING_HISTORY",
    );
    expect(classifyIntent("What was my previous CBC result?")).toBe(
      "MISSING_HISTORY",
    );
    expect(classifyIntent("Which medical tests did I perform in 2026?")).toBe(
      "HISTORY",
    );
    expect(classifyIntent("Show me the original report.")).toBe("HISTORY");
    expect(
      classifyIntent("Has this patient previously been prescribed this medicine?"),
    ).toBe("HISTORY");
    expect(
      classifyIntent(
        "Has this patient previously been prescribed this medicine, and should I recommend it?",
      ),
    ).toBe("UNSAFE");
  });
});

describe("Medical terminology handling", () => {
  it("recognises HbA1c synonyms", () => {
    expect(matchKnownTest("have I done hba1c before")).toContain("HbA1c");
    expect(matchKnownTest("glycated hemoglobin result")).toContain("HbA1c");
    expect(matchKnownTest("hemoglobin a1c")).toContain("HbA1c");
  });
  it("recognises CBC synonyms", () => {
    expect(matchKnownTest("complete blood count")).toContain("CBC");
    expect(matchKnownTest("full blood count")).toContain("CBC");
  });
  it("does not invent a test that was not asked about", () => {
    expect(matchKnownTest("lipase")).toContain("Lipase");
    expect(matchKnownTest("lipase")).not.toContain("HbA1c");
  });
});

describe("Document categories", () => {
  it("maps legacy categories to the current vocabulary", () => {
    expect(normalizeCategory("LAB")).toBe("LAB_REPORT");
    expect(normalizeCategory("OTHER")).toBe("OTHER_MEDICAL");
    expect(normalizeCategory("LAB_REPORT")).toBe("LAB_REPORT");
    expect(normalizeCategory(null)).toBe("UNKNOWN");
  });
  it("keeps non-medical documents out of clinical retrieval", () => {
    expect(isClinicalCategory("LAB_REPORT")).toBe(true);
    expect(isClinicalCategory("NON_MEDICAL")).toBe(false);
    expect(isClinicalCategory("UNKNOWN")).toBe(false);
    expect(isClinicalCategory("OTHER_MEDICAL")).toBe(false);
  });
});

describe("Report date handling", () => {
  it("reads an explicit report date", () => {
    expect(findReportDate("Report date: 2026-01-12")).toBe("2026-01-12");
    expect(findReportDate("Collection Date 12/01/2026")).toBe("2026-01-12");
  });
  it("returns null when no date is present", () => {
    expect(findReportDate("Test: Lipase\nResult: 42 U/L")).toBeNull();
  });
  it("rejects impossible calendar dates", () => {
    expect(normalizeDate("2026-02-31")).toBeNull();
    expect(normalizeDate("2026-13-01")).toBeNull();
    expect(normalizeDate("2026-01-12")).toBe("2026-01-12");
  });
});

describe("Deterministic medical parsing", () => {
  it("extracts a test, result, unit and reference range", () => {
    const parsed = parseReportText(
      "SYNTHETIC FIXTURE\nLaboratory: Fictional Laboratory\nReport date: 2026-01-12\nTest: HbA1c\nResult: 6.8 %\nReference range: 4.0 - 5.6 %",
    );
    expect(parsed.reportDate).toBe("2026-01-12");
    expect(parsed.laboratory).toBe("Fictional Laboratory");
    expect(parsed.observations).toHaveLength(1);
    expect(parsed.observations[0].test).toBe("HbA1c");
    expect(parsed.observations[0].result).toBe("6.8");
    expect(parsed.observations[0].unit).toBe("%");
    expect(parsed.observations[0].referenceRange).toContain("4.0");
  });
  it("extracts medications and diagnoses", () => {
    const parsed = parseReportText(
      "Medication: DEMO-PLACEHOLDER (not a real drug)\nDiagnosis: Not documented",
    );
    expect(parsed.medications).toEqual(["DEMO-PLACEHOLDER (not a real drug)"]);
    expect(parsed.diagnoses).toEqual(["Not documented"]);
  });
  it("does not invent an observation when the source has none", () => {
    const parsed = parseReportText("Patient: Demo\nReport date: 2026-01-12");
    expect(parsed.observations).toHaveLength(0);
  });
});

describe("Medical document classification", () => {
  it("classifies a resume as non-medical", () => {
    const result = classifyDocument(
      "CURRICULUM VITAE\nProfessional Summary\nCareer objective\nWork experience\nEducational qualification\nKey skills",
    );
    expect(result.category).toBe("NON_MEDICAL");
    expect(result.confidence).toBeGreaterThan(0.5);
  });
  it("classifies a prescription", () => {
    const result = classifyDocument(
      "Fictional Clinic\nPrescription\nMedication: DEMO-PLACEHOLDER\nDiagnosis: Not documented",
    );
    expect(result.category).toBe("PRESCRIPTION");
  });
  it("classifies a laboratory report", () => {
    const result = classifyDocument(
      "Laboratory Report\nReference range\nReport date\nTest: HbA1c\nResult: 6.8",
    );
    expect(result.category).toBe("LAB_REPORT");
  });
});
