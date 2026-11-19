import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { Localize, LocaleSwitcher } from "@/lib/i18n";
const content: Record<
  string,
  { title: string; intro: string; items: [string, string][] }
> = {
  about: {
    title: "A more connected medical history.",
    intro:
      "ShebaMed is a patient-controlled outpatient electronic medical record MVP designed for Bangladesh.",
    items: [
      [
        "The problem",
        "Reports from different providers often stay disconnected. Patients and doctors lose context when previous records are hard to retrieve.",
      ],
      [
        "Our approach",
        "Keep original documents, review extracted information, explore a chronological timeline and share records with specific doctors by permission.",
      ],
      [
        "Current scope",
        "A controlled, synthetic-data MVP. It is not a certified clinical system, emergency service or replacement for professional care.",
      ],
    ],
  },
  "how-it-works": {
    title: "From your first report to your next visit.",
    intro:
      "Create an account, organize your history and share it on your terms.",
    items: [
      [
        "1. Register",
        "Use a Bangladeshi mobile number and a password. Download the recovery codes shown once. Your number is not ownership-verified.",
      ],
      [
        "2. Upload and review",
        "Upload a PDF or image. A local worker performs OCR and Groq extracts structured information. Review mistakes before confirming the report.",
      ],
      [
        "3. Retrieve history",
        "Search your timeline or ask questions in English or Bangla. Evidence-linked answers include report sources.",
      ],
      [
        "4. Share and revoke",
        "Create a single-use code. A reviewed doctor requests access. Select records and capabilities for 30 or 60 minutes, then revoke anytime.",
      ],
    ],
  },
  features: {
    title: "Your records, with context.",
    intro:
      "A focused workspace for medical history and outpatient collaboration.",
    items: [
      [
        "Document library",
        "Private GridFS originals, file validation, processing status, original downloads and manual extraction review.",
      ],
      [
        "Medical timeline",
        "Chronological records sorted by report date, with unknown dates labeled separately.",
      ],
      [
        "AI medical memory",
        "Authorized text retrieval and Groq answers with validated source references. AI output may be wrong; consult original reports.",
      ],
      [
        "Doctor access",
        "Short-lived requests, scoped grants, separate read and write permissions, expiration and revocation.",
      ],
    ],
  },
  "for-doctors": {
    title: "More context. A better-informed visit.",
    intro:
      "Access patient history only after the patient approves your request.",
    items: [
      [
        "Professional review",
        "Provide registration number, specialization, workplace and credential details. An admin manually reviews these; this is not official regulatory verification.",
      ],
      [
        "Authorized history",
        "Enter the patient’s sharing code and wait for approval. Only approved records and capabilities are available.",
      ],
      [
        "Contribute to care",
        "With separate permission, upload documents or create outpatient encounters. Clinical entries identify their author.",
      ],
    ],
  },
  security: {
    title: "Permission is part of the product.",
    intro:
      "Patient control is enforced on the server for every protected request.",
    items: [
      [
        "Account protection",
        "Argon2id password hashing, HTTP-only sessions, origin checks, rate limits and one-time recovery codes. Mobile numbers remain unverified.",
      ],
      [
        "Document protection",
        "Private GridFS storage. No public report URLs. Admins do not automatically receive clinical access.",
      ],
      [
        "Time-limited consent",
        "Doctor requests do not grant access. Patient approval defines scope and permissions. Every new request checks expiration and revocation. Previously downloaded copies cannot be recalled.",
      ],
      [
        "Known limits",
        "This MVP has not undergone an independent security audit or clinical validation. Use synthetic data. Backups, malware scanning, verified identity and operational monitoring need assessment before public use.",
      ],
    ],
  },
  privacy: {
    title: "Your information, clearly explained.",
    intro:
      "This policy describes the controlled ShebaMed MVP, not a clinical production service.",
    items: [
      [
        "What is stored",
        "Account and professional profile details, password hashes, recovery-code hashes, medical files, extracted text, corrections, consent and access events are stored in the configured MongoDB database.",
      ],
      [
        "AI processing",
        "Uploading a record queues local OCR and sends extracted text to Groq for structured analysis. Asking a question sends relevant authorized passages. Do not upload real patient information to this demo.",
      ],
      [
        "Who can access it",
        "Patients access their own records. Reviewed doctors require an active scoped grant. Admins review operational and account metadata without browsing clinical records.",
      ],
      [
        "Retention and control",
        "Revocation prevents future server requests but cannot erase copies already downloaded. This MVP does not provide automated account deletion or an established production retention schedule. The operator must define these before deployment.",
      ],
    ],
  },
  terms: {
    title: "Terms for the controlled MVP.",
    intro: "Use fictional accounts and synthetic medical information only.",
    items: [
      [
        "Not medical advice",
        "AI summaries retrieve and explain recorded information. They do not diagnose, prescribe, or determine whether treatment or tests are needed.",
      ],
      [
        "Your responsibilities",
        "Protect your password and recovery codes. Review extracted values against originals. Upload only records you are authorized to use.",
      ],
      [
        "Service limitations",
        "Availability depends on your local server, MongoDB, OCR resources and Groq account limits. The application provides no clinical or regulatory certification.",
      ],
    ],
  },
};
export function InfoPage({ slug }: { slug: string }) {
  const data = content[slug];
  if (!data) return null;
  return (
    <Localize>
    <>
      <header className="info-nav">
        <Brand />
        <LocaleSwitcher />
        <Link href="/login">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="info-page">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <span className="section-kicker">SHEBAMED</span>
        <h1>{data.title}</h1>
        <p className="lead">{data.intro}</p>
        {data.items.map(([t, p]) => (
          <section key={t}>
            <h2>{t}</h2>
            <p>{p}</p>
          </section>
        ))}
        <Link className="button primary" href="/register">
          Get started <ArrowUpRight size={17} />
        </Link>
      </main>
    </>
    </Localize>
  );
}
export const infoSlugs = Object.keys(content);
