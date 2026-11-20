# 🩺 ShebaMed

### Your Medical Records. Your Doctor. One Connected Story.

**An AI-Powered, Patient-Controlled Digital Healthcare Platform Connecting Patients, Doctors, and Local Pharmacies.**

*Your Health, Connected. Your Records, Your Permission.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
![AI](https://img.shields.io/badge/AI-OCR%20%2B%20RAG-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Controlled%20MVP-blue?style=for-the-badge)

**🌐 Live Website:** https://shebamed.vercel.app

**💻 GitHub Repository:** https://github.com/mamun657/ShebaMed

---

## 🌍 The Problem

Imagine visiting a new doctor.

The doctor asks:

"Have you done this test before?"

"What medicines were prescribed during your last visit?"

"Can you show me your previous medical reports?"

But you cannot remember everything.

Some reports are stored on your phone, some prescriptions are at home, and others may have been lost.

This is a common challenge for patients in Bangladesh.

Medical histories are often scattered across:

- Hospitals and diagnostic centers
- Paper prescriptions
- Medical reports and PDF files
- Mobile phone galleries
- Different doctors and healthcare providers

As a result, patients may struggle to explain their previous medical conditions, while doctors spend valuable consultation time searching through old information.

The problem becomes even more challenging in rural communities.

Many people visit their nearby pharmacy when they first feel unwell. However, pharmacy staff usually do not have access to the patient's previous medical history.

This creates a gap between patients, doctors, and local pharmacies.

**We believe medical history should not be lost between healthcare visits.**

---

## 💡 Our Solution

**ShebaMed is an AI-powered digital healthcare platform designed to make medical history organized, accessible, and connected.**

Our goal is simple:

**One Patient. One Connected Medical History. Better-Informed Healthcare.**

Patients can upload and manage medical reports, prescriptions, PDFs, and images in one place.

Using OCR technology, ShebaMed extracts available medical information from uploaded documents and helps organize it into a medical timeline.

Our AI Medical Assistant uses Retrieval-Augmented Generation (RAG) to search relevant medical records and answer questions with references to the original documents.

Patients can also securely share selected medical information with authorized doctors and pharmacies.

The most important part is that **patients remain in control of their medical records and access permissions.**

ShebaMed is not designed to replace doctors.

Instead, it helps healthcare professionals access relevant medical history and make better-informed decisions.

---

## ✨ Key Features

### 👤 1. Patient Workspace

Patients have their own secure medical-history workspace.

**Features:**

- Medical report and prescription uploads
- Support for PDFs and medical images
- Original medical document storage
- OCR-based medical text extraction
- Searchable medical records
- Chronological medical timeline
- AI Medical History Assistant
- Patient-controlled record sharing
- Doctor and pharmacy access approval
- Access revocation and permission management

**Example:**

A patient uploads an old blood test report.

ShebaMed stores the original document and processes its available information.

Later, the patient can search for the report or ask the AI about previous test results.

---

### 📄 2. AI-Powered Medical Document Processing

Medical documents often contain important information that patients cannot easily organize manually.

ShebaMed uses Optical Character Recognition (OCR) and document-processing techniques to extract available text from supported documents.

**Document Processing Workflow:**

1. Patient uploads a medical document.
2. The original file is stored.
3. OCR extracts available text.
4. Relevant medical details are organized.
5. The extracted information becomes available for review.
6. The document can be included in medical-history retrieval.

**Benefits:**

- Reduces manual searching
- Keeps original reports available
- Supports medical-history organization
- Makes previous reports easier to review
- Connects extracted information with source documents

OCR results may contain errors, especially with unclear images or handwritten prescriptions. Users should verify important details against the original documents.

---

### 🧠 3. AI Medical Memory - RAG-Based Assistant

One of ShebaMed's core features is its **AI Medical Memory**.

Instead of answering questions using only general AI knowledge, ShebaMed retrieves relevant information from the medical records the user is authorized to access.

**Example Questions:**

- "Have I done an HbA1c test before?"
- "What was my previous CBC result?"
- "Which medicines were previously prescribed?"
- "Did I have a similar medical issue before?"
- "Can you show me the original report?"

**How It Works:**

Patient Question → Authorized Medical Records → Relevant Information Retrieval → Groq AI → Source-Linked Answer

**Technologies:**

- Retrieval-Augmented Generation (RAG)
- Groq API
- Llama-family / Groq-hosted language models, according to configuration
- Medical document text extraction
- Context-aware retrieval
- Document source references
- Permission-based information access

**Why RAG?**

A general chatbot does not automatically know a patient's medical history.

RAG helps ShebaMed retrieve the relevant information from that patient's available records before generating an answer.

This makes responses more useful for medical-history review and allows users to verify supporting documents.

The AI does not independently diagnose diseases or prescribe medicines.

---

### 👨‍⚕️ 4. Doctor Workspace

ShebaMed provides a dedicated workspace for registered and administrator-reviewed medical professionals.

Doctors can request permission to review a patient's previous medical records.

After patient approval, doctors can access the information authorized for them.

**Features:**

- Doctor registration and profile review
- Patient access requests
- Authorized patient management
- Medical history review
- Original document viewing
- AI Clinical Memory
- Source-linked report searching
- Outpatient encounter documentation
- Clinical notes and test orders
- Follow-up information recording

**Example:**

A doctor wants to know whether a patient previously completed a particular diagnostic test.

Instead of manually searching several documents, the doctor can ask ShebaMed AI.

The system searches the authorized records and provides available information with source references.

The doctor can then review the original document and make the clinical decision.

---

### 🏪 5. Pharmacy Workspace

In Bangladesh, local pharmacies are often an important first point of contact for people seeking basic healthcare assistance.

ShebaMed connects participating pharmacies with patient-controlled medical history.

Authorized pharmacy staff can request access to relevant patient information and document permitted pharmacy services.

**Features:**

- Pharmacy registration
- Pharmacy profile and administrator verification
- Patient access requests
- Authorized medical history review
- Pharmacy-safe AI Medical Assistant
- Previous medicine-history lookup
- Medical document uploads with source attribution
- Pharmacy assistance encounters
- Medicine dispensing records
- Patient Medical Timeline integration

**Example:**

A patient visits a local pharmacy.

With the patient's permission, authorized pharmacy staff can check whether a particular medicine was previously prescribed or supplied.

They can also record the basic assistance provided during the visit.

If medicine is legally supplied, the pharmacy can create a separate dispensing record.

This information becomes part of the patient's medical history.

**Important:** A pharmacy record is not a doctor's diagnosis. A medicine being dispensed also does not mean that the patient actually consumed it.

Pharmacy staff must operate within their qualifications and professional scope.

---

### 🔐 6. Patient-Controlled Medical Record Sharing

Medical information is personal and sensitive.

ShebaMed is designed around the principle that patients should decide who can access their records.

**Access Control Features:**

- Patient approval before professional access
- Time-limited access permissions
- Selective record sharing
- Separate Doctor and Pharmacy roles
- Permission revocation
- Server-side authorization
- Access and activity logging

A patient's mobile number alone does not authorize someone to access their medical information.

Doctors and pharmacies must follow the application's consent-based workflow.

**Your Medical History. Your Permission.**

---

### 📅 7. Connected Medical Timeline

Medical history becomes more useful when information from different visits stays connected.

ShebaMed organizes supported records into a chronological history.

The timeline can include:

- Uploaded medical reports
- Previous prescriptions
- Diagnostic test information
- Doctor outpatient encounters
- Clinical notes
- Pharmacy assistance encounters
- Medicine dispensing records
- Follow-up information

The system distinguishes between records created by patients, doctors, and pharmacies.

This helps users understand where the information came from.

---

## 🔄 How ShebaMed Works

### Step 1 - Create an Account

A patient registers using a mobile number and password.

The patient receives a ShebaMed account and can begin building a medical history.

### Step 2 - Upload Medical Records

The patient uploads reports, prescriptions, or other supported medical documents.
<img width="1535" height="863" alt="image" src="https://github.com/user-attachments/assets/6b74f789-59a1-4efb-849c-a8361941a780" />



### Step 3 - Extract and Organize Information

The document-processing system extracts available information and helps organize the patient's history.

### Step 4 - Ask the AI Assistant

The patient can search for previous medical information.

The AI retrieves relevant records and provides source-linked answers where supporting information is available.

<img width="800" height="700" alt="image" src="https://github.com/user-attachments/assets/d3b67b10-ff48-41f2-b0c6-8e5f6d683e27" />
<img width="800" height="747" alt="image" src="https://github.com/user-attachments/assets/6d9cc24d-3148-4a25-92aa-cc85b3ca4362" />





### Step 5 - Share Medical History

The patient can approve a doctor or pharmacy access request.
<img width="1508" height="767" alt="image" src="https://github.com/user-attachments/assets/3d4b8dcf-5883-4009-af17-1a2197255c8c" />


### Step 6 - Healthcare Professional Reviews Records

The authorized professional reviews relevant medical history and original documents.

### Step 7 - Update the Medical Timeline

Doctor encounters and permitted pharmacy records can be added to the patient's history.

### Step 8 - Patient Remains in Control

Patients can manage and revoke access permissions.

---

## 🆚 What Makes ShebaMed Different?

Many healthcare platforms focus primarily on one service, such as online doctor appointments, medical document storage, or AI chat.

**ShebaMed focuses on connecting medical history across patients, doctors, and pharmacies.**

Our main differentiation is the combination of patient-controlled records, source-linked AI retrieval, and connected healthcare documentation.

| Healthcare Challenge | ShebaMed's Approach |
|---|---|
| Medical reports scattered across different places | Organized digital medical history |
| Difficulty remembering previous tests | AI-assisted medical-history search |
| Repeatedly sharing old reports | Patient-authorized record access |
| AI answers without visible evidence | Source-linked answers |
| Doctors spending time searching records | AI-supported historical information retrieval |
| Pharmacy visits disconnected from medical records | Pharmacy encounter and dispensing records |
| Unclear record ownership | Patient-controlled permissions |
| Different providers maintaining disconnected histories | Connected longitudinal medical timeline |

### Our Core Innovation

**ShebaMed AI Medical Memory**

A patient-controlled medical history that can be searched through AI and securely shared with authorized healthcare professionals.

**ShebaMed Pharmacy Connect**

A workflow that connects local pharmacy assistance and medicine dispensing information with the patient's broader medical history.

**Connected Care Continuity**

Information from different healthcare interactions can remain available for future review instead of disappearing after individual visits.

These features represent ShebaMed's intended product advantages. We do not claim that no other platform offers similar capabilities or that better clinical outcomes have already been proven.

---

## 🛠️ Technology Stack

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Responsive web interface

### Backend

- Next.js API Routes
- Node.js
- Server-side authentication
- Role-based access control

### Database & Storage

- MongoDB Atlas
- MongoDB GridFS
- Medical document metadata
- Patient access grants
- Medical encounters
- Audit records

### Artificial Intelligence

- Groq API
- Groq-hosted language models
- Retrieval-Augmented Generation (RAG)
- OCR-based text extraction
- Tesseract.js
- Document-aware medical-history retrieval
- Source-linked AI responses

### Security

- Password hashing
- Server-side sessions
- Role-based authorization
- Patient consent management
- Time-limited sharing
- Access revocation
- Audit logging

### Development & Testing

- Git and GitHub
- VS Code
- Vitest
- Playwright
- ESLint
- TypeScript
- Vercel

---

## 🧬 AI Architecture

### Medical Document Processing

```text
Medical Report / Prescription
             |
             v
      Document Upload
             |
             v
     Secure File Storage
             |
             v
      OCR Text Extraction
             |
             v
   Medical Data Organization
             |
             v
      Searchable History
             |
             v
      Patient Timeline
```

### AI Medical Memory

```text
Patient / Doctor / Pharmacy Question
                  |
                  v
         Permission Validation
                  |
                  v
       Authorized Medical Records
                  |
                  v
          Relevant Retrieval
                  |
                  v
           RAG Context
                  |
                  v
        Groq AI Language Model
                  |
                  v
       Source-Linked AI Answer
```

### Connected Healthcare Workflow

```text
                  PATIENT
                     |
             Medical History
                     |
             Patient Permission
                     |
          +----------+----------+
          |                     |
          v                     v
        DOCTOR               PHARMACY
          |                     |
   History Review        History Review
          |                     |
    AI Assistance         AI Assistance
          |                     |
  Clinical Encounter     Pharmacy Encounter
          |                     |
          |               Medicine Dispensing
          |                     |
          +----------+----------+
                     |
                     v
           PATIENT MEDICAL TIMELINE
```

---

## 🌱 Expected Impact

ShebaMed aims to improve access to organized medical information and support better continuity between healthcare visits.

### For Patients

- Easier access to previous medical records
- Less time spent searching for old reports
- Better organization of medical history
- Greater control over sharing personal information
- More complete documentation across visits

### For Doctors

- Faster retrieval of previous medical information
- Access to original supporting documents
- Better context before and during consultations
- Structured encounter documentation
- Less dependence on patient memory alone

### For Pharmacies

- Patient-authorized history review
- Improved record continuity
- Better documentation of permitted assistance
- Medicine dispensing history
- Clearer referral context when professional care is needed

### How We Plan to Measure Impact

- Medical record retrieval time
- Accuracy of source-linked AI answers
- Time required to review patient history
- Access permission enforcement
- Pharmacy and doctor record completion
- User satisfaction
- Record continuity across healthcare interactions

These are proposed evaluation measures. Clinical and operational benefits require further testing.

---

## 🚀 Future Roadmap

### 1. Affordable Telemedicine Through Local Pharmacies

**One of our most important future goals is to make access to registered doctors more affordable and convenient, especially for rural and low-income communities.**

In many rural areas, patients may need to travel long distances to consult a doctor.

This can involve:

- Transportation expenses
- Lost working hours
- Additional travel time
- Difficulty finding an available doctor

We plan to extend ShebaMed with a pharmacy-assisted telemedicine service.

### How It Would Work

1. A patient visits a participating local pharmacy.
2. Pharmacy staff help the patient request a consultation.
3. The patient selects an available, verified registered doctor.
4. The patient sees the consultation fee before confirming.
5. A secure audio or video consultation takes place.
6. The doctor reviews relevant medical history with patient consent.
7. The doctor provides professional advice and, where appropriate, a valid digital prescription.
8. Consultation notes become part of the patient's ShebaMed Medical History.
9. Any medicines actually supplied by the pharmacy are recorded separately.

### Why This Matters

A patient should not always have to travel a long distance just to seek a doctor's opinion when remote consultation is clinically appropriate.

By connecting local pharmacies with registered doctors, ShebaMed aims to reduce avoidable travel costs and improve access to professional healthcare advice.

**Our Vision: Affordable Healthcare Access Without Losing Medical History.**

Remote consultations will not replace necessary physical examinations or emergency medical care.

The service will require professional verification, patient consent, appropriate clinical oversight, secure communication, transparent pricing, and compliance with applicable regulations before launch.

**Status: Future Development — Not Currently Implemented.**

---

### 2. Doctor Referral & Consultation Management

We plan to introduce a connected referral workflow where pharmacies can help patients contact verified doctors.

Planned capabilities:

- Doctor availability
- Consultation requests
- Referral records
- Appointment tracking
- Consultation history
- Follow-up management

---

### 3. Digital Prescription Integration

We plan to develop structured digital prescriptions issued by appropriately registered medical professionals.

Features may include:

- Doctor-authored prescriptions
- Structured medicine information
- Prescription authentication
- Patient prescription history
- Pharmacy dispensing links
- Follow-up documentation

Prescription creation and medicine dispensing will remain separate activities.

---

### 4. Improved Medication History

Future improvements may include:

- Verified medicine ingredient matching
- Generic and brand normalization
- Better identification of previously recorded medicines
- Duplicate-entry detection
- Structured medication history

Medication information will support qualified professional review rather than automated prescribing.

---

### 5. Rural and Low-Bandwidth Accessibility

We aim to improve usability for communities with limited internet access.

Possible improvements include:

- Lightweight interfaces
- Better mobile optimization
- Bangla-first healthcare workflows
- Low-bandwidth access
- Audio consultation options
- Simplified pharmacy-assisted access

---

### 6. Healthcare Interoperability

In the long term, we aim to explore secure and standards-based information exchange with authorized healthcare organizations.

Potential areas include:

- Diagnostic centers
- Hospitals
- Clinics
- Authorized pharmacies
- National digital healthcare initiatives

Any such integration will require appropriate authorization, privacy safeguards, and technical validation.

---

## 🔒 Responsible AI, Privacy & Safety

Healthcare data is highly sensitive.

ShebaMed is designed to prioritize patient permission and transparent information access.

### Our Principles

**Patient Control**

Patients decide which professionals may access their records.

**Source Transparency**

AI-generated medical-history answers should provide available source references.

**Professional Responsibility**

Medical decisions remain the responsibility of appropriately qualified healthcare professionals.

**Limited Access**

Doctors and pharmacies receive access only within approved permissions.

**Record Accountability**

Clinical encounters, pharmacy assistance, and medicine dispensing should be clearly distinguished.

**AI Safety**

The AI assistant is not intended to independently diagnose diseases, prescribe medication, or replace medical professionals.

### Important Limitations

ShebaMed is currently a controlled MVP intended for development, demonstration, and testing.

- Use synthetic or fictional medical records.
- Phone-number ownership is not currently verified through OTP.
- OCR may misread unclear or handwritten documents.
- AI responses may contain errors or omit information.
- Administrator review is not equivalent to independent government credential verification.
- Production OCR requires an operational background-processing setup.
- Real-world clinical use requires further security, privacy, operational, and legal validation.

**ShebaMed is not yet clinically validated for real patient care.**

---

## 🌍 Social Impact & SDG Alignment

### SDG 3 — Good Health and Well-Being

ShebaMed aims to support healthcare access and continuity through better medical information management.

### SDG 9 — Industry, Innovation and Infrastructure

The platform explores AI-assisted medical record management and connected digital healthcare services.

### SDG 10 — Reduced Inequalities

Our future affordable telemedicine model aims to improve access for rural and lower-income communities.

---

## 💼 Business Model — Future Opportunity

ShebaMed is designed with potential long-term sustainability in mind.

### Pharmacy Software Subscription

Participating pharmacies could use selected documentation and medical-history management features through affordable subscription plans.

### Telemedicine Platform Services

When introduced and legally permitted, optional remote consultations could use transparent service fees.

### Healthcare Organization Solutions

Clinics and other healthcare organizations could potentially use authorized medical-history management tools.

### Patient Access

Core personal medical-history features could remain accessible through a free or low-cost model, subject to operational sustainability.

**Our business vision is to make connected medical information useful and affordable—not to profit from selling identifiable patient medical records.**

These are proposed business models, not currently validated revenue streams.

---

## 📦 Installation & Local Development

### Requirements

- Node.js
- npm
- MongoDB Atlas
- Groq API Key
- Git

### Clone the Repository

```bash
git clone https://github.com/mamun657/ShebaMed.git

cd ShebaMed
```

### Install Dependencies

```bash
npm ci
```

### Configure Environment Variables

Create a `.env.local` file using `.env.example`.

```env
MONGODB_URI=<your-mongodb-connection-string>
MONGODB_DB_NAME=<your-database-name>

GROQ_API_KEY=<your-groq-api-key>
GROQ_TEXT_MODEL=<supported-groq-model-id>

AUTH_SECRET=<your-strong-random-secret>

NEXT_PUBLIC_APP_URL=http://localhost:3000

OCR_LANGUAGES=eng
```

Replace all placeholders with your own private configuration.

Never commit `.env.local` or expose API keys, database credentials, or authentication secrets.

### Database Setup

```bash
npm run db:setup
```

### Start Development

```bash
npm run dev
```

If the application uses a separately managed OCR worker, start the worker using the command documented in the repository's `package.json` or development instructions.

Open:

http://localhost:3000

### Testing

Run the available scripts configured in the repository, such as:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Check `package.json` for the exact available commands.

Use a disposable test database for integration tests.

---

## 🌐 Deployment

The ShebaMed frontend and Next.js server application are deployed using Vercel.

**Live Website:**

https://shebamed.vercel.app

**Source Code:**

https://github.com/mamun657/ShebaMed

Deployment requires production environment configuration, database connectivity, secure authentication, and separately supported processing infrastructure for background tasks.

A successful production build does not automatically confirm that every feature is operational.

---

## 🧪 Project Status

**Current Stage: Controlled MVP**

The project includes working implementations of patient medical-history management, doctor and pharmacy workspaces, patient-controlled sharing, and AI-assisted retrieval workflows.

Some features depend on the availability and correct configuration of external services, including MongoDB Atlas, Groq, and OCR workers.

Production readiness, medical accuracy, independent security assessment, and real-world clinical validation remain future work.

---

## 🎥 Demo Video

A project demonstration will be linked here when the video is available.

The demo is intended to showcase:

- The real ShebaMed website
- Patient medical record uploads
- OCR-supported medical document processing
- Patient Medical Timeline
- Doctor access permissions
- AI Clinical Memory
- Pharmacy Workspace
- Medicine dispensing records
- Source-linked RAG responses

---

## 📚 References

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Groq Documentation](https://console.groq.com/docs/overview)
- [BMDC — Telemedicine Practice Guidelines](https://www.bmdc.org.bd/docs/BMDC_Telemedicine_Guidelines_July2020.pdf)
- [Bangladesh DGHS — Shareable Health Record](https://en.info.shr.dghs.gov.bd/about/)

These references support technical development and future healthcare interoperability and telemedicine planning. They do not imply official endorsement or integration.

---

## 🤝 Contributions & Feedback

Suggestions, technical feedback, and responsible bug reports are welcome.

**GitHub:** https://github.com/mamun657/ShebaMed

Please do not include real patient information, passwords, tokens, or other sensitive data when reporting issues.

No open-source license is specified here. Check the repository's actual license terms before reusing its source code or assets.

---

## ❤️ Our Vision

We believe every patient deserves a medical history that stays organized and useful throughout their healthcare journey.

A medical report should not become meaningless after one hospital visit.

A doctor should not have to start from zero every time.

And a pharmacy visit should not become another disconnected piece of information.

Our vision is to connect these experiences while keeping patients in control.

**ShebaMed is more than a place to store reports. It is a step toward connected, accessible, and patient-centered healthcare.**

---

### 🩺 ShebaMed - Your Health, Connected.

**Because every medical history deserves to be remembered.**

**🌐 Website:** https://shebamed.vercel.app

**💻 GitHub:** https://github.com/mamun657/ShebaMed
