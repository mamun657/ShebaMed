import { describe, it, expect } from "vitest";
import {
  groundPrescription,
  medicineChunkText,
  reconcileReviewedMedicines,
} from "../lib/prescription";

// Synthetic data only: these are not real medicines or people.
const printed = {
  page: 1,
  method: "IMAGE_OCR",
  confidence: 91,
  text: "Dr. Test Physician\nRx\nDemozol 500 mg 1+0+1 7 days\nFakecillin 250 mg 1+1+1 5 days",
};
const candidate = {
  prescriber: "Dr. Test Physician",
  medicines: [
    {
      name: "Demozol",
      strength: "500 mg",
      dosage: null,
      frequency: "1+0+1",
      duration: "7 days",
      sourceText: "Demozol 500 mg 1+0+1 7 days",
    },
  ],
};

describe("Prescription grounding", () => {
  it("keeps a medicine that is written in the document", () => {
    const result = groundPrescription(candidate, [printed]);
    expect(result.medicines).toHaveLength(1);
    expect(result.medicines[0]).toMatchObject({
      name: "Demozol",
      strength: "500 mg",
      frequency: "1+0+1",
      duration: "7 days",
      page: 1,
      review: "READ_FROM_DOCUMENT",
    });
    expect(result.prescriber).toBe("Dr. Test Physician");
    expect(result.unreadable).toBe(0);
  });

  it("drops a medicine name the model invented or corrected", () => {
    const result = groundPrescription(
      {
        prescriber: "Dr. Somebody Else",
        medicines: [
          { name: "Inventamycin", strength: "500 mg" },
          { name: "Demozole", strength: "500 mg" },
        ],
      },
      [printed],
    );
    expect(result.medicines).toEqual([]);
    expect(result.unreadable).toBe(2);
    expect(result.prescriber).toBeNull();
  });

  it("clears details that are not written, without dropping the medicine", () => {
    const result = groundPrescription(
      {
        medicines: [
          {
            name: "Fakecillin",
            strength: "500 mg",
            frequency: "twice daily",
            duration: "5 days",
          },
        ],
      },
      [printed],
    );
    expect(result.medicines[0]).toMatchObject({
      name: "Fakecillin",
      strength: null,
      frequency: null,
      duration: "5 days",
    });
  });

  it("does not let a medicine borrow its neighbour's dose", () => {
    const result = groundPrescription(
      {
        medicines: [
          { name: "Demozol", strength: "250 mg", frequency: "1+1+1" },
          { name: "Fakecillin", strength: "250 mg", frequency: "1+1+1" },
        ],
      },
      [printed],
    );
    expect(result.medicines[0]).toMatchObject({
      name: "Demozol",
      strength: null,
      frequency: null,
    });
    expect(result.medicines[1]).toMatchObject({
      name: "Fakecillin",
      strength: "250 mg",
      frequency: "1+1+1",
    });
  });

  it("accepts a dose written on the line under the medicine", () => {
    const page = {
      ...printed,
      text: "Rx\nTab. Demozol 500 mg\n1+0+1 - 7 days\nTab. Fakecillin 250 mg\n1+1+1 - 5 days",
    };
    const result = groundPrescription(
      {
        medicines: [
          {
            name: "Demozol",
            strength: "500 mg",
            frequency: "1+0+1",
            duration: "7 days",
          },
          {
            name: "Fakecillin",
            strength: "250 mg",
            frequency: "1+1+1",
            duration: "7 days",
          },
        ],
      },
      [page],
    );
    expect(result.medicines[0]).toMatchObject({
      frequency: "1+0+1",
      duration: "7 days",
    });
    expect(result.medicines[1]).toMatchObject({
      frequency: "1+1+1",
      duration: null,
    });
  });

  it("marks everything from a low-confidence or handwriting page for review", () => {
    for (const page of [
      { ...printed, confidence: 41 },
      { ...printed, method: "HANDWRITING_AI", confidence: 0 },
    ])
      expect(groundPrescription(candidate, [page]).medicines[0].review).toBe(
        "NEEDS_REVIEW",
      );
  });

  it("never turns an illegible marker or malformed reply into a medicine", () => {
    const page = { ...printed, text: "Rx\n[illegible] 500 mg 1+0+1" };
    for (const reply of [
      { medicines: [{ name: "[illegible]", strength: "500 mg" }] },
      { medicines: [{ name: "Rx" }, { name: 42 }, null, "Demozol"] },
      { medicines: "Demozol" },
      null,
    ])
      expect(groundPrescription(reply, [page]).medicines).toEqual([]);
  });

  it("lists a repeated medicine once", () => {
    const result = groundPrescription(
      { medicines: [candidate.medicines[0], candidate.medicines[0]] },
      [printed],
    );
    expect(result.medicines).toHaveLength(1);
  });
});

describe("Patient review of medicines", () => {
  const extracted = groundPrescription(candidate, [
    { ...printed, confidence: 41 },
  ]);

  it("cannot upgrade a typed medicine to 'read from document'", () => {
    const reviewed = reconcileReviewedMedicines(
      {
        prescriber: null,
        unreadable: 0,
        medicines: [
          {
            name: "Typedol",
            strength: "10 mg",
            dosage: null,
            frequency: null,
            duration: null,
            sourceText: "forged",
            page: 9,
            review: "READ_FROM_DOCUMENT",
          },
        ],
      },
      extracted,
      1,
    )!;
    expect(reviewed.medicines[0]).toMatchObject({
      review: "PATIENT_ENTERED",
      sourceText: "",
      page: 1,
    });
  });

  it("records an unchanged uncertain medicine as confirmed by the patient", () => {
    const reviewed = reconcileReviewedMedicines(extracted, extracted, 1)!;
    expect(reviewed.medicines[0].review).toBe("PATIENT_ENTERED");
    expect(reviewed.medicines[0].sourceText).toBe(
      "Demozol 500 mg 1+0+1 7 days",
    );
  });
});

describe("Assistant medicine passage", () => {
  it("labels each medicine with how it was obtained and says 'prescribed'", () => {
    const text = medicineChunkText(
      groundPrescription(candidate, [{ ...printed, confidence: 41 }]),
    )!;
    expect(text).toContain("Demozol · 500 mg · 1+0+1 · 7 days");
    expect(text).toContain("uncertain reading");
    expect(text).toMatch(/does not show whether they were dispensed or taken/);
  });
  it("produces nothing when no medicine was read", () => {
    expect(
      medicineChunkText({ prescriber: null, medicines: [], unreadable: 3 }),
    ).toBeNull();
    expect(medicineChunkText(undefined)).toBeNull();
  });
});
