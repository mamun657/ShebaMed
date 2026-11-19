"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  FolderHeart,
  FileText,
  Clock3,
  LockKeyhole,
  UploadCloud,
  Check,
  Plus,
  HeartPulse,
  Menu,
  X,
} from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { Localize, LocaleSwitcher, useI18n } from "@/lib/i18n";
export function Landing() {
  const { locale } = useI18n();
  const bn = locale === "bn";
  const [menu, setMenu] = useState(false);

  const navItems = bn
    ? [
        ["আমাদের সম্পর্কে", "about"],
        ["কীভাবে কাজ করে", "how-it-works"],
        ["ফিচার", "features"],
        ["ডাক্তারের জন্য", "for-doctors"],
        ["ফার্মেসির জন্য", "for-pharmacies"],
        ["নিরাপত্তা", "security"],
      ]
    : [
        ["About", "about"],
        ["How it works", "how-it-works"],
        ["Features", "features"],
        ["For doctors", "for-doctors"],
        ["For pharmacies", "for-pharmacies"],
        ["Security", "security"],
      ];

  return (
    <Localize>
    <>
      <div className="landing-top">
        <nav className="public-nav">
          <Brand />
          <div className={"nav-links " + (menu ? "open" : "")}>
            {navItems.map(([name, id]) => (
              <a key={id} href={"#" + id} onClick={() => setMenu(false)}>
                {name}
              </a>
            ))}
          </div>
          <div className="nav-actions">
            <LocaleSwitcher />
            <Link href="/login" className="signin">
              {bn ? "সাইন ইন" : "Sign in"}
            </Link>
            <Button asChild size="small">
              <Link href="/register">
                {bn ? "শুরু করুন" : "Get started"} <ArrowUpRight size={15} />
              </Link>
            </Button>
            <button
              aria-label="Toggle navigation"
              className="mobile-toggle"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
        <main className="landing-hero">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="landing-hero-copy"
          >
            <div className="connected-badge">
              <span />
              {bn ? "সংযুক্ত স্বাস্থ্যসেবা" : "Connected Healthcare"}
            </div>
            <h1>
              {bn ? "আপনার মেডিকেল রেকর্ড।" : "Your Medical Records."}
              <br />
              {bn ? "আপনার ডাক্তার।" : "Your Doctor."}
              <br />
              <span className="hero-highlight">
                {bn ? "একসাথে একটি গল্প।" : "One Connected Story."}
              </span>
            </h1>
            <p>
              {bn
                ? "আপনার মেডিকেল রেকর্ড এক জায়গায় রাখুন এবং নিরাপদে, আপনার শর্তে ডাক্তারের সঙ্গে শেয়ার করুন।"
                : "Keep your medical reports organized, access your health history anytime, and securely share records with your doctor—with your permission."}
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/register">
                  {bn ? "বিনামূল্যে শুরু করুন" : "Get started free"}
                  <ArrowUpRight size={18} />
                </Link>
              </Button>
              <a className="hero-secondary" href="#how-it-works">
                {bn ? "কীভাবে কাজ করে দেখুন" : "See How It Works"}
              </a>
            </div>
            <div className="landing-benefits">
              <span>
                <ShieldCheck size={17} />{" "}
                {bn ? "গোপনীয়তা সবার আগে" : "Privacy First"}
              </span>
              <span>
                <Check size={17} /> {bn ? "নিরাপদে শেয়ার" : "Secure Sharing"}
              </span>
              <span>
                <FolderHeart size={17} />{" "}
                {bn ? "সব রেকর্ড এক জায়গায়" : "All Your Records in One Place"}
              </span>
            </div>
          </motion.div>
          <motion.div
            className="landing-hero-art"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15 }}
          >
            <Image
              src="/images/img1.png"
              alt="Doctor and patient connected through ShebaMed medical records"
              width={1672}
              height={941}
              priority
              sizes="(max-width: 768px) 100vw, 58vw"
              className="landing-illustration"
            />
          </motion.div>
        </main>
      </div>
      <section className="landing-ribbon" aria-label="Product benefits">
        <svg
          className="landing-ribbon-shape"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 0 C180 30 330 47 520 43 C710 40 805 8 980 12 C1160 17 1300 43 1440 54 L1440 112 C1300 103 1190 88 1045 77 C875 64 795 65 625 82 C430 102 280 108 0 64 Z"
            fill="#009e99"
          />
        </svg>
        <div
          className="landing-ribbon-content"
          aria-label="Private • Secure • Connected • Organized • Accessible • Patient-Controlled"
        >
          {[
            [ShieldCheck, "Private"],
            [LockKeyhole, "Secure"],
            [HeartPulse, "Connected"],
            [FolderHeart, "Organized"],
            [Check, "Accessible"],
            [ShieldCheck, "Patient-Controlled"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <span className="landing-ribbon-item" key={String(label)}>
                <I size={19} aria-hidden="true" />
                {String(label)}
              </span>
            );
          })}
        </div>
      </section>
      <section id="about" className="section mission-section">
        <div className="mission-copy">
          <span className="section-kicker">
            OUR PURPOSE, YOUR HEALTH
          </span>
          <h2>
            One Mission. Better Connected{" "}
            <span className="mission-highlight">Healthcare.</span>
          </h2>
          <p>
            Making medical histories easier to organize, understand, and
            securely share—so patients and doctors can make better-informed
            decisions together.
          </p>
        </div>
        <div className="mission-visual">
          <Image
            src="/images/img2.png"
            alt="Doctor and patient reviewing connected medical records"
            width={1402}
            height={1122}
            sizes="(max-width: 650px) 90vw, (max-width: 900px) 44vw, (max-width: 1150px) 42vw, 28vw"
            className="mission-illustration"
          />
        </div>
        <div className="mission-features">
          <div className="mission-feature">
            <span className="mission-feature-icon">
              <FolderHeart size={22} />
            </span>
            <div>
              <h3>One Place</h3>
              <p>All your medical records in one place.</p>
            </div>
          </div>
          <div className="mission-feature">
            <span className="mission-feature-icon">
              <ShieldCheck size={22} />
            </span>
            <div>
              <h3>Your Control</h3>
              <p>Permission-based doctor access.</p>
            </div>
          </div>
          <div className="mission-feature">
            <span className="mission-feature-icon">
              <HeartPulse size={22} />
            </span>
            <div>
              <h3>AI Assistance</h3>
              <p>Source-linked answers from your health records.</p>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="section feature-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">BUILT AROUND YOU</span>
            <h2>
              From scattered records
              <br />
              to connected care.
            </h2>
          </div>
          <Link className="arrow-link" href="/features">
            Explore the platform <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="feature-grid">
          {[
            [
              UploadCloud,
              "01",
              "A home for every report",
              "Upload PDFs and images. Keep original reports alongside extracted information.",
            ],
            [
              Clock3,
              "02",
              "Your history, in order",
              "See your records organized by report date, not the date you uploaded them.",
            ],
            [
              HeartPulse,
              "03",
              "Answers with evidence",
              "Ask about previous tests in English or Bangla. Follow every answer back to its source.",
            ],
            [
              ShieldCheck,
              "04",
              "Permission, on your terms",
              "Share selected records for 30 or 60 minutes. Revoke access whenever you choose.",
            ],
          ].map(([Icon, n, title, desc]) => {
            const I = Icon as typeof FileText;
            return (
              <article className="feature-card" key={String(n)}>
                <div className="feature-top">
                  <span className="round-icon">
                    <I size={24} />
                  </span>
                  <span>{String(n)}</span>
                </div>
                <h3>{String(title)}</h3>
                <p>{String(desc)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section id="how-it-works" className="how-section">
        <div className="section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">SIMPLE FROM THE START</span>
              <h2>
                A little organization.
                <br />A lot more clarity.
              </h2>
            </div>
            <p>
              Start with your mobile number and a password.
              <br />
              No SMS, no email verification.
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Create your account",
                "Get your permanent ShebaMed ID and save your recovery codes.",
              ],
              [
                "02",
                "Bring your history",
                "Upload reports, review the extracted details, and build your timeline.",
              ],
              [
                "03",
                "Connect with your doctor",
                "Approve a doctor’s request and choose exactly what they can access.",
              ],
            ].map(([n, t, p]) => (
              <div key={n}>
                <span>
                  {n}
                  <ArrowRight size={20} />
                </span>
                <h3>{t}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="for-doctors" className="section doctor-section">
        <div className="doctor-visual">
          <Image
            src="/images/record.png"
            alt="Doctor reviewing a patient's medical history"
            width={1448}
            height={1086}
            sizes="(max-width: 650px) 100vw, 48vw"
          />
        </div>
        <div>
          <span className="section-kicker">FOR THE PEOPLE WHO CARE</span>
          <h2>
            Start the visit
            <br />
            with the bigger picture.
          </h2>
          <p>
            Review patient-authorized reports, look up historical findings, and
            add outpatient encounter notes with separate permission.
          </p>
          <ul className="check-list">
            <li>
              <Check /> Patient-approved, time-limited access
            </li>
            <li>
              <Check /> Source-linked medical history search
            </li>
            <li>
              <Check /> Professional profiles reviewed by an admin
            </li>
          </ul>
          <Button asChild>
            <Link href="/register/doctor">
              Join as a doctor <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
      </section>
      <section id="for-pharmacies" className="section">
        <div>
          <span className="section-kicker">FOR PHARMACY TEAMS</span>
          <h2>Support patients with permission.</h2>
          <p>
            Review patient-authorized records, document basic pharmacy
            assistance, and record medicines supplied. Pharmacy accounts require
            administrator verification.
          </p>
          <Button asChild>
            <Link href="/register/pharmacy">
              Join as a pharmacy <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
      </section>
      <section id="security" className="section security-panel">
        <LockKeyhole size={45} />
        <div>
          <span className="section-kicker">CONTROL IS PART OF CARE</span>
          <h2>Your health information belongs to you.</h2>
          <p>
            Private document storage. Separate doctor permissions. Access logs.
            No sharing through a phone number alone.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/security">
            Our approach <ArrowUpRight size={17} />
          </Link>
        </Button>
      </section>
      <section className="section faq">
        <div>
          <span className="section-kicker">A FEW THINGS TO KNOW</span>
          <h2>Questions, answered.</h2>
        </div>
        <div>
          {[
            [
              "Do I need an OTP or email?",
              "No. This controlled MVP uses a mobile number and password. Phone ownership is unverified. Save your one-time recovery codes to recover your account.",
            ],
            [
              "Who can see my medical records?",
              "You, and an admin-reviewed doctor only when you approve their requested access. Admins cannot browse patient medical records.",
            ],
            [
              "Does the AI provide a diagnosis?",
              "No. It helps retrieve and explain documented history with source references. It does not replace your clinician or make treatment decisions.",
            ],
            [
              "Is this ready for real patient care?",
              "This version is for controlled testing with synthetic records. Clinical, security, operational and legal validation are needed before real patient deployment.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="final-cta">
        <span className="section-kicker">YOUR NEXT VISIT STARTS HERE</span>
        <h2>
          Give your health history
          <br />a place to come together.
        </h2>
        <Button asChild>
          <Link href="/register">
            Create your free account <ArrowUpRight size={18} />
          </Link>
        </Button>
        <p>Controlled MVP · Use fictional records only</p>
      </section>
      <footer className="footer">
        <div className="footer-brand">
          <Brand />
          <span>Your medical history, connected<br />and in your control.</span>
        </div>
        <div className="footer-links">
          <div>
            <strong>EXPLORE</strong>
            <Link href="#about">About</Link>
            <Link href="#how-it-works">How it works</Link>
            <Link href="#features">Features</Link>
            <Link href="#for-doctors">For doctors</Link>
            <Link href="#for-pharmacies">For pharmacies</Link>
          </div>
          <div>
            <strong>GET STARTED</strong>
            <Link href="/register">Create an account</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/register">Patient registration</Link>
            <Link href="/register/doctor">Doctor registration</Link>
            <Link href="/register/pharmacy">Pharmacy registration</Link>
          </div>
          <div>
            <strong>TRUST &amp; SUPPORT</strong>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/security">Security</Link>
            <em>Your records. Your permission.</em>
          </div>
        </div>
        <div className="footer-bottom">
          <small>© {new Date().getFullYear()} ShebaMed. All rights reserved.</small>
          <strong>YOUR HEALTH. CONNECTED.</strong>
        </div>
      </footer>
    </>
    </Localize>
  );
}
