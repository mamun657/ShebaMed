import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

const outputDirectory = resolve(process.cwd(), "demo/fixtures");
await mkdir(outputDirectory, { recursive: true });

const charcoal = "#17191D";
const orange = "#FF9800";

function renderPage(
  title: string,
  subtitle: string,
  rows: { label: string; value: string }[],
  footer: string,
) {
  const width = 1240;
  const height = 1754;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);
  context.fillStyle = charcoal;
  context.fillRect(0, 0, width, 150);
  context.fillStyle = orange;
  context.fillRect(0, 150, width, 12);
  context.fillStyle = "#FFFFFF";
  context.font = "bold 54px sans-serif";
  context.fillText(title, 80, 95);
  context.fillStyle = charcoal;
  context.font = "bold 40px sans-serif";
  context.fillText(subtitle, 80, 260);
  context.font = "36px sans-serif";
  let y = 360;
  for (const row of rows) {
    context.fillStyle = "#555555";
    context.fillText(row.label + ":", 80, y);
    context.fillStyle = charcoal;
    context.font = "bold 36px sans-serif";
    context.fillText(row.value, 420, y);
    context.font = "36px sans-serif";
    context.strokeStyle = "#DDDDDD";
    context.beginPath();
    context.moveTo(80, y + 26);
    context.lineTo(width - 80, y + 26);
    context.stroke();
    y += 84;
  }
  context.fillStyle = "#777777";
  context.font = "28px sans-serif";
  context.fillText(footer, 80, height - 60);
  return canvas.toBuffer("image/jpeg", 92);
}

function buildImagePdf(images: Buffer[], width: number, height: number) {
  const objects: { id: number; body: string; image?: Buffer }[] = [];
  const pageIds = images.map((_, index) => 3 + index * 3);
  objects.push({ id: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" });
  objects.push({
    id: 2,
    body: `<< /Type /Pages /Kids [${pageIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${images.length} >>`,
  });
  images.forEach((image, index) => {
    const pageId = 3 + index * 3;
    const contentId = 4 + index * 3;
    const imageId = 5 + index * 3;
    const content = "q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n";
    objects.push({
      id: pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    });
    objects.push({
      id: contentId,
      body: `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    });
    objects.push({
      id: imageId,
      body: `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,
      image,
    });
  });
  objects.sort((a, b) => a.id - b.id);
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const object of objects) {
    offsets.push(pdf.length);
    if (object.image) {
      pdf += `${object.id} 0 obj\n${object.body}`;
      pdf += object.image.toString("binary");
      pdf += "\nendstream\nendobj\n";
      continue;
    }
    pdf += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets)
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, "binary");
}

const pageOne = renderPage(
  "SYNTHETIC FIXTURE - NOT A MEDICAL RECORD",
  "Fictional Laboratory - Laboratory Report",
  [
    { label: "Patient", value: "Synthetic Test Patient" },
    { label: "Report date", value: "2026-04-18" },
    { label: "Test", value: "CBC" },
    { label: "Result", value: "14.0 g/dL" },
    { label: "Reference range", value: "12.0 - 16.0 g/dL" },
    { label: "Laboratory", value: "Fictional Laboratory" },
  ],
  "Scanned synthetic page one. Software testing only.",
);

const pageTwo = renderPage(
  "SYNTHETIC FIXTURE - NOT A MEDICAL RECORD",
  "Fictional Laboratory - Laboratory Report continued",
  [
    { label: "Report date", value: "2026-04-18" },
    { label: "Test", value: "Platelets" },
    { label: "Result", value: "250 x10^9/L" },
    { label: "Reference range", value: "150 - 400 x10^9/L" },
    { label: "Laboratory", value: "Fictional Laboratory" },
  ],
  "Scanned synthetic page two. Software testing only.",
);

await writeFile(
  resolve(outputDirectory, "fixture-multipage-scanned.pdf"),
  buildImagePdf([pageOne, pageTwo], 1240, 1754),
);

const textPageOne = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 430 >>
stream
BT /F1 13 Tf 60 780 Td (SYNTHETIC FIXTURE - NOT A MEDICAL RECORD) Tj 0 -30 Td (Fictional Laboratory - Laboratory Report) Tj 0 -40 Td (Patient: Synthetic Test Patient) Tj 0 -24 Td (Report date: 2026-01-12) Tj 0 -24 Td (Test: HbA1c) Tj 0 -24 Td (Result: 6.8 %) Tj 0 -24 Td (Reference range: 4.0 - 5.6 %) Tj 0 -24 Td (Laboratory: Fictional Laboratory) Tj ET
endstream
endobj
5 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>
endobj
6 0 obj
<< /Length 300 >>
stream
BT /F1 13 Tf 60 780 Td (SYNTHETIC FIXTURE - NOT A MEDICAL RECORD) Tj 0 -30 Td (Fictional Laboratory - Laboratory Report continued) Tj 0 -40 Td (Report date: 2026-01-12) Tj 0 -24 Td (Test: Glucose) Tj 0 -24 Td (Result: 92 mg/dL) Tj 0 -24 Td (Reference range: 70 - 100 mg/dL) Tj ET
endstream
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF
`;

await writeFile(
  resolve(outputDirectory, "fixture-text-multipage.pdf"),
  Buffer.from(textPageOne, "binary"),
);

await writeFile(
  resolve(outputDirectory, "fixture-corrupt.pdf"),
  Buffer.from("%PDF-1.4\nthis is not a valid pdf body\n%%EOF\n", "binary"),
);

console.log("pdf fixtures written to", outputDirectory);
process.exit(0);
