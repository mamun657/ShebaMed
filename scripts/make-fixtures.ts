import { createCanvas } from "@napi-rs/canvas";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve(process.cwd(), "demo/fixtures");
await mkdir(outputDirectory, { recursive: true });

const charcoal = "#17191D";
const orange = "#FF9800";

function drawReport(options: {
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
  footer: string;
  width?: number;
  height?: number;
}) {
  const width = options.width ?? 1000;
  const height = options.height ?? 640;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);
  context.fillStyle = charcoal;
  context.fillRect(0, 0, width, 90);
  context.fillStyle = orange;
  context.fillRect(0, 90, width, 8);
  context.fillStyle = "#FFFFFF";
  context.font = "bold 34px sans-serif";
  context.fillText(options.title, 48, 58);
  context.fillStyle = charcoal;
  context.font = "bold 26px sans-serif";
  context.fillText(options.subtitle, 48, 150);
  context.font = "24px sans-serif";
  let y = 210;
  for (const row of options.rows) {
    context.fillStyle = "#444444";
    context.fillText(row.label + ":", 48, y);
    context.fillStyle = charcoal;
    context.font = "bold 24px sans-serif";
    context.fillText(row.value, 320, y);
    context.font = "24px sans-serif";
    context.strokeStyle = "#DDDDDD";
    context.beginPath();
    context.moveTo(48, y + 18);
    context.lineTo(width - 48, y + 18);
    context.stroke();
    y += 58;
  }
  context.fillStyle = "#666666";
  context.font = "20px sans-serif";
  context.fillText(options.footer, 48, height - 40);
  return canvas.toBuffer("image/png");
}

const hba1c = drawReport({
  title: "SYNTHETIC FIXTURE - NOT A MEDICAL RECORD",
  subtitle: "Fictional Laboratory - Laboratory Report",
  rows: [
    { label: "Patient", value: "Synthetic Test Patient" },
    { label: "Report date", value: "2026-01-12" },
    { label: "Test", value: "HbA1c" },
    { label: "Result", value: "6.8 %" },
    { label: "Reference range", value: "4.0 - 5.6 %" },
    { label: "Laboratory", value: "Fictional Laboratory" },
  ],
  footer: "Synthetic fixture generated for software testing only.",
});

await writeFile(resolve(outputDirectory, "fixture-hba1c.png"), hba1c);

const missingDate = drawReport({
  title: "SYNTHETIC FIXTURE - NOT A MEDICAL RECORD",
  subtitle: "Fictional Laboratory - Laboratory Report",
  rows: [
    { label: "Patient", value: "Synthetic Test Patient" },
    { label: "Test", value: "Lipase" },
    { label: "Result", value: "42 U/L" },
    { label: "Reference range", value: "13 - 60 U/L" },
    { label: "Laboratory", value: "Fictional Laboratory" },
  ],
  footer: "No report date is printed anywhere on this synthetic page.",
});

await writeFile(resolve(outputDirectory, "fixture-no-date.png"), missingDate);

const prescription = drawReport({
  title: "SYNTHETIC FIXTURE - NOT FOR TREATMENT",
  subtitle: "Fictional Demonstration Clinic - Prescription",
  rows: [
    { label: "Patient", value: "Synthetic Test Patient" },
    { label: "Report date", value: "2026-02-03" },
    { label: "Medication", value: "DEMO-PLACEHOLDER (not a real drug)" },
    { label: "Diagnosis", value: "Not documented" },
    { label: "Clinic", value: "Fictional Demonstration Clinic" },
  ],
  footer: "No medication advice. Synthetic fixture for software testing only.",
});

await writeFile(resolve(outputDirectory, "fixture-prescription.png"), prescription);

const resume = drawReport({
  title: "CURICULUM VITAE",
  subtitle: "Professional Summary",
  rows: [
    { label: "Name", value: "Synthetic Person" },
    { label: "Career objective", value: "Employment in software engineering" },
    { label: "Work experience", value: "Software Engineer, Fictional Company" },
    { label: "Educational qualification", value: "BSc Computer Science" },
    { label: "Key skills", value: "Programming, testing" },
    { label: "Languages known", value: "English" },
  ],
  footer: "Professional experience summary. Not a medical document.",
});

await writeFile(resolve(outputDirectory, "fixture-resume.png"), resume);

const lowQuality = drawReport({
  title: "SYNTHETIC FIXTURE - ROTATED",
  subtitle: "Fictional Laboratory",
  rows: [
    { label: "Report date", value: "2026-03-09" },
    { label: "Test", value: "Creatinine" },
    { label: "Result", value: "1.1 mg/dL" },
    { label: "Reference range", value: "0.6 - 1.3 mg/dL" },
  ],
  footer: "Rotated synthetic page.",
  width: 900,
  height: 560,
});

await writeFile(resolve(outputDirectory, "fixture-rotated.png"), lowQuality);

console.log("fixtures written to", outputDirectory);
process.exit(0);
