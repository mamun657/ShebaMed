import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import {
  validateFile,
  extractionSchema,
  extractPages,
} from "../lib/processing";
describe("Document validation", () => {
  it("rejects executable content disguised with a filename", async () => {
    await expect(
      validateFile(Buffer.from("<script>alert(1)</script>")),
    ).rejects.toThrow();
  });
  it("enforces maximum upload bytes", async () => {
    await expect(validateFile(Buffer.alloc(6 * 1024 * 1024))).rejects.toThrow(
      "size",
    );
  });
  it("recognizes a real PDF signature", async () => {
    expect(await validateFile(await readFile("demo/synthetic-hba1c.pdf"))).toBe(
      "application/pdf",
    );
  });
  it("recognizes a real PNG signature", async () => {
    expect(await validateFile(await readFile("demo/synthetic-cbc.png"))).toBe(
      "image/png",
    );
  });
  it("rejects malformed extraction dates and source pages", () => {
    expect(
      extractionSchema.safeParse({
        title: "Test",
        category: "LAB",
        reportDate: "yesterday",
        laboratory: null,
        hospital: null,
        observations: [],
        medications: [],
        diagnoses: [],
      }).success,
    ).toBe(false);
  });
  it("extracts selectable PDF text with its page source", async () => {
    const pages = await extractPages(
      await readFile("demo/synthetic-hba1c.pdf"),
      "application/pdf",
    );
    expect(pages[0].text).toContain("6.8");
    expect(pages[0].page).toBe(1);
  });
});

it("performs real OCR on the synthetic PNG", async () => {
  const pages = await extractPages(
    await readFile("demo/synthetic-cbc.png"),
    "image/png",
  );
  expect(pages[0].text).toContain("Hemoglobin");
  expect(pages[0].text).toContain("14.0");
}, 60000);
it("renders and OCRs a scanned PDF", async () => {
  const pages = await extractPages(
    await readFile("demo/synthetic-prescription-scanned.pdf"),
    "application/pdf",
  );
  expect(pages[0].text.toLowerCase()).toContain("prescription");
  expect(pages[0].page).toBe(1);
}, 60000);
