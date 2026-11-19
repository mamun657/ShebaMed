export const documentCategories = [
  "LAB_REPORT",
  "PRESCRIPTION",
  "DIAGNOSTIC_REPORT",
  "CLINICAL_NOTE",
  "PHARMACY_ENCOUNTER",
  "MEDICINE_DISPENSING",
  "DISCHARGE_SUMMARY",
  "OTHER_MEDICAL",
  "NON_MEDICAL",
  "UNKNOWN",
] as const;
export type DocumentCategory = (typeof documentCategories)[number];

export const documentStatuses = [
  "UPLOADED",
  "QUEUED",
  "PROCESSING",
  "NEEDS_REVIEW",
  "COMPLETED",
  "FAILED",
] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const verificationStates = [
  "UNREVIEWED",
  "OCR_EXTRACTED",
  "AI_EXTRACTED",
  "PATIENT_CONFIRMED",
  "CLINICIAN_VERIFIED",
  "CLINICIAN_AUTHORED",
] as const;
export type VerificationState = (typeof verificationStates)[number];

export const extractionStates = [
  "PENDING",
  "TEXT_EXTRACTED",
  "OCR_COMPLETED",
  "EXTRACTED",
  "SKIPPED_NON_MEDICAL",
  "FAILED",
] as const;
export type ExtractionState = (typeof extractionStates)[number];

export const legacyCategoryMap: Record<string, DocumentCategory> = {
  LAB: "LAB_REPORT",
  DIAGNOSTIC: "DIAGNOSTIC_REPORT",
  OTHER: "OTHER_MEDICAL",
  PRESCRIPTION: "PRESCRIPTION",
  CLINICAL_NOTE: "CLINICAL_NOTE",
};

export function normalizeCategory(value?: string | null): DocumentCategory {
  if (!value) return "UNKNOWN";
  const upper = value.trim().toUpperCase();
  if ((documentCategories as readonly string[]).includes(upper))
    return upper as DocumentCategory;
  return legacyCategoryMap[upper] ?? "UNKNOWN";
}

export function isClinicalCategory(value?: string | null) {
  const category = normalizeCategory(value);
  return (
    category !== "NON_MEDICAL" &&
    category !== "UNKNOWN" &&
    category !== "OTHER_MEDICAL"
  );
}

export const testSynonyms: Record<string, string[]> = {
  HbA1c: [
    "hba1c",
    "hemoglobin a1c",
    "haemoglobin a1c",
    "glycated hemoglobin",
    "glycated haemoglobin",
    "glycosylated hemoglobin",
    "glycosylated haemoglobin",
    "a1c",
  ],
  CBC: [
    "cbc",
    "complete blood count",
    "full blood count",
    "total leukocyte count",
    "tlc",
  ],
  Hemoglobin: ["hemoglobin", "haemoglobin", "hb"],
  Creatinine: ["creatinine", "serum creatinine", "scr"],
  Lipase: ["lipase", "serum lipase"],
  Glucose: [
    "glucose",
    "blood glucose",
    "fasting glucose",
    "fasting blood sugar",
    "fbs",
    "fbg",
    "random glucose",
  ],
  Cholesterol: ["cholesterol", "total cholesterol", "serum cholesterol"],
  "Uric Acid": ["uric acid", "serum uric acid"],
  Creatine_Phosphokinase: ["creatine phosphokinase", "cpk", "ck"],
  ALT: ["alt", "sgpt", "alanine aminotransferase"],
  AST: ["ast", "sgot", "aspartate aminotransferase"],
  Bilirubin: ["bilirubin", "total bilirubin", "serum bilirubin"],
  Platelet: ["platelet", "platelet count", "platelets"],
  "WBC Count": ["wbc", "white blood cell", "white blood cell count", "leukocyte"],
  "RBC Count": ["rbc", "red blood cell", "red blood cell count"],
  ESR: ["esr", "erythrocyte sedimentation rate"],
  CRP: ["crp", "c reactive protein", "c-reactive protein"],
  TSH: ["tsh", "thyroid stimulating hormone"],
  "Vitamin D": ["vitamin d", "25-hydroxy vitamin d", "cholecalciferol"],
  "Blood Group": ["blood group", "abo", "abo and rh"],
  Urinalysis: ["urinalysis", "urine analysis", "urine routine", "ua"],
  "ECG": ["ecg", "ekg", "electrocardiogram"],
  "Ultrasound": ["ultrasound", "usg", "sonogram", "sonography"],
  "X-Ray": ["x-ray", "xray", "radiograph", "radiography"],
};

export const testAliasIndex: { canonical: string; aliases: string[] }[] =
  Object.entries(testSynonyms).map(([canonical, aliases]) => ({
    canonical,
    aliases: [canonical.toLowerCase(), ...aliases],
  }));

const aliasPatterns = new Map<string, RegExp[]>();

function patternsFor(aliases: string[]) {
  const key = aliases.join("|");
  const cached = aliasPatterns.get(key);
  if (cached) return cached;
  const patterns = aliases.map((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu");
  });
  aliasPatterns.set(key, patterns);
  return patterns;
}

export function textContainsAlias(text: string, aliases: string[]) {
  return patternsFor(aliases).some((pattern) => pattern.test(text));
}

export function matchKnownTest(text: string) {
  const found: string[] = [];
  for (const entry of testAliasIndex)
    if (textContainsAlias(text, entry.aliases)) found.push(entry.canonical);
  return [...new Set(found)];
}

const genericTestPatterns = [
  /(?:done|had|have|performed|took|undergone)\s+(?:an?|the|my)?\s*([A-Za-z][A-Za-z0-9-]{2,24})\s+test\b/gi,
  /(?:is|are|was|were)\s+(?:an?|the|my)?\s*([A-Za-z][A-Za-z0-9-]{2,24})\s+test\s+(?:done|performed|taken)/gi,
  /(?:result|level|value)s?\s+(?:of|for)\s+(?:an?|the|my)?\s*([A-Za-z][A-Za-z0-9-]{2,24})/gi,
];

const genericTestStopWords = new Set([
  "medical",
  "blood",
  "urine",
  "lab",
  "laboratory",
  "screening",
  "routine",
  "any",
  "the",
  "a",
  "these",
  "previous",
  "last",
  "recent",
  "hormone",
  "thyroid",
]);

export function requestedTestNames(text: string) {
  const found = new Set(matchKnownTest(text));
  for (const pattern of genericTestPatterns) {
    const matcher = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(text)) !== null) {
      const name = match[1];
      if (!name) continue;
      if (genericTestStopWords.has(name.toLowerCase())) continue;
      found.add(name);
    }
  }
  return [...found];
}

export type ParsedObservation = {
  test: string;
  result: string;
  unit: string | null;
  referenceRange: string | null;
  page: number;
};

export type ParsedReport = {
  title: string | null;
  reportDate: string | null;
  laboratory: string | null;
  hospital: string | null;
  observations: ParsedObservation[];
  medications: string[];
  diagnoses: string[];
};

const datePattern =
  /\b(\d{4}-\d{2}-\d{2})\b|\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/;

export function normalizeDate(value: string): string | null {
  const iso = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const candidate = `${iso[1]}-${iso[2]}-${iso[3]}`;
    if (
      !Number.isNaN(Date.parse(candidate)) &&
      new Date(candidate).toISOString().slice(0, 10) === candidate
    )
      return candidate;
    return null;
  }
  const parts = value.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/);
  if (!parts) return null;
  const day = Number(parts[1]),
    month = Number(parts[2]),
    year = Number(parts[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  )
    return null;
  return candidate.toISOString().slice(0, 10);
}

export function findReportDate(text: string): string | null {
  const labeled = text.match(
    /(?:report\s*date|collection\s*date|sample\s*date|specimen\s*date|date\s*of\s*report|date)\s*[:\-]?\s*([^\n]{4,30})/i,
  );
  if (labeled) {
    const match = labeled[1].match(datePattern);
    const normalized = match ? normalizeDate(match[0]) : null;
    if (normalized) return normalized;
  }
  const any = text.match(datePattern);
  return any ? normalizeDate(any[0]) : null;
}

const labelVocabulary = [
  "report date",
  "collection date",
  "sample date",
  "specimen date",
  "date of report",
  "reference range",
  "reference values",
  "lab name",
  "laboratory name",
  "diagnostic centre",
  "diagnostic center",
  "test",
  "examination",
  "investigation",
  "parameter",
  "analyte",
  "item",
  "result",
  "value",
  "measured",
  "observed",
  "laboratory",
  "hospital",
  "facility",
  "clinic",
  "medication",
  "drug",
  "rx",
  "medicine",
  "diagnosis",
  "assessment",
  "impression",
  "report",
  "document",
  "title",
  "patient",
  "unit",
];

const labelPattern = new RegExp(
  `\\b(${labelVocabulary.join("|")})\\s*[:\\-]\\s*`,
  "gi",
);

type LabelledField = { label: string; value: string };

function scanLabelledFields(text: string): LabelledField[] {
  const matches = [...text.matchAll(labelPattern)];
  const fields: LabelledField[] = [];
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? text.length)
        : text.length;
    fields.push({
      label: match[1].toLowerCase(),
      value: text.slice(start, end).replace(/\s+/g, " ").trim(),
    });
  });
  return fields;
}

function splitValueUnit(value: string) {
  const match = value.match(
    /^([-+]?\d[\d.,]*)\s*([a-zA-Z%/µμ][a-zA-Z0-9%/µμ^.-]*)?$/,
  );
  if (!match) return { result: value, unit: null };
  return { result: match[1], unit: match[2] ?? null };
}

export function parseReportText(text: string, page = 1): ParsedReport {
  const fields = scanLabelledFields(text);
  const observations: ParsedObservation[] = [];
  const medicationList: string[] = [];
  const diagnosisList: string[] = [];
  const testLabels = new Set([
    "test",
    "examination",
    "investigation",
    "parameter",
    "analyte",
    "item",
  ]);
  const resultLabels = new Set([
    "result",
    "value",
    "measured",
    "observed",
  ]);
  let pendingTest: string | null = null;
  let pendingReference: string | null = null;
  for (const field of fields) {
    if (!field.value) continue;
    if (
      field.label === "reference range" ||
      field.label === "reference values"
    ) {
      pendingReference = field.value.slice(0, 120);
      if (!pendingTest && observations.length) {
        const last = observations.length - 1;
        observations[last] = {
          ...observations[last],
          referenceRange: pendingReference,
        };
      }
      continue;
    }
    if (testLabels.has(field.label)) {
      pendingTest = field.value.slice(0, 120);
      continue;
    }
    if (resultLabels.has(field.label)) {
      if (!pendingTest) continue;
      const split = splitValueUnit(field.value);
      observations.push({
        test: pendingTest,
        result: split.result,
        unit: split.unit,
        referenceRange: pendingReference,
        page,
      });
      pendingTest = null;
      continue;
    }
    if (
      field.label === "medication" ||
      field.label === "drug" ||
      field.label === "rx" ||
      field.label === "medicine"
    )
      medicationList.push(field.value.slice(0, 200));
    if (
      field.label === "diagnosis" ||
      field.label === "assessment" ||
      field.label === "impression"
    )
      diagnosisList.push(field.value.slice(0, 200));
  }
  const hospital =
    fields.find(
      (field) =>
        ["hospital", "facility", "clinic"].includes(field.label) && field.value,
    )?.value ?? null;
  const laboratory =
    fields.find(
      (field) =>
        [
          "laboratory",
          "lab name",
          "laboratory name",
          "diagnostic centre",
          "diagnostic center",
        ].includes(field.label) && field.value,
    )?.value ?? null;
  const reportTitle =
    fields.find(
      (field) =>
        ["report", "document", "title"].includes(field.label) && field.value,
    )?.value ?? null;
  return {
    title: (reportTitle ?? hospital ?? laboratory)?.slice(0, 200) ?? null,
    reportDate: findReportDate(text),
    laboratory: laboratory?.slice(0, 200) ?? null,
    hospital: hospital?.slice(0, 200) ?? null,
    observations,
    medications: [...new Set(medicationList)].slice(0, 100),
    diagnoses: [...new Set(diagnosisList)].slice(0, 100),
  };
}


const nonMedicalSignals = [
  "curriculum vitae",
  "resume",
  "employment history",
  "career history",
  "professional summary",
  "career objective",
  "personal objective",
  "work experience",
  "professional experience",
  "educational qualification",
  "academic background",
  "key skills",
  "technical skills",
  "languages known",
  "references available",
  "hobbies",
  "awards and achievements",
  "invoice",
  "receipt",
  "quotation",
  "price list",
  "purchase order",
];

const medicalStructureSignals = [
  "reference range",
  "reference values",
  "test:",
  "result:",
  "report date",
  "specimen",
  "collected",
  "lab report",
  "laboratory report",
  "diagnostic report",
  "investigation report",
  "medication:",
  "diagnosis:",
  "impression:",
  "clinical notes",
];

const categorySignals: Record<DocumentCategory, string[]> = {
  LAB_REPORT: [
    "laboratory report",
    "lab report",
    "laboratory test",
    "haematology",
    "hematology",
    "biochemistry",
    "complete blood count",
    "specimen",
    "reference range",
    "investigation report",
    "pathology report",
    "test result",
  ],
  PRESCRIPTION: [
    "prescription",
    "rx",
    "medication advice",
    "take one tablet",
    "dose",
    "sig:",
    "tablet",
    "capsule",
    "pharmacy",
  ],
  DIAGNOSTIC_REPORT: [
    "ultrasound",
    "usg",
    "sonogram",
    "x-ray",
    "radiograph",
    "radiology",
    "mri",
    "ct scan",
    "doppler",
    "electrocardiogram",
    "ecg",
    "echocardiogram",
  ],
  CLINICAL_NOTE: [
    "clinical notes",
    "progress note",
    "history and examination",
    "case sheet",
    "clinic note",
    "outpatient note",
    "presenting complaint",
  ],
  PHARMACY_ENCOUNTER: [],
  MEDICINE_DISPENSING: [],
  DISCHARGE_SUMMARY: [
    "discharge summary",
    "hospitalization summary",
    "admission date",
    "discharge date",
    "condition on discharge",
  ],
  OTHER_MEDICAL: [],
  NON_MEDICAL: [],
  UNKNOWN: [],
};

export type Classification = {
  category: DocumentCategory;
  confidence: number;
  reason: string;
};

export function classifyDocument(text: string): Classification {
  const lower = text.toLowerCase();
  const nonMedicalHits = nonMedicalSignals.filter((signal) =>
    lower.includes(signal),
  );
  const structureHits = medicalStructureSignals.filter((signal) =>
    lower.includes(signal),
  );
  const medicalHits = (Object.keys(categorySignals) as DocumentCategory[])
    .filter((category) => categorySignals[category].length)
    .map((category) => ({
      category,
      hits: categorySignals[category].filter((signal) => lower.includes(signal)),
    }))
    .filter((entry) => entry.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length);
  if (nonMedicalHits.length >= 2 && (!medicalHits.length || nonMedicalHits.length > medicalHits[0].hits.length))
    return {
      category: "NON_MEDICAL",
      confidence: Math.min(0.95, 0.6 + nonMedicalHits.length * 0.08),
      reason: `Non-medical markers found: ${nonMedicalHits.slice(0, 3).join(", ")}`,
    };
  if (!medicalHits.length)
    return structureHits.length
      ? {
          category: "LAB_REPORT",
          confidence: Math.min(0.72, 0.55 + structureHits.length * 0.05),
          reason: `Matched medical document structure: ${structureHits
            .slice(0, 3)
            .join(", ")}`,
        }
      : {
          category: "UNKNOWN",
          confidence: 0.2,
          reason: "No reliable medical or non-medical markers were found",
        };
  const top = medicalHits[0];
  const confidence = Math.min(0.95, 0.55 + top.hits.length * 0.12);
  return {
    category: top.category,
    confidence,
    reason: `Matched ${top.hits.slice(0, 3).join(", ")}`,
  };
}

export function detectLanguage(text: string): "eng" | "ben" {
  const bengali = text.match(/[\u0980-\u09FF]/g);
  return bengali && bengali.length > 8 ? "ben" : "eng";
}

export type AnswerIntent =
  | "GREETING"
  | "HELP"
  | "UNSAFE"
  | "HISTORY"
  | "MISSING_HISTORY";

const greetingPattern =
  /^\s*(hi|hey|hello|hola|hallo|good\s+(morning|afternoon|evening|day)|greetings|assalam|salam|namaste|howdy|yo|sup|thank\s*you|thanks|thanku|ok|okay|bye|goodbye)\b[\s!.?]*$/i;
const helpPattern =
  /\b(how\s+do\s+i|how\s+can\s+i|how\s+to|where\s+can\s+i|where\s+do\s+i|help\s+me|guide\s+me|explain\s+how|what\s+can\s+you\s+do|how\s+does\s+(this|it)\s+work|steps\s+to|walk\s+me\s+through)\b/i;
const unsafePattern =
  /\b(diagnos(e|is|tic|a)|diabet\w*|prescrib(e|ed|ing|ation)|prescribe\s+me|what\s+medication\s+should|which\s+medication\s+should|should\s+i\s+take|change\s+(my\s+)?(dose|medication|treatment)|stop\s+taking|discontinue|is\s+it\s+safe\s+to\s+take|am\s+i\s+dangerous|can\s+i\s+skip|treatment\s+plan|dose\s+of|what\s+is\s+my\s+diagnosis|do\s+i\s+have)\b/i;
const historicalMedicationPattern =
  /\b(has|have|was|were|did)\b.{0,80}\b(prescribed|dispensed|supplied)\b/i;
const missingPattern =
  /\b(did\s+i|have\s+i|has\s+i|was\s+i|were\s+i|do\s+i|is\s+there|any|what\s+was\s+my)\b.{0,60}\b(before|ever|previously|earlier|history|test|tests|result|results|report|reports|record|records|done|performed|had|previous)\b/i;
const historyPattern =
  /\b(test|tests|result|results|report|reports|record|records|history|lab|laboratory|prescription|diagnos\w*|medication|medications|cbc|hba1c|creatinine|glucose|hemoglobin|blood\s+pressure|weight|show|list|find|when|what|which|how\s+many)\b/i;

export function classifyIntent(question: string): AnswerIntent {
  const normalized = question.trim();
  if (!normalized) return "GREETING";
  if (greetingPattern.test(normalized)) return "GREETING";
  if (
    historicalMedicationPattern.test(normalized) &&
    !/\b(should|recommend|dose|diagnos\w*|treat\w*|switch)\b/i.test(normalized)
  )
    return "HISTORY";
  if (unsafePattern.test(normalized)) return "UNSAFE";
  if (helpPattern.test(normalized)) return "HELP";
  if (missingPattern.test(normalized)) return "MISSING_HISTORY";
  if (historyPattern.test(normalized)) return "HISTORY";
  return "HISTORY";
}

export function hasUnsafeIntent(question: string) {
  return unsafePattern.test(question);
}
