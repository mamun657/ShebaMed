import { z } from "zod";

export const medicineReviewStates = [
  "READ_FROM_DOCUMENT",
  "NEEDS_REVIEW",
  "PATIENT_ENTERED",
] as const;

export const medicineSchema = z.object({
  name: z.string().trim().min(1).max(120),
  strength: z.string().max(60).nullable(),
  dosage: z.string().max(120).nullable(),
  frequency: z.string().max(80).nullable(),
  duration: z.string().max(80).nullable(),
  sourceText: z.string().max(300),
  page: z.number().int().positive(),
  review: z.enum(medicineReviewStates),
});
export type Medicine = z.infer<typeof medicineSchema>;

export const prescriptionSchema = z.object({
  prescriber: z.string().max(160).nullable(),
  medicines: z.array(medicineSchema).max(60),
  unreadable: z.number().int().min(0).max(200),
});
export type Prescription = z.infer<typeof prescriptionSchema>;

export const reliableOcrConfidence = 75;

type SourcePage = {
  page: number;
  text: string;
  method: string;
  confidence: number;
};

const compact = (value: string) =>
  value.toLowerCase().replace(/[\s\u200b-\u200d]+/g, "");

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() && !/\[illegible\]/i.test(value)
    ? value.trim().slice(0, max)
    : null;

function pageIsReliable(page: SourcePage) {
  return (
    page.method === "SELECTABLE_TEXT" ||
    (page.method !== "HANDWRITING_AI" &&
      page.confidence >= reliableOcrConfidence)
  );
}

/**
 * Keeps only what is literally written in the document text. A medicine whose
 * name is not present verbatim is dropped, and any detail that is not present
 * verbatim is cleared, so a model can never add or "correct" a value.
 */
export function groundPrescription(
  candidate: unknown,
  pages: SourcePage[],
): Prescription {
  const source = (candidate ?? {}) as {
    prescriber?: unknown;
    medicines?: unknown;
  };
  const compactPages = pages.map((page) => ({
    page,
    compact: compact(page.text),
  }));
  const written = (value: string | null, within?: string) =>
    !!value &&
    (within !== undefined
      ? within.includes(compact(value))
      : compactPages.some((entry) => entry.compact.includes(compact(value))));
  const candidates = (Array.isArray(source.medicines) ? source.medicines : [])
    .map((raw) => (raw ?? {}) as Record<string, unknown>)
    .map((item) => ({ item, name: text(item.name, 120) }));
  const names = candidates
    .map((entry) => (entry.name ? compact(entry.name) : ""))
    .filter((name) => name.length >= 3);
  /**
   * The text a medicine's details may come from: the line carrying its name
   * and up to two continuation lines, stopping at another medicine's line so
   * one medicine can never borrow a neighbour's dose.
   */
  const ownLines = (page: SourcePage, name: string) => {
    const lines = page.text.split(/\r?\n/).map(compact);
    const start = lines.findIndex((line) => line.includes(name));
    if (start < 0) return null;
    let own = lines[start];
    for (
      let index = start + 1;
      index <= start + 2 && index < lines.length;
      index++
    ) {
      if (names.some((other) => other !== name && lines[index].includes(other)))
        break;
      own += lines[index];
    }
    return own;
  };
  const medicines: Medicine[] = [];
  let unreadable = 0;
  const seen = new Set<string>();
  for (const { item, name } of candidates) {
    const home =
      name && name.length >= 3
        ? compactPages.find((entry) => entry.compact.includes(compact(name)))
        : undefined;
    if (!name || !home) {
      unreadable++;
      continue;
    }
    const own = ownLines(home.page, compact(name));
    const detail = (value: unknown, max: number) => {
      const candidateValue = text(value, max);
      return own !== null && written(candidateValue, own)
        ? candidateValue
        : null;
    };
    const sourceText = text(item.sourceText, 300);
    const medicine: Medicine = {
      name,
      strength: detail(item.strength, 60),
      dosage: detail(item.dosage, 120),
      frequency: detail(item.frequency, 80),
      duration: detail(item.duration, 80),
      sourceText: written(sourceText, home.compact) ? sourceText! : name,
      page: home.page.page,
      review:
        own !== null && pageIsReliable(home.page)
          ? "READ_FROM_DOCUMENT"
          : "NEEDS_REVIEW",
    };
    const key = compact(
      [medicine.name, medicine.strength, medicine.frequency].join("|"),
    );
    if (seen.has(key)) continue;
    seen.add(key);
    medicines.push(medicine);
    if (medicines.length === 60) break;
  }
  const prescriber = text(source.prescriber, 160);
  return {
    prescriber: written(prescriber) ? prescriber : null,
    medicines,
    unreadable,
  };
}

export function medicineLine(medicine: Medicine) {
  return [
    medicine.name,
    medicine.strength,
    medicine.dosage,
    medicine.frequency,
    medicine.duration,
  ]
    .filter(Boolean)
    .join(" · ");
}

const reviewLabel: Record<Medicine["review"], string> = {
  READ_FROM_DOCUMENT: "read from the document",
  NEEDS_REVIEW: "uncertain reading, not yet confirmed by the patient",
  PATIENT_ENTERED: "typed in by the patient, not verified by a clinician",
};

/** Searchable text for the assistant; every medicine carries its own caveat. */
export function medicineChunkText(prescription: Prescription | undefined) {
  if (!prescription?.medicines.length) return null;
  return [
    "Medicines written on this prescription (prescribed medication list). This does not show whether they were dispensed or taken.",
    ...(prescription.prescriber
      ? [`Prescribed by: ${prescription.prescriber}`]
      : []),
    ...prescription.medicines.map(
      (medicine) =>
        `- ${medicineLine(medicine)} [${reviewLabel[medicine.review]}]`,
    ),
    ...(prescription.unreadable
      ? [
          `${prescription.unreadable} further line(s) on this document could not be read and are not listed.`,
        ]
      : []),
  ].join("\n");
}

/**
 * A patient may correct medicines but cannot upgrade them to "read from the
 * document": anything that is not identical to what was extracted is recorded
 * as patient-entered.
 */
export function reconcileReviewedMedicines(
  reviewed: Prescription | undefined,
  extracted: Prescription | undefined,
  pageCount: number,
): Prescription | undefined {
  if (!reviewed) return undefined;
  const original = new Map(
    (extracted?.medicines ?? []).map((medicine) => [
      medicineLine(medicine),
      medicine,
    ]),
  );
  return {
    prescriber: reviewed.prescriber,
    unreadable: extracted?.unreadable ?? 0,
    medicines: reviewed.medicines.map((medicine) => {
      const match = original.get(medicineLine(medicine));
      return match
        ? {
            ...match,
            review:
              match.review === "NEEDS_REVIEW"
                ? ("PATIENT_ENTERED" as const)
                : match.review,
          }
        : {
            ...medicine,
            sourceText: "",
            page: Math.min(medicine.page, Math.max(pageCount, 1)),
            review: "PATIENT_ENTERED" as const,
          };
    }),
  };
}
