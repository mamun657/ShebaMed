"use client";
import { Fragment, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { Localize, LocaleSwitcher } from "@/lib/i18n";
export async function api(path: string, method = "GET", body?: unknown) {
  const response = await fetch("/api/" + path, {
    method,
    headers:
      body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}
export function AuthForm({
  mode,
  initialRole = "PATIENT",
}: {
  mode: "login" | "register" | "recover";
  initialRole?: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [codes, setCodes] = useState<string[]>([]),
    [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api(
        "auth/" + (mode === "recover" ? "recover" : mode),
        "POST",
        { ...data, role, consent: data.consent === "on" },
      );
      if (mode === "register") setCodes(result.recoveryCodes);
      else if (mode === "recover") setDone(true);
      else router.push("/" + result.user.role.toLowerCase() + "/dashboard");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Localize>
    <div
      className={`auth-layout${mode === "register" ? " auth-layout-register" : mode === "login" ? " auth-layout-login" : ""}`}
    >
      <aside
        className={`auth-story${mode === "register" ? " auth-story-register" : mode === "login" ? " auth-story-login" : ""}`}
      >
        <Brand />
        {mode === "register" ? (
          <>
            <div className="auth-story-copy">
              <h1>
                Your health. <em>Connected.</em>
              </h1>
              <p>
                Your medical history, all in one place.
              </p>
              <div className="auth-story-art">
                <Image
                  className="auth-story-illustration"
                  src="/images/register.png"
                  alt="A patient and clinician sharing health information at a pharmacy"
                  width={1448}
                  height={1086}
                  sizes="(max-width: 650px) 85vw, (max-width: 900px) 56vh, 31vw"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>
            <div className="auth-story-footer">
              <div className="auth-quote auth-quote-register">
                <ShieldCheck size={20} />
                <strong>Your records. Your control.</strong>
              </div>
              <small>Controlled MVP · Synthetic medical records only</small>
            </div>
          </>
        ) : mode === "login" ? (
          <>
            <div className="auth-story-copy">
              <span className="eyebrow">YOUR HEALTH. YOUR STORY.</span>
              <h1>
                A clearer history.
                <br />
                <em>A better conversation.</em>
              </h1>
              <p>
                Keep your medical records together, understand your past, and
                choose who you share it with.
              </p>
              <div className="auth-story-art">
                <Image
                  className="auth-story-illustration"
                  src="/images/register.png"
                  alt="A patient and clinician sharing health information at a pharmacy"
                  width={1448}
                  height={1086}
                  sizes="(max-width: 650px) 85vw, (max-width: 900px) 36vw, 31vw"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>
            <div className="auth-story-footer auth-story-footer-login">
              <div className="auth-quote auth-quote-login">
                <ShieldCheck size={30} />
                <div>
                  <strong>Built around your permission</strong>
                  <p>
                    Doctors request access. You decide what to share and for
                    how long.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="eyebrow">YOUR HEALTH. YOUR STORY.</span>
              <h1>
                A clearer history.
                <br />
                <em>A better conversation.</em>
              </h1>
              <p>
                Keep your medical records together, understand your past, and
                choose who you share it with.
              </p>
              <div className="auth-quote">
                <ShieldCheck size={30} />
                <div>
                  <strong>Built around your permission</strong>
                  <p>
                    Doctors request access. You decide what to share and for
                    how long.
                  </p>
                </div>
              </div>
            </div>
            <small>Controlled MVP · Synthetic medical records only</small>
          </>
        )}
      </aside>
      <main
        className={`auth-main${mode === "register" ? " auth-main-register" : mode === "login" ? " auth-main-login" : ""}`}
      >
        <div className="auth-topbar">
          <Link className="back-link" href="/">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <LocaleSwitcher />
        </div>
        <div
          className={`auth-box${mode === "register" ? " auth-box-register" : mode === "login" ? " auth-box-login" : ""}`}
        >
          {codes.length ? (
            <>
              <span className="section-kicker">ONE IMPORTANT STEP</span>
              <h2>Save your recovery codes.</h2>
              <p>
                These are shown only once. Each code can reset your password one
                time. Without a code or your password, we cannot recover your
                account.
              </p>
              <div className="recovery-codes">
                {codes.map((c) => (
                  <code key={c}>{c}</code>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const a = document.createElement("a"),
                    url = URL.createObjectURL(
                      new Blob([codes.join("\n")], { type: "text/plain" }),
                    );
                  a.href = url;
                  a.download = "shebamed-recovery-codes.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download size={17} /> Download codes
              </Button>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={(e) => setDone(e.target.checked)}
                />{" "}
                I have saved my recovery codes securely.
              </label>
              <Button
                disabled={!done}
                onClick={() =>
                  router.push("/" + role.toLowerCase() + "/dashboard")
                }
              >
                Go to my dashboard <ArrowRight size={17} />
              </Button>
            </>
          ) : done ? (
            <>
              <h2>Password reset.</h2>
              <p>
                Your existing sessions have been signed out. Sign in with your
                new password.
              </p>
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          ) : (
            <>
              <span className="section-kicker">
                {mode === "login" ? "WELCOME BACK" : "WELCOME TO SHEBAMED"}
              </span>
              <h2>
                {mode === "login"
                  ? "Your history is here."
                  : mode === "register"
                    ? "Start your health story."
                    : "Recover your account."}
              </h2>
              <p>
                {mode === "login"
                  ? "Sign in to your personal health workspace."
                  : mode === "register"
                    ? "One mobile number. One account. Your records in your hands."
                    : "Use an unused recovery code saved during registration. No SMS or email required."}
              </p>
              {mode === "register" && (
                <div className="role-tabs">
                  <button
                    type="button"
                    className={role === "PATIENT" ? "active" : ""}
                    aria-pressed={role === "PATIENT"}
                    onClick={() => setRole("PATIENT")}
                  >
                    I’m a patient
                  </button>
                  <button
                    type="button"
                    className={role === "DOCTOR" ? "active" : ""}
                    aria-pressed={role === "DOCTOR"}
                    onClick={() => setRole("DOCTOR")}
                  >
                    I’m a doctor
                  </button>
                  <button
                    type="button"
                    className={role === "PHARMACY" ? "active" : ""}
                    aria-pressed={role === "PHARMACY"}
                    onClick={() => setRole("PHARMACY")}
                  >
                    I’m a pharmacy
                  </button>
                </div>
              )}
              <form
                className={mode === "register" ? "auth-form-register" : undefined}
                onSubmit={submit}
              >
                {mode === "register" && (
                  <label>
                    Full name
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Your full name"
                    />
                  </label>
                )}
                <label>
                  Mobile number
                  <input
                    name="phone"
                    required
                    type="tel"
                    autoComplete="tel"
                    placeholder="01712 345678"
                  />
                  <small>
                    Bangladeshi mobile number · Ownership is unverified
                  </small>
                </label>
                {mode === "recover" && (
                  <label>
                    One-time recovery code
                    <input
                      name="code"
                      required
                      autoComplete="off"
                      placeholder="Enter one unused recovery code"
                    />
                  </label>
                )}
                <label>
                  {mode === "recover" ? "New password" : "Password"}
                  <div className="password-input">
                    <input
                      name="password"
                      required
                      type={show ? "text" : "password"}
                      minLength={mode === "login" ? 1 : 12}
                      maxLength={128}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      placeholder={
                        mode === "login"
                          ? "Enter your password"
                          : "At least 12 characters"
                      }
                    />
                    <button
                      aria-label={show ? "Hide password" : "Show password"}
                      type="button"
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                {mode === "register" && (
                  <>
                    <label>
                      Confirm password
                      <input
                        name="confirmPassword"
                        required
                        type="password"
                        autoComplete="new-password"
                      />
                    </label>
                    {role === "DOCTOR" && (
                      <Fragment key="DOCTOR">
                        <label>
                          Professional registration number
                          <input name="registrationNumber" required />
                        </label>
                        <label>
                          Specialization
                          <input name="specialization" required />
                        </label>
                        <label>
                          Workplace
                          <input name="workplace" required />
                        </label>
                        <label>
                          Credential details
                          <textarea
                            name="credentialDetails"
                            required
                            placeholder="Qualifications and details for manual professional review"
                          />
                        </label>
                        <p className="notice">
                          Your doctor profile needs admin review before you can
                          request patient access.
                        </p>
                      </Fragment>
                    )}
                    {role === "PHARMACY" && (
                      <Fragment key="PHARMACY">
                        <label>
                          Pharmacy name
                          <input name="pharmacyName" required maxLength={150} />
                        </label>
                        <label>
                          Pharmacy license / registration number
                          <input
                            name="registrationNumber"
                            required
                            maxLength={100}
                          />
                        </label>
                        <label>
                          Pharmacy address
                          <input name="address" required maxLength={300} />
                        </label>
                        <label>
                          Registration details for manual review
                          <textarea
                            name="credentialDetails"
                            required
                            maxLength={2000}
                            placeholder="License authority and other verification details"
                          />
                        </label>
                        <p className="notice">
                          Pharmacy access is disabled until an administrator
                          reviews and approves the registration.
                        </p>
                      </Fragment>
                    )}
                    <label className="checkbox">
                      <input name="consent" required type="checkbox" />
                      <span>
                        I agree to the <Link href="/terms">terms</Link> and{" "}
                        <Link href="/privacy">privacy policy</Link>. I will use
                        fictional records for this MVP.
                      </span>
                    </label>
                  </>
                )}
                {error && (
                  <div role="alert" className="error">
                    {error}
                  </div>
                )}
                <Button disabled={busy} className="full-width">
                  {busy
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign in"
                      : mode === "register"
                        ? "Create account"
                        : "Reset password"}{" "}
                  <ArrowRight size={17} />
                </Button>
              </form>
              {mode === "login" ? (
                <>
                  <Link className="recover-link" href="/recover-account">
                    Forgot your password?
                  </Link>
                  <p className="auth-switch">
                    New here? <Link href="/register">Create an account</Link>
                  </p>
                </>
              ) : (
                <p className="auth-switch">
                  Already have an account? <Link href="/login">Sign in</Link>
                </p>
              )}
              {mode !== "register" && (
                <div className="auth-bottom">
                  <ShieldCheck size={15} /> No OTP. No email. Save your recovery
                  codes.
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
    </Localize>
  );
}
