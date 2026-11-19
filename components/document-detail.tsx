"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "./ui/button";
import { Localize, translate, useI18n } from "@/lib/i18n";

export type ExtractionView = {
  title: string;
  category: string;
  reportDate: string | null;
  laboratory: string | null;
  hospital: string | null;
  observations: {
    test: string;
    result: string;
    unit: string | null;
    referenceRange: string | null;
    page: number;
  }[];
  medications: string[];
  diagnoses: string[];
  prescription?: {
    prescriber: string | null;
    medicines: MedicineView[];
    unreadable: number;
  };
};

export type MedicineView = {
  name: string;
  strength: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  sourceText: string;
  page: number;
  review: "READ_FROM_DOCUMENT" | "NEEDS_REVIEW" | "PATIENT_ENTERED";
};

const medicineStatus: Record<MedicineView["review"], [string, string]> = {
  READ_FROM_DOCUMENT: ["Read from document", "good"],
  NEEDS_REVIEW: ["Needs review", ""],
  PATIENT_ENTERED: ["Entered by patient", "neutral"],
};
const medicineFields = [
  ["name", "Medicine"],
  ["strength", "Strength"],
  ["dosage", "Dose"],
  ["frequency", "Frequency"],
  ["duration", "Duration"],
] as const;

/** Lowest measured OCR confidence, or null when every page had real text. */
export function weakestRead(record: DocumentView) {
  const pages = (record.pageTexts ?? []).filter(
    (page) => page.method !== "SELECTABLE_TEXT",
  );
  if (!pages.length) return null;
  if (pages.some((page) => page.method === "HANDWRITING_AI"))
    return { handwriting: true, confidence: null };
  const confidence = Math.min(...pages.map((page) => page.confidence));
  return confidence < 60
    ? { handwriting: false, confidence: Math.round(confidence) }
    : null;
}

export type DocumentView = {
  _id: string;
  patientId?: string;
  authorId?: string;
  authorName?: string;
  title: string;
  filename: string;
  mime?: string;
  category: string;
  reportDate: string | null;
  createdAt: string;
  status: string;
  extractionState?: string;
  verification: string;
  fileId?: string;
  error?: string | null;
  attempts?: number;
  pageCount?: number;
  ocrMethods?: string[];
  classificationReason?: string;
  extractionWarning?: string | null;
  authorRole?: string;
  pageTexts?: {
    page: number;
    method: string;
    confidence: number;
    text: string;
  }[];
  extracted?: ExtractionView;
  confirmed?: ExtractionView;
  encounter?: { [key: string]: string };
  documentSource?: string;
  organizationId?: string;
  organizationName?: string;
  uploadedByStaffId?: string;
  uploadedByStaffName?: string;
  pharmacyEncounter?: {
    visitDate?: string;
    patientReportedConcern?: string;
    relevantHistoryReviewed?: string;
    guidanceOrService?: string;
    doctorReferralRecommended?: string;
    notes?: string;
    pharmacyId?: string;
    pharmacyName?: string;
    pharmacyRegistrationNumber?: string;
    staffId?: string;
    staffName?: string;
  };
  pharmacyDispensing?: {
    medicineName?: string;
    activeIngredient?: string | null;
    activeIngredientVerified?: boolean;
    strength?: string | null;
    quantitySupplied?: string;
    dispensingDate?: string;
    prescriptionReference?: string | null;
    pharmacyId?: string;
    pharmacyName?: string;
    pharmacyRegistrationNumber?: string;
    staffId?: string;
    staffName?: string;
  };
};

const label = (value: string) => value.toLowerCase().replaceAll("_", " ");
const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Date not recorded";
const timestamp = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }) + " UTC"
    : "—";

const stageOrder = ["UPLOADED", "QUEUED", "PROCESSING", "NEEDS_REVIEW", "COMPLETED"];

const UNINFORMATIVE_TITLE =
  /^(untitled|document|report|scan|image|file|unknown)$|not a medical record|not for treatment/i;
export function displayTitle(record: { title?: string; filename?: string }) {
  const title = (record.title || "").trim();
  if (title && !UNINFORMATIVE_TITLE.test(title)) return title;
  return record.filename || title || "Untitled document";
}
export function recordTypeLabel(record: DocumentView) {
  if (record.pharmacyEncounter || record.category === "PHARMACY_ENCOUNTER")
    return "Pharmacy Assistance Encounter";
  if (record.pharmacyDispensing || record.category === "MEDICINE_DISPENSING")
    return "Pharmacy Medicine Dispensing";
  if (record.encounter) return "Doctor-authored Clinical Encounter";
  if (record.documentSource === "PHARMACY_UPLOAD")
    return "Pharmacy-uploaded Document";
  if (record.category === "PRESCRIPTION") return "Prescription Record";
  if (record.fileId && record.authorId && record.patientId === record.authorId)
    return "Patient-uploaded Document";
  return record.fileId ? "Uploaded Medical Document" : "Digital Medical Record";
}
export function verificationBadgeClass(verification: string) {
  if (
    verification === "PATIENT_CONFIRMED" ||
    verification === "CLINICIAN_VERIFIED" ||
    verification === "CLINICIAN_AUTHORED"
  )
    return "good";
  return verification === "UNREVIEWED" ? "" : "warn";
}
const medicineSummary = (medicine: MedicineView) =>
  [
    medicine.name,
    medicine.strength,
    medicine.dosage,
    medicine.frequency,
    medicine.duration,
  ]
    .filter(Boolean)
    .join(" · ");

export function statusBadgeClass(status: string) {
  if (status === "COMPLETED") return "good";
  if (status === "FAILED") return "bad";
  if (status === "NEEDS_REVIEW") return "warn";
  return "";
}

export function ProcessingStages({ status }: { status: string }) {
  if (status === "FAILED")
    return (
      <Localize>
        <div className="stage-track failed">
          <span className="stage current">Failed</span>
        </div>
      </Localize>
    );
  const currentIndex = stageOrder.indexOf(status);
  return (
    <Localize>
      <ol className="stage-track">
        {stageOrder.map((stage, index) => (
          <li
            key={stage}
            className={
              index < currentIndex
                ? "stage done"
                : index === currentIndex
                  ? "stage current"
                  : "stage"
            }
          >
            {label(stage)}
          </li>
        ))}
      </ol>
    </Localize>
  );
}

export function DocumentDetail({
  record,
  busy,
  onSave,
  onRetry,
  canReview,
  workerOnline = true,
  backHref = "/patient/records",
}: {
  record: DocumentView;
  busy: boolean;
  workerOnline?: boolean;
  onSave: (data: ExtractionView) => Promise<void>;
  onRetry: () => Promise<void>;
  canReview: boolean;
  backHref?: string;
}) {
  const { locale } = useI18n();
  const source = record.confirmed || record.extracted;
  const [values, setValues] = useState<ExtractionView | undefined>(source);
  const [syncedFor, setSyncedFor] = useState(`${record._id}:${record.status}`);
  const [tab, setTab] = useState<"extracted" | "ocr" | "details">("extracted");
  const syncKey = `${record._id}:${record.status}`;
  if (syncedFor !== syncKey) {
    setSyncedFor(syncKey);
    setValues(source);
  }
  const ocrText = record.extracted
    ? "Extracted page text is stored with the document and is available for retrieval."
    : "";
  const pageTexts = record.pageTexts ?? [];
  const weak = weakestRead(record);
  const prescription = values?.prescription;
  const setMedicines = (medicines: MedicineView[]) =>
    values &&
    setValues({
      ...values,
      prescription: {
        prescriber: values.prescription?.prescriber ?? null,
        unreadable: values.prescription?.unreadable ?? 0,
        medicines,
      },
      medications: [
        ...new Set([
          ...values.medications.filter(
            (line) =>
              !(values.prescription?.medicines ?? []).some(
                (medicine) => medicineSummary(medicine) === line,
              ),
          ),
          ...medicines.filter((m) => m.name.trim()).map(medicineSummary),
        ]),
      ],
    });
  const previewUrl =
    "/api/records/" + record._id + "/file" + (record.mime === "application/pdf" ? "" : "?view=inline");

  if (record.pharmacyEncounter || record.pharmacyDispensing)
    return <PharmacyRecordDetails record={record} backHref={backHref} />;

  return (
    <Localize>
    <section className="panel">
      <Link className="back-link" href={backHref}>
        <ArrowLeft size={16} /> All records
      </Link>
      <div className="panel-heading">
        <div>
          <h2>{displayTitle(record)}</h2>
          <p className="record-meta">
            <span
              className={"badge " + verificationBadgeClass(record.verification)}
            >
              {label(record.verification)}
            </span>
            <span className={"badge " + statusBadgeClass(record.status)}>
              {label(record.status)}
            </span>
            <span>
              {record.fileId ? record.filename : recordTypeLabel(record)}
            </span>
          </p>
        </div>
        {record.fileId && (
          <a
            className="button outline"
            href={"/api/records/" + record._id + "/file"}
          >
            <Download size={16} /> Original report
          </a>
        )}
      </div>
      <ProcessingStages status={record.status} />
      {record.error && (
        <div className="error">
          <AlertTriangle size={15} /> {record.error}
        </div>
      )}
      {record.extractionWarning && (
        <div className="notice">
          <AlertTriangle size={15} /> {record.extractionWarning} Deterministic
          parsing was used for this report, so some fields may need review.
        </div>
      )}
      {record.status === "FAILED" && canReview && (
        <Button onClick={() => void onRetry()} disabled={busy}>
          <RotateCcw size={16} /> Retry processing
        </Button>
      )}
      {record.status === "NEEDS_REVIEW" && weak && (
        <div className="notice" role="status">
          <AlertTriangle size={15} />{" "}
          {weak.handwriting
            ? "This document was read from handwriting by an AI model. Handwriting is often misread, so every medicine below is marked as needing review."
            : "The text in this document could not be read reliably."}{" "}
          {weak.confidence !== null && (
            <>
              OCR confidence: <strong>{weak.confidence}%</strong>.{" "}
            </>
          )}
          Compare everything with the original before you confirm it, and add
          or correct medicines yourself in the review form.
          {canReview && (
            <button
              type="button"
              className="link-button"
              onClick={() => void onRetry()}
              disabled={busy}
            >
              <RotateCcw size={14} /> Read this document again
            </button>
          )}
        </div>
      )}
      {["QUEUED", "PROCESSING"].includes(record.status) &&
        (record.attempts ?? 0) > 1 && (
          <p className="muted-line">
            <span>
              An earlier attempt did not finish, so this report is being read
              again.
            </span>{" "}
            <span>Attempts:</span> {record.attempts}
          </p>
        )}
      {["UPLOADED", "QUEUED", "PROCESSING"].includes(record.status) &&
        (workerOnline ? (
          <div className="notice" role="status">
            {record.status === "PROCESSING"
              ? "This report is being read now. Text and medical details appear here automatically when it finishes."
              : "This report is queued. It will be read automatically and this page updates on its own."}
          </div>
        ) : (
          <div className="error" role="alert">
            <AlertTriangle size={15} /> Document processing is not running, so
            this report cannot be read yet. Your file is saved and will be
            processed automatically once processing starts again. On a local
            installation, start it with npm run dev or npm run worker.
          </div>
        ))}
      {record.status === "NEEDS_REVIEW" && (
        <div className="notice">
          Extraction finished. Review the detected fields below and confirm or
          correct them before they become part of your medical history.
        </div>
      )}
      {record.category === "NON_MEDICAL" && (
        <div className="notice">
          This document was classified as non-medical. It is excluded from
          clinical retrieval by default. You can reclassify it below.
        </div>
      )}
      {record.encounter ? (
        <div className="encounter-details">
          {Object.entries(record.encounter).map(([key, value]) => (
            <div key={key}>
              <strong>{key}</strong>
              <p className="medical-value">{value || "Not recorded"}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="document-detail-grid">
          <div className="document-preview">
            <div className="preview-head">
              <FileText size={16} />
              <span>Original document</span>
              {record.fileId && (
                <a
                  href={"/api/records/" + record._id + "/file"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} /> Open
                </a>
              )}
            </div>
            {record.fileId ? (
              <object
                className="preview-frame"
                data={previewUrl}
                type={record.mime || "application/octet-stream"}
                aria-label={
                  translate("Original report preview", locale) +
                  " " +
                  record.filename
                }
              />
            ) : (
              <div className="preview-placeholder">
                <Eye size={22} />
                <p>This is a digital medical record with no original file.</p>
              </div>
            )}
          </div>
          <div className="extraction-pane">
            <div className="tab-row" role="tablist">
              {(
                [
                  ["extracted", "Extracted information"],
                  ["ocr", "OCR text"],
                  ["details", "Details"],
                ] as const
              ).map(([key, name]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  className={tab === key ? "tab active" : "tab"}
                  onClick={() => setTab(key)}
                >
                  {name}
                </button>
              ))}
            </div>
            {tab === "extracted" && (
              <div className="extraction-body">
                {!values ? (
                  <p className="muted-line">
                    No extraction is available yet. The worker has not finished
                    reading this document.
                  </p>
                ) : (
                  <dl className="extraction-fields">
                    <div>
                      <dt>Document type</dt>
                      <dd>{label(values.category)}</dd>
                    </div>
                    <div>
                      <dt>Report date</dt>
                      <dd>
                        {values.reportDate
                          ? date(values.reportDate)
                          : "Report date not available — review required"}
                      </dd>
                    </div>
                    <div>
                      <dt>Laboratory</dt>
                      <dd>
                        {values.laboratory ? (
                          <span className="medical-value">{values.laboratory}</span>
                        ) : (
                          "Not recorded"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Hospital</dt>
                      <dd>
                        {values.hospital ? (
                          <span className="medical-value">{values.hospital}</span>
                        ) : (
                          "Not recorded"
                        )}
                      </dd>
                    </div>
                  </dl>
                )}
                {!!values?.observations.length && (
                  <div className="table-wrap">
                    <table className="observation-table">
                      <thead>
                        <tr>
                          <th>Test</th>
                          <th>Result</th>
                          <th>Unit</th>
                          <th>Reference range</th>
                          <th>Page</th>
                        </tr>
                      </thead>
                      <tbody>
                        {values.observations.map((observation, index) => (
                          <tr key={index}>
                            <td className="medical-value">{observation.test}</td>
                            <td>
                              <strong className="medical-value">{observation.result}</strong>
                            </td>
                            <td className="medical-value">{observation.unit || "—"}</td>
                            <td className="medical-value">
                              {observation.referenceRange || "—"}
                            </td>
                            <td>{observation.page}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {prescription &&
                  (!!prescription.medicines.length ||
                    prescription.unreadable > 0 ||
                    values?.category === "PRESCRIPTION") && (
                    <div className="extraction-block">
                      <h4>Prescribed medicines</h4>
                      {prescription.prescriber && (
                        <p className="muted-line">
                          Prescribed by:{" "}
                          <span className="medical-value">
                            {prescription.prescriber}
                          </span>
                        </p>
                      )}
                      {prescription.medicines.length ? (
                        <ul className="medicine-list">
                          {prescription.medicines.map((medicine, index) => (
                            <li key={index}>
                              <div className="medicine-head">
                                <strong className="medical-value">
                                  {medicine.name}
                                </strong>
                                <span
                                  className={
                                    "badge " +
                                    medicineStatus[medicine.review][1]
                                  }
                                >
                                  {medicineStatus[medicine.review][0]}
                                </span>
                              </div>
                              <dl className="medicine-details">
                                {medicineFields.slice(1).map(([key, name]) => (
                                  <div key={key}>
                                    <dt>{name}</dt>
                                    <dd>
                                      {medicine[key] ? (
                                        <span className="medical-value">
                                          {medicine[key]}
                                        </span>
                                      ) : (
                                        <span className="muted-line">
                                          Not found
                                        </span>
                                      )}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted-line">
                          No medicine name could be read from this document.
                          Nothing has been guessed.
                        </p>
                      )}
                      {prescription.unreadable > 0 && (
                        <p className="muted-line">
                          <span>
                            Lines that looked like medicines but could not be
                            read, and were left out:
                          </span>{" "}
                          {prescription.unreadable}
                        </p>
                      )}
                      <p className="muted-line">
                        These are medicines written on this document
                        (prescribed). It does not show whether they were
                        dispensed or taken.
                      </p>
                    </div>
                  )}
                {!!values?.medications.length &&
                  !prescription?.medicines.length && (
                  <div className="extraction-block">
                    <h4>Medications documented</h4>
                    <ul>
                      {values.medications.map((medication) => (
                        <li className="medical-value" key={medication}>
                          {medication}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!!values?.diagnoses.length && (
                  <div className="extraction-block">
                    <h4>Diagnoses documented</h4>
                    <ul>
                      {values.diagnoses.map((diagnosis) => (
                        <li className="medical-value" key={diagnosis}>
                          {diagnosis}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="verification-line">
                  <Check size={14} /> Verification level:{" "}
                  <strong>{label(record.verification)}</strong>. AI extraction is
                  never clinician verification.
                </p>
              </div>
            )}
            {tab === "ocr" && (
              <div className="extraction-body">
                {pageTexts.length ? (
                  pageTexts.map((page) => (
                    <div className="ocr-page" key={page.page}>
                      <div className="ocr-page-head">
                        <span>Page {page.page}</span>
                        <small>
                          {label(page.method)} · confidence{" "}
                          {Math.round(page.confidence)}%
                        </small>
                      </div>
                      <pre className="ocr-text">
                        {page.text.trim() ||
                          "No readable text on this page."}
                      </pre>
                    </div>
                  ))
                ) : (
                  <p className="muted-line">
                    {ocrText ||
                      "OCR text becomes available once the worker finishes extracting this document."}
                  </p>
                )}
                <p className="muted-line">
                  Pages processed: {record.pageCount ?? 0}. Extraction methods:{" "}
                  {record.ocrMethods?.join(", ") || "not recorded"}.
                </p>
              </div>
            )}
            {tab === "details" && (
              <div className="extraction-body">
                <dl className="extraction-fields">
                  <div>
                    <dt>Uploaded</dt>
                    <dd>{timestamp(record.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Processing status</dt>
                    <dd>{label(record.status)}</dd>
                  </div>
                  <div>
                    <dt>Extraction status</dt>
                    <dd>{label(record.extractionState || "pending")}</dd>
                  </div>
                  <div>
                    <dt>Verification</dt>
                    <dd>{label(record.verification)}</dd>
                  </div>
                  <div>
                    <dt>Classification reason</dt>
                    <dd>{record.classificationReason || "Not recorded"}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
      {values && canReview && (
        <form
          className="review-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave(
              values.prescription
                ? {
                    ...values,
                    prescription: {
                      ...values.prescription,
                      medicines: values.prescription.medicines.filter(
                        (medicine) => medicine.name.trim(),
                      ),
                    },
                  }
                : values,
            );
          }}
        >
          <h3>Review extracted information</h3>
          <p>
            Compare these details with the original. Patient confirmation is not
            clinician verification. The original extracted text is preserved
            alongside your corrections.
          </p>
          <div className="form-row">
            <label>
              Report title
              <input
                value={values.title}
                onChange={(event) =>
                  setValues({ ...values, title: event.target.value })
                }
              />
            </label>
            <label>
              Report date
              <input
                type="date"
                value={values.reportDate || ""}
                onChange={(event) =>
                  setValues({
                    ...values,
                    reportDate: event.target.value || null,
                  })
                }
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Category
              <select
                value={values.category}
                onChange={(event) =>
                  setValues({ ...values, category: event.target.value })
                }
              >
                {[
                  "LAB_REPORT",
                  "PRESCRIPTION",
                  "DIAGNOSTIC_REPORT",
                  "CLINICAL_NOTE",
                  "DISCHARGE_SUMMARY",
                  "OTHER_MEDICAL",
                  "NON_MEDICAL",
                  "UNKNOWN",
                ].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Laboratory
              <input
                value={values.laboratory || ""}
                onChange={(event) =>
                  setValues({
                    ...values,
                    laboratory: event.target.value || null,
                  })
                }
              />
            </label>
            <label>
              Hospital
              <input
                value={values.hospital || ""}
                onChange={(event) =>
                  setValues({
                    ...values,
                    hospital: event.target.value || null,
                  })
                }
              />
            </label>
          </div>
          {values.observations.map((observation, index) => (
            <fieldset className="observation-form" key={index}>
              <legend>Finding {index + 1}</legend>
              {(
                ["test", "result", "unit", "referenceRange", "page"] as const
              ).map((key) => (
                <label key={key}>
                  {label(key)}
                  <input
                    value={observation[key] ?? ""}
                    type={key === "page" ? "number" : "text"}
                    min={1}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        observations: values.observations.map((entry, position) =>
                          position === index
                            ? {
                                ...entry,
                                [key]:
                                  key === "page"
                                    ? Number(event.target.value)
                                    : event.target.value,
                              }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </fieldset>
          ))}
          <fieldset className="medicine-editor">
            <legend>Prescribed medicines</legend>
            <p className="muted-line">
              Type each medicine exactly as written on the original. Leave a
              box empty if you cannot read it.
            </p>
            {(values.prescription?.medicines ?? []).map((medicine, index) => (
              <div className="medicine-row" key={index}>
                {medicineFields.map(([key, name]) => (
                  <label key={key}>
                    {name}
                    <input
                      value={medicine[key] ?? ""}
                      maxLength={key === "name" ? 120 : 60}
                      onChange={(event) =>
                        setMedicines(
                          (values.prescription?.medicines ?? []).map(
                            (entry, position) =>
                              position === index
                                ? {
                                    ...entry,
                                    [key]:
                                      event.target.value ||
                                      (key === "name" ? "" : null),
                                    review: "PATIENT_ENTERED" as const,
                                  }
                                : entry,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="link-button"
                  onClick={() =>
                    setMedicines(
                      (values.prescription?.medicines ?? []).filter(
                        (_, position) => position !== index,
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button outline"
              onClick={() =>
                setMedicines([
                  ...(values.prescription?.medicines ?? []),
                  {
                    name: "",
                    strength: null,
                    dosage: null,
                    frequency: null,
                    duration: null,
                    sourceText: "",
                    page: 1,
                    review: "PATIENT_ENTERED",
                  },
                ])
              }
            >
              Add a medicine
            </button>
          </fieldset>
          <label>
            Recorded medications (one per line)
            <textarea
              value={values.medications.join("\n")}
              onChange={(event) =>
                setValues({
                  ...values,
                  medications: event.target.value.split("\n").filter(Boolean),
                })
              }
            />
          </label>
          <label>
            Documented diagnoses (one per line)
            <textarea
              value={values.diagnoses.join("\n")}
              onChange={(event) =>
                setValues({
                  ...values,
                  diagnoses: event.target.value.split("\n").filter(Boolean),
                })
              }
            />
          </label>
          <Button disabled={busy}>
            <Check size={17} /> Confirm reviewed details
          </Button>
        </form>
      )}
    </section>
    </Localize>
  );
}

export function PharmacyRecordDetails({
  record,
  backHref,
}: {
  record: DocumentView;
  backHref: string;
}) {
  const encounter = record.pharmacyEncounter;
  const dispensing = record.pharmacyDispensing;
  const pharmacyName =
    encounter?.pharmacyName ||
    dispensing?.pharmacyName ||
    record.organizationName ||
    "Not recorded";
  const staffName =
    encounter?.staffName ||
    dispensing?.staffName ||
    record.uploadedByStaffName ||
    record.authorName ||
    "Not recorded";
  const value = (text?: string | null) => text?.trim() || "Not recorded";
  const fields: [string, string][] = encounter
    ? [
        ["Patient-reported concern", value(encounter.patientReportedConcern)],
        ["Relevant history reviewed", value(encounter.relevantHistoryReviewed)],
        ["Basic guidance or service provided", value(encounter.guidanceOrService)],
        [
          "Doctor referral recommended",
          encounter.doctorReferralRecommended === "YES"
            ? "Yes"
            : encounter.doctorReferralRecommended === "NO"
              ? "No"
              : "Not recorded",
        ],
        ["Additional notes", value(encounter.notes)],
      ]
    : [
        ["Medicine name", value(dispensing?.medicineName)],
        [
          "Verified generic / active ingredient",
          dispensing?.activeIngredientVerified
            ? value(dispensing.activeIngredient)
            : "Not verified",
        ],
        ["Strength", value(dispensing?.strength)],
        ["Quantity supplied", value(dispensing?.quantitySupplied)],
        [
          "Prescription reference",
          value(dispensing?.prescriptionReference),
        ],
      ];

  return (
    <Localize>
      <section className="panel pharmacy-record-detail">
        <Link className="back-link" href={backHref}>
          <ArrowLeft size={16} /> All records
        </Link>
        <div className="panel-heading">
          <div>
            <span className="section-kicker">{recordTypeLabel(record)}</span>
            <h2>{recordTypeLabel(record)}</h2>
            <p className="record-meta">
              <span className="badge good">Recorded</span>
              <span className="badge">Not clinician-verified</span>
            </p>
          </div>
        </div>
        <div className="notice" role="status">
          Digital Pharmacy Record — No OCR required
        </div>
        <dl className="extraction-fields pharmacy-record-fields">
          <div>
            <dt>Pharmacy organization</dt>
            <dd className="medical-value">{pharmacyName}</dd>
          </div>
          <div>
            <dt>Staff member</dt>
            <dd className="medical-value">{staffName}</dd>
          </div>
          <div>
            <dt>{encounter ? "Visit date" : "Dispensing date"}</dt>
            <dd>
              {date(
                encounter?.visitDate ?? dispensing?.dispensingDate ?? record.reportDate,
              )}
            </dd>
          </div>
          {fields.map(([name, text]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd className="medical-value pharmacy-record-value">{text}</dd>
            </div>
          ))}
          <div>
            <dt>Record creation timestamp</dt>
            <dd>{timestamp(record.createdAt)}</dd>
          </div>
          <div>
            <dt>Review / verification status</dt>
            <dd>Unreviewed — not verified by a doctor</dd>
          </div>
        </dl>
      </section>
    </Localize>
  );
}
