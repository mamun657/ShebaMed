"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderHeart,
  UploadCloud,
  Clock3,
  MessageSquare,
  ShieldCheck,
  UserRound,
  Settings,
  LogOut,
  ArrowUpRight,
  Plus,
  FileText,
  FlaskConical,
  ClipboardList,
  Copy,
  Search,
  RefreshCw,
  Users,
  Building2,
  Activity,
  Menu,
  X,
  Download,
  Eye,
  RotateCcw,
  Stethoscope,
  Pill,
} from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { api } from "./auth-form";
import { AiAssistant } from "./ai-assistant";
import {
  DocumentDetail,
  displayTitle,
  statusBadgeClass,
  verificationBadgeClass,
  recordTypeLabel,
  PharmacyRecordDetails,
  type DocumentView,
} from "./document-detail";
import {
  Localize,
  LocaleSwitcher,
  translate,
  useI18n,
} from "@/lib/i18n";
type User = {
  _id: string;
  name: string;
  role: string;
  shebamedId: string;
  phoneE164: string;
  professionalStatus: string;
  status: string;
  createdAt: string;
};
type Finding = {
  test: string;
  result: string;
  unit: string | null;
  referenceRange: string | null;
  page: number;
};
type Extraction = {
  title: string;
  category: string;
  reportDate: string | null;
  laboratory: string | null;
  hospital: string | null;
  observations: Finding[];
  medications: string[];
  diagnoses: string[];
};
type RecordItem = DocumentView & {
  patientId: string;
  authorName?: string;
  documentSource?: string;
  organizationName?: string;
  uploadedByStaffName?: string;
  extracted?: Extraction;
  confirmed?: Extraction;
};
type Grant = {
  _id: string;
  patientId: string;
  doctorName?: string;
  pharmacyName?: string;
  providerRole?: string;
  expiresAt: string;
  revokedAt: string | null;
  scope: string;
  capabilities: string[];
};
type RequestItem = {
  _id: string;
  patientId?: string;
  providerRole?: string;
  doctorName?: string;
  doctorShebamedId?: string;
  pharmacyName?: string;
  pharmacyStaffName?: string;
  pharmacyShebamedId?: string;
  status: string;
  createdAt: string;
};
type PharmacyProfile = {
  pharmacyName?: string;
  registrationNumber?: string;
  address?: string;
  credentialDetails?: string;
  dateOfBirth?: string;
  gender?: string;
};
const date = (v?: string | null) =>
  v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Date not recorded";
const timestamp = (v?: string | Date | null) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }) + " UTC"
    : "—";
const label = (value: string) => value.toLowerCase().replaceAll("_", " ");
const patientNav: [string, string, typeof FileText][] = [
  ["Overview", "dashboard", LayoutDashboard],
  ["My medical records", "records", FolderHeart],
  ["Upload document", "records/upload", UploadCloud],
  ["Medical timeline", "timeline", Clock3],
  ["AI medical assistant", "ai-assistant", MessageSquare],
  ["Doctor access", "doctor-access", ShieldCheck],
  ["Doctor-added records", "doctor-records", ClipboardList],
  ["Profile", "profile", UserRound],
  ["Settings", "settings", Settings],
];
const doctorNav: [string, string, typeof FileText][] = [
  ["Overview", "dashboard", LayoutDashboard],
  ["Access requests", "requests", ShieldCheck],
  ["Authorized patients", "patients", Users],
  ["Medical history", "history", Clock3],
  ["AI clinical memory", "ai-assistant", MessageSquare],
  ["Outpatient encounters", "encounters", ClipboardList],
  ["Upload records", "upload", UploadCloud],
  ["Profile", "profile", UserRound],
  ["Settings", "settings", Settings],
];
const pharmacyNav: [string, string, typeof FileText][] = [
  ["Overview", "dashboard", LayoutDashboard],
  ["Access Requests", "requests", ShieldCheck],
  ["Authorized Patients", "patients", Users],
  ["Medical History", "history", Clock3],
  ["AI Medical Assistant", "ai-assistant", MessageSquare],
  ["Upload Records", "upload", UploadCloud],
  ["Pharmacy Encounters", "encounters", ClipboardList],
  ["Medicine Dispensing Records", "dispensing", Pill],
  ["Profile", "profile", UserRound],
  ["Settings", "settings", Settings],
];
const adminNav: [string, string, typeof FileText][] = [
  ["Overview", "dashboard", LayoutDashboard],
  ["Users", "users", Users],
  ["Doctor registrations", "doctors", Stethoscope],
  ["Pharmacy registrations", "pharmacies", Pill],
  ["Organizations", "organizations", Building2],
  ["Audit logs", "audit", ClipboardList],
  ["System health", "system", Activity],
  ["Settings", "settings", Settings],
];
function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Localize>
    <div className="empty-state">
      <span className="round-icon">
        <FolderHeart size={30} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
    </Localize>
  );
}
export function Workspace({ role, path }: { role: string; path: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const [user, setUser] = useState<User | null>(null),
    [records, setRecords] = useState<RecordItem[]>([]),
    [workerOnline, setWorkerOnline] = useState(true),
    [requests, setRequests] = useState<RequestItem[]>([]),
    [grants, setGrants] = useState<Grant[]>([]),
    [patientId, setPatientId] = useState(
      (path[0] === "patients" && path[1]
        ? path[1]
        : searchParams.get("patientId")) || "",
    ),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [menu, setMenu] = useState(false),
    [filter, setFilter] = useState(""),
    [medicineMatch, setMedicineMatch] = useState(""),
    [category, setCategory] = useState("ALL"),
    [year, setYear] = useState("ALL"),
    [code, setCode] = useState(""),
    [openedRecord, setOpenedRecord] = useState<RecordItem | null>(null),
    [profile, setProfile] = useState<PharmacyProfile>({});
  const section = path[0] || "dashboard";
  const nav =
    role === "patient"
      ? patientNav
      : role === "doctor"
        ? doctorNav
        : role === "pharmacy"
          ? pharmacyNav
          : adminNav;
  const title =
    nav.find((n) => n[1] === path.join("/"))?.[0] ||
    (section === "records"
      ? "Medical record"
      : section === "patients"
        ? "Patient workspace"
        : "Overview");
  const target = role === "patient" ? user?._id : patientId;
  const suffix = target ? "?patientId=" + encodeURIComponent(target) : "";
  const refresh = useCallback(async () => {
    setError("");
    try {
      const me = await api("auth/me");
      if (me.user.role.toLowerCase() !== role) {
        router.replace("/" + me.user.role.toLowerCase() + "/dashboard");
        return;
      }
      setUser(me.user);
      setProfile(me.profile || {});
      if (role !== "admin") {
        const access = await api("access");
        setRequests(access.requests);
        setGrants(access.grants);
        if (role === "patient" || patientId) {
          try {
            const result = await api(
              "records?patientId=" +
                (role === "patient" ? me.user._id : patientId),
            );
            setRecords(result.records);
            setWorkerOnline(result.worker ? result.worker.online : true);
          } catch (e) {
            setRecords([]);
            setError((e as Error).message);
          }
        }
      }
    } catch (e) {
      if (
        (e as Error).message.includes("sign in") ||
        (e as Error).message.includes("session")
      )
        router.replace("/login");
      else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [role, patientId, router]);
  const [refreshKey, setRefreshKey] = useState("");
  const scope = role + ":" + (patientId || "") + ":" + path.join("/");
  if (refreshKey !== scope) {
    setRefreshKey(scope);
    void refresh();
  }
  const hasPending = records.some((r) =>
    ["UPLOADED", "QUEUED", "PROCESSING"].includes(r.status),
  );
  const pollRecords = useCallback(async () => {
    if (!target) return;
    try {
      const result = await api("records?patientId=" + target);
      setRecords(result.records);
      setWorkerOnline(result.worker ? result.worker.online : true);
    } catch {
      return;
    }
  }, [target]);
  const pollRef = useRef(pollRecords);
  useEffect(() => {
    pollRef.current = pollRecords;
  }, [pollRecords]);
  useEffect(() => {
    if (!hasPending) return;
    let delay = 3000;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (document.visibilityState === "visible") void pollRef.current();
      delay = Math.min(15000, Math.round(delay * 1.4));
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [hasPending, scope, refreshKey]);
  async function action(
    work: () => Promise<unknown>,
    message = "Saved successfully",
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      await refresh();
      setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = records.filter(
    (r) =>
      (category === "ALL" || r.category === category) &&
      (year === "ALL" || r.reportDate?.startsWith(year)) &&
      [r.title, r.filename, r.category]
        .join(" ")
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  const activeGrants = grants.filter(
    (g) => !g.revokedAt && new Date(g.expiresAt) > new Date(),
  );
  const aiPermissionMissing =
    ["doctor", "pharmacy"].includes(role) &&
    !!patientId &&
    !activeGrants.some(
      (g) =>
        g.patientId === patientId &&
        g.capabilities.includes("QUERY_MEDICAL_HISTORY"),
    );
  function recordsTable(list: RecordItem[]) {
    return list.length ? (
      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Report date</th>
              <th>Created / uploaded</th>
              <th>Category</th>
              <th>Processing</th>
              <th>Extraction</th>
              <th>Review</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r._id}>
                <td>
                  <Link
                    className="record-name"
                    href={
                      role === "patient" ? "/patient/records/" + r._id : "#"
                    }
                    onClick={
                      role === "doctor" || role === "pharmacy"
                        ? (e) => {
                            e.preventDefault();
                            setOpenedRecord(r);
                          }
                        : undefined
                    }
                  >
                    <span className="report-icon">
                      <FileText size={18} />
                    </span>
                    <span>
                      <strong className="medical-value">{displayTitle(r)}</strong>
                      <small className="medical-value">
                        {recordTypeLabel(r)}
                        {r.authorName
                          ? ` · ${r.pharmacyEncounter ? "Staff: " : ""}${r.authorName}`
                          : ""}
                        {r.organizationName
                          ? ` · ${r.documentSource === "PHARMACY_UPLOAD" ? "Pharmacy upload" : "Pharmacy"}: ${r.organizationName}`
                          : ""}
                      </small>
                    </span>
                  </Link>
                </td>
                <td data-label="Report date">{date(r.reportDate)}</td>
                <td data-label="Created / uploaded">{date(r.createdAt)}</td>
                <td data-label="Category">
                  <span className="badge">
                    {r.category === "PHARMACY_ENCOUNTER" ||
                    r.category === "MEDICINE_DISPENSING"
                      ? recordTypeLabel(r)
                      : label(r.category)}
                  </span>
                </td>
                <td data-label="Processing">
                  <span
                    className={
                      "badge " +
                      (r.category === "PHARMACY_ENCOUNTER" ||
                      r.category === "MEDICINE_DISPENSING"
                        ? "good"
                        : statusBadgeClass(r.status))
                    }
                  >
                    {r.category === "PHARMACY_ENCOUNTER" ||
                    r.category === "MEDICINE_DISPENSING"
                      ? "Recorded"
                      : label(r.status)}
                  </span>
                </td>
                <td data-label="Extraction">
                  <span className="badge">
                    {r.category === "PHARMACY_ENCOUNTER" ||
                    r.category === "MEDICINE_DISPENSING"
                      ? "No OCR required"
                      : label(r.extractionState || "pending")}
                  </span>
                </td>
                <td data-label="Review">
                  <span
                    className={
                      "badge " + verificationBadgeClass(r.verification)
                    }
                  >
                    {label(r.verification)}
                  </span>
                </td>
                <td className="actions-cell" data-label="Actions">
                  <span className="row-actions">
                    {role === "patient" && (
                      <Link
                        aria-label={translate("Open", locale) + " " + r.filename}
                        href={"/patient/records/" + r._id}
                      >
                        <Eye size={17} />
                      </Link>
                    )}
                    {r.fileId && (
                      <a
                        aria-label={
                          translate("Download", locale) + " " + r.filename
                        }
                        href={"/api/records/" + r._id + "/file"}
                      >
                        <Download size={17} />
                      </a>
                    )}
                    {role === "patient" &&
                      ["FAILED", "UPLOADED", "QUEUED"].includes(r.status) && (
                        <button
                          aria-label={
                            translate("Retry processing", locale) +
                            " " +
                            r.filename
                          }
                          title="Retry processing"
                          disabled={busy}
                          onClick={() =>
                            void action(
                              () => api("records/" + r._id + "/retry", "POST"),
                              "Queued for processing",
                            )
                          }
                        >
                          <RotateCcw size={17} />
                        </button>
                      )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <Empty
        title="Your story starts with a record"
        description="Upload a medical report to keep it organized and build your timeline."
      >
        {role === "patient" && (
          <Button asChild>
            <Link href="/patient/records/upload">
              <Plus size={16} /> Upload a report
            </Link>
          </Button>
        )}
      </Empty>
    );
  }

  function filters() {
    return (
      <div className="filters">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Search records"
            placeholder="Search your records…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {[
            "ALL",
            "LAB",
            "PRESCRIPTION",
            "CLINICAL_NOTE",
            "DIAGNOSTIC",
            "OTHER",
          ].map((v) => (
            <option key={v} value={v}>
              {v === "ALL" ? "All categories" : label(v)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="ALL">All years</option>
          {Array.from(
            new Set(
              records.flatMap((r) =>
                r.reportDate ? [r.reportDate.slice(0, 4)] : [],
              ),
            ),
          )
            .sort()
            .reverse()
            .map((y) => (
              <option key={y}>{y}</option>
            ))}
        </select>
      </div>
    );
  }
  const detail =
    path[0] === "records" && path[1] && path[1] !== "upload"
      ? records.find((r) => r._id === path[1])
      : undefined;
  return (
    <Localize>
    <div className="app-layout">
      <aside className={"sidebar " + (menu ? "visible" : "")}>
        <Brand />
        <div className="workspace-label">{role.toUpperCase()} WORKSPACE</div>
        <nav>
          {nav.map(([name, url, Icon]) => (
            <Link
              key={url}
              href={"/" + role + "/" + url}
              className={path.join("/") === url ? "active" : ""}
              onClick={() => setMenu(false)}
            >
              <Icon size={18} />
              {name}
              {["doctor-access", "requests", "patients"].includes(url) &&
                requests.some((r) => r.status === "PENDING") && (
                  <span className="nav-dot" />
                )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <ShieldCheck size={19} />
            <span>
              Your history.
              <br />
              <strong>Your permission.</strong>
            </span>
          </div>
          <button
            onClick={() =>
              void action(async () => {
                await api("auth/logout", "POST");
                router.push("/login");
              }, "Signed out")
            }
          >
            <LogOut size={17} /> Sign out
          </button>
          <small>Controlled MVP · Synthetic data</small>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="app-header">
          <div>
            <button
              className="mobile-toggle"
              aria-label="Toggle menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
            <span>Workspace</span>
            <span className="breadcrumb">/</span>
            <strong>{title}</strong>
          </div>
          <div>
            <LocaleSwitcher />
            <span className="private-label">
              <LockIcon /> Private workspace
            </span>
            <span className="avatar">{user?.name.slice(0, 1) || "S"}</span>
            <span className="header-user">
              <span translate="no">{user?.name}</span>
              <small>
                {role === "doctor" || role === "pharmacy"
                  ? label(user?.professionalStatus || "pending")
                  : label(role)}
              </small>
            </span>
          </div>
        </header>
        <main className="workspace-content">
          <div className="page-heading">
            <div>
              <span className="section-kicker">
                {role === "patient"
                  ? "YOUR HEALTH, CONNECTED"
                  : role === "doctor"
                    ? "CARE WITH CONTEXT"
                    : role === "pharmacy"
                      ? "PHARMACY WORKSPACE"
                      : "PLATFORM OPERATIONS"}
              </span>
              <h1>
                {section === "dashboard" && role === "patient"
                  ? <>
                      {locale === "bn" ? "আবার স্বাগতম, " : "Welcome back, "}
                      <span className="medical-value">
                        {user?.name.split(" ")[0] || (locale === "bn" ? "আপনি" : "there")}
                      </span>
                      .
                    </>
                  : title}
              </h1>
              <p>
                {role === "patient"
                  ? "A clearer picture of your medical history, all in one place."
                  : role === "doctor"
                    ? "Patient-authorized records and outpatient care."
                    : role === "pharmacy"
                      ? "Support patients with safer, more informed care using only the access they approve."
                      : "Manage accounts and operations without accessing clinical records."}
              </p>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={() => void refresh()}
            >
              <RefreshCw size={15} /> Refresh
            </Button>
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              {notice}
            </div>
          )}
          {loading ? (
            <div className="panel loading">Loading your workspace…</div>
          ) : (
            user && (
              <>
                {["doctor", "pharmacy"].includes(role) && (
                  <>
                    {user.professionalStatus !== "APPROVED" && (
                      <div className="notice">
                        {role === "pharmacy" ? "Pharmacy" : "Professional"}{" "}
                        review: {label(user.professionalStatus)}. Patient
                        access is available only after admin approval.
                      </div>
                    )}
                    <div className="patient-selector">
                      <label>
                        {role === "pharmacy"
                          ? "Authorized patient workspace"
                          : "Patient workspace"}
                        <select
                          value={patientId}
                          onChange={(e) => setPatientId(e.target.value)}
                        >
                          <option value="">Choose an authorized patient</option>
                          {Array.from(
                            new Set(activeGrants.map((g) => g.patientId)),
                          ).map((id) => (
                            <option key={id} value={id}>
                              Patient {id.slice(-8)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span>Only active grants are listed.</span>
                    </div>
                  </>
                )}
                {role === "admin" &&
                !["settings", "profile"].includes(section) ? (
                  <AdminPanel
                    section={section}
                    user={user}
                    onError={setError}
                  />
                ) : section === "settings" ? (
                  <div className="panel narrow-panel">
                    <h2>Account security</h2>
                    <p>
                      Changing your password signs out all current sessions.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const body = Object.fromEntries(
                          new FormData(e.currentTarget),
                        );
                        void action(async () => {
                          await api("auth/password", "POST", body);
                          router.push("/login");
                        });
                      }}
                    >
                      <label>
                        Current password
                        <input
                          name="currentPassword"
                          type="password"
                          required
                          autoComplete="current-password"
                        />
                      </label>
                      <label>
                        New password
                        <input
                          name="password"
                          type="password"
                          minLength={12}
                          required
                          autoComplete="new-password"
                        />
                      </label>
                      <Button disabled={busy}>Change password</Button>
                    </form>
                    <hr />
                    <p>
                      Phone ownership: <strong>Unverified</strong>. Phone-number
                      changes are not supported in this controlled MVP.
                    </p>
                  </div>
                ) : section === "profile" ? (
                  <div className="panel narrow-panel">
                    <h2>Your profile</h2>
                    <div className="id-card">
                      <small>YOUR PERMANENT SHEBAMED ID</small>
                      <strong>{user.shebamedId}</strong>
                      <button
                        aria-label="Copy ShebaMed ID"
                        onClick={() =>
                          void navigator.clipboard
                            .writeText(user.shebamedId)
                            .then(() => setNotice("ID copied"))
                        }
                      >
                        <Copy size={17} />
                      </button>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void action(() =>
                          api(
                            "profile",
                            "PATCH",
                            Object.fromEntries(new FormData(e.currentTarget)),
                          ),
                        );
                      }}
                    >
                      <label>
                        Full name
                        <input name="name" defaultValue={user.name} required />
                      </label>
                      <label>
                        Mobile number
                        <input value={user.phoneE164} readOnly />
                      </label>
                      <p className="notice field-note">
                        Phone ownership unverified · Joined{" "}
                        {date(user.createdAt)}
                      </p>
                      {role === "patient" && (
                        <>
                          <label>
                            Date of birth (optional)
                            <input
                              name="dateOfBirth"
                              type="date"
                              defaultValue={profile.dateOfBirth || ""}
                            />
                          </label>
                          <label>
                            Gender (optional)
                            <input
                              name="gender"
                              defaultValue={profile.gender || ""}
                            />
                          </label>
                        </>
                      )}
                      {role === "pharmacy" && (
                        <>
                          <label>
                            Pharmacy name
                            <input
                              name="pharmacyName"
                              required
                              defaultValue={profile.pharmacyName || ""}
                            />
                          </label>
                          <label>
                            License / registration number
                            <input
                              name="registrationNumber"
                              required
                              defaultValue={profile.registrationNumber || ""}
                            />
                          </label>
                          <label>
                            Pharmacy address
                            <input
                              name="address"
                              required
                              defaultValue={profile.address || ""}
                            />
                          </label>
                          <label>
                            Registration details
                            <textarea
                              name="credentialDetails"
                              required
                              defaultValue={profile.credentialDetails || ""}
                            />
                          </label>
                          <p className="notice">
                            Saving pharmacy registration details requires
                            administrator re-verification.
                          </p>
                        </>
                      )}
                      <Button disabled={busy}>Save profile</Button>
                    </form>
                  </div>
                ) : section === "dashboard" ? (
                  <>
                    {role === "pharmacy" && (
                      <section className="panel pharmacy-summary">
                        <div>
                          <span className="section-kicker">
                            PHARMACY PROFILE
                          </span>
                          <h2>{profile.pharmacyName || "Pharmacy"}</h2>
                          <p>
                            {profile.address || "Address not recorded"}
                            {profile.registrationNumber
                              ? " · License " + profile.registrationNumber
                              : ""}
                          </p>
                        </div>
                        <span
                          className={
                            "badge " +
                            (user.professionalStatus === "APPROVED"
                              ? "good"
                              : "neutral")
                          }
                        >
                          {user.professionalStatus === "APPROVED"
                            ? "Verified"
                            : label(user.professionalStatus)}
                        </span>
                      </section>
                    )}
                    <div className="stat-grid">
                      {(role === "patient"
                        ? [
                            [FolderHeart, records.length, "Total records"],
                            [
                              FlaskConical,
                              records.filter((r) => r.category === "LAB")
                                .length,
                              "Lab reports",
                            ],
                            [
                              FileText,
                              records.filter(
                                (r) => r.category === "PRESCRIPTION",
                              ).length,
                              "Prescriptions",
                            ],
                            [
                              ClipboardList,
                              records.filter(
                                (r) => r.category === "CLINICAL_NOTE",
                              ).length,
                              "Clinical notes",
                            ],
                          ]
                        : role === "pharmacy"
                          ? [
                              [
                                Users,
                                new Set(activeGrants.map((g) => g.patientId))
                                  .size,
                                "Authorized patients",
                              ],
                              [
                                ShieldCheck,
                                requests.filter((r) => r.status === "PENDING")
                                  .length,
                                "Pending access requests",
                              ],
                              [
                                UploadCloud,
                                records.filter(
                                  (r) =>
                                    r.documentSource === "PHARMACY_UPLOAD",
                                ).length,
                                "Uploaded records",
                              ],
                              [
                                Pill,
                                records.filter(
                                  (r) =>
                                    r.category === "MEDICINE_DISPENSING",
                                ).length,
                                "Dispensing records",
                              ],
                            ]
                          : [
                            [
                              Users,
                              new Set(activeGrants.map((g) => g.patientId))
                                .size,
                              "Authorized patients",
                            ],
                            [
                              ShieldCheck,
                              requests.filter((r) => r.status === "PENDING")
                                .length,
                              "Pending requests",
                            ],
                            [Clock3, activeGrants.length, "Active permissions"],
                            [
                              FileText,
                              records.length,
                              "Selected patient records",
                            ],
                          ]
                      ).map(([Icon, count, name]) => {
                        const I = Icon as typeof FileText;
                        return (
                          <div className="stat-card" key={String(name)}>
                            <span className="round-icon">
                              <I size={20} />
                            </span>
                            <span className="stat-number">{String(count)}</span>
                            <small>{String(name)}</small>
                          </div>
                        );
                      })}
                    </div>
                    <div className="dashboard-grid">
                      <section className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>
                              {role === "pharmacy"
                                ? "Authorized patient records"
                                : "Recent records"}
                            </h2>
                            <p>
                              {role === "pharmacy"
                                ? "Only records covered by a current patient permission are shown."
                                : "Your latest additions, with their original sources."}
                            </p>
                          </div>
                          <Link
                            className="arrow-link"
                            href={
                              "/" +
                              role +
                              "/" +
                              (role === "patient" ? "records" : "history")
                            }
                          >
                            View all <ArrowUpRight size={16} />
                          </Link>
                        </div>
                        {recordsTable(
                          [...records]
                            .sort((a, b) =>
                              b.createdAt.localeCompare(a.createdAt),
                            )
                            .slice(0, 5),
                        )}
                      </section>
                      <aside className="dashboard-side">
                        <div className="id-card">
                          <span className="id-mark">
                            <ShieldCheck size={22} /> SHEBAMED ID
                          </span>
                          <strong className="medical-value">{user.name}</strong>
                          <code>{user.shebamedId}</code>
                          <div>
                            <span>{role.toUpperCase()}</span>
                            <button
                              aria-label="Copy ID"
                              onClick={() =>
                                void navigator.clipboard
                                  .writeText(user.shebamedId)
                                  .then(() => setNotice("ID copied"))
                              }
                            >
                              <Copy size={15} />
                            </button>
                          </div>
                        </div>
                        <div className="panel tip-card">
                          <MessageSquare size={23} />
                          <h3>
                            {role === "pharmacy"
                              ? "A question about the authorized history?"
                              : "A question about your history?"}
                          </h3>
                          <p>
                            Find a previous test or report, with evidence you
                            can open.
                          </p>
                          <Link href={"/" + role + "/ai-assistant"}>
                            Ask your medical memory <ArrowRightIcon />
                          </Link>
                        </div>
                      </aside>
                    </div>
                    <div className="quick-actions">
                      <Link
                        href={
                          "/" +
                          role +
                          "/" +
                          (role === "patient" ? "records/upload" : "upload")
                        }
                      >
                        <UploadCloud />
                        <span>
                          <strong>
                            {role === "pharmacy"
                              ? "Upload an authorized patient record"
                              : "Bring your reports together"}
                          </strong>
                          <small>Upload a PDF or image</small>
                        </span>
                        <ArrowUpRight />
                      </Link>
                      <Link
                        href={
                          "/" +
                          role +
                          "/" +
                          (role === "patient" ? "doctor-access" : "requests")
                        }
                      >
                        <ShieldCheck />
                        <span>
                          <strong>
                            {role === "patient"
                              ? "Share with your doctor or pharmacy"
                              : "Request patient permission"}
                          </strong>
                          <small>Controlled, time-limited access</small>
                        </span>
                        <ArrowUpRight />
                      </Link>
                    </div>
                  </>
                ) : (section === "records" && path[1] === "upload") ||
                  section === "upload" ? (
                  <UploadPanel
                    target={target}
                    disabled={
                      busy ||
                      (role === "pharmacy" &&
                        user.professionalStatus !== "APPROVED")
                    }
                    onUpload={() => refresh()}
                    onError={setError}
                  />
                ) : detail ? (
                  <DocumentDetail
                    record={detail}
                    busy={busy}
                    workerOnline={workerOnline}
                    canReview={role === "patient"}
                    backHref={
                      "/" +
                      role +
                      "/" +
                      (role === "patient" ? "records" : "history") +
                      suffix
                    }
                    onSave={(data) =>
                      action(() =>
                        api("records/" + detail._id + "/review", "POST", data),
                      )
                    }
                    onRetry={() =>
                      action(
                        () => api("records/" + detail._id + "/retry", "POST"),
                        "Queued for processing",
                      )
                    }
                  />
                ) : ["doctor-access", "requests", "patients"].includes(
                    section,
                  ) && !path[1] ? (
                  <>
                    <div className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>
                            {role === "patient"
                              ? "You decide who gets access."
                              : "Request patient-authorized access."}
                          </h2>
                          <p>
                            {role === "patient"
                              ? "Create a single-use code, valid for 10 minutes. A code only starts a request."
                              : "Ask the patient for a sharing code. They must approve the request and its permissions."}
                          </p>
                        </div>
                      </div>
                      {role === "patient" ? (
                        <>
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void action(async () => {
                                const r = await api("access/code", "POST");
                                setCode(r.code);
                              }, "Sharing code created")
                            }
                          >
                            <Plus size={17} /> Create sharing code
                          </Button>
                          {code && (
                            <div className="share-code">
                              <code>{code}</code>
                              <button
                                aria-label="Copy sharing code"
                                onClick={() =>
                                  void navigator.clipboard.writeText(code)
                                }
                              >
                                <Copy size={18} />
                              </button>
                              <small>Expires in 10 minutes · Single use</small>
                            </div>
                          )}
                        </>
                      ) : (
                        <form
                          className="inline-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(
                              new FormData(e.currentTarget),
                            );
                            void action(
                              () => api("access/request", "POST", data),
                              "Request sent. Waiting for the patient.",
                            );
                          }}
                        >
                          <input
                            name="code"
                            aria-label="Sharing code"
                            placeholder="Patient’s sharing code"
                            required
                          />
                          <Button
                            disabled={
                              busy || user.professionalStatus !== "APPROVED"
                            }
                          >
                            Request access
                          </Button>
                        </form>
                      )}
                    </div>
                    <section className="panel">
                      <h2>Access requests</h2>
                      {requests.length ? (
                        requests.map((r) => (
                          <div className="request-row" key={r._id}>
                            <div>
                              <strong>
                                {role === "patient"
                                  ? r.providerRole === "PHARMACY"
                                    ? r.pharmacyName
                                    : r.doctorName
                                  : `Patient ${(r.patientId || "").slice(-8)}`}
                              </strong>
                              <small>
                                {role === "patient" && r.providerRole === "PHARMACY"
                                  ? `${r.pharmacyStaffName || "Pharmacy staff"} · ${r.pharmacyShebamedId || ""}`
                                  : role === "patient"
                                    ? r.doctorShebamedId
                                    : "Access request"}
                                {" · "}
                                {date(r.createdAt)}
                              </small>
                              <span
                                className={
                                  "badge " +
                                  (r.status === "APPROVED"
                                    ? "good"
                                    : r.status === "PENDING"
                                      ? ""
                                      : "bad")
                                }
                              >
                                {label(r.status)}
                              </span>
                            </div>
                            {role === "patient" && r.status === "PENDING" && (
                              <ApprovalForm
                                request={r}
                                records={records}
                                busy={busy}
                                onSubmit={(body) =>
                                  action(
                                    () => api("access/decision", "POST", body),
                                    "Access request updated",
                                  )
                                }
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <p>No access requests yet.</p>
                      )}
                    </section>
                    <section className="panel">
                      <h2>Permissions</h2>
                      {grants.length ? (
                        grants.map((g) => (
                          <div className="grant-row" key={g._id}>
                            <div>
                              <strong>
                                {role === "patient"
                                  ? g.providerRole === "PHARMACY"
                                    ? g.pharmacyName
                                    : g.doctorName
                                  : "Patient " + g.patientId.slice(-8)}
                              </strong>
                              <small>
                                {label(g.scope)} ·{" "}
                                {g.capabilities.map(label).join(", ")}
                              </small>
                              <span className="grant-status">
                                <span
                                  className={
                                    "badge " +
                                    (g.revokedAt
                                      ? "bad"
                                      : new Date(g.expiresAt) < new Date()
                                        ? "neutral"
                                        : "good")
                                  }
                                >
                                  {g.revokedAt
                                    ? "Revoked"
                                    : new Date(g.expiresAt) < new Date()
                                      ? "Expired"
                                      : "Active"}
                                </span>
                                <span>
                                  {g.revokedAt
                                    ? "Revoked " + timestamp(g.revokedAt)
                                    : new Date(g.expiresAt) < new Date()
                                      ? "Expired " + timestamp(g.expiresAt)
                                      : "Expires " + timestamp(g.expiresAt)}
                                </span>
                              </span>
                            </div>
                            {!g.revokedAt &&
                              new Date(g.expiresAt) > new Date() &&
                              (role === "patient" ? (
                                <Button
                                  variant="outline"
                                  size="small"
                                  disabled={busy}
                                  onClick={() =>
                                    void action(
                                      () =>
                                        api("access/revoke", "POST", {
                                          id: g._id,
                                        }),
                                      "Access revoked",
                                    )
                                  }
                                >
                                  Revoke access
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="small"
                                  onClick={() => {
                                    setPatientId(g.patientId);
                                    router.push(
                                      `/${role}/patients/${g.patientId}/history`,
                                    );
                                  }}
                                >
                                  Open history
                                </Button>
                              ))}
                          </div>
                        ))
                      ) : (
                        <p>No permissions granted yet.</p>
                      )}
                    </section>
                  </>
                ) : section === "ai-assistant" ||
                  path.includes("ai-assistant") ? (
                  <AiAssistant
                    suffix={suffix}
                    target={target}
                    disabled={!target}
                    aiPermissionMissing={aiPermissionMissing}
                    role={role}
                  />
                ) : section === "encounters" || path.includes("encounters") ? (
                  role === "pharmacy" ? (
                    <>
                      <section className="panel">
                        <h2>Related patient tools</h2>
                        <p>
                          Each tool checks its own active patient-approved
                          permission. Selecting a patient does not grant access.
                        </p>
                        <div className="quick-actions">
                          <Link
                            href={"/pharmacy/history" + suffix}
                            aria-disabled={!target}
                          >
                            <Clock3 />
                            <span>
                              <strong>Authorized medical history</strong>
                              <small>Open patient-approved records</small>
                            </span>
                            <ArrowUpRight />
                          </Link>
                          <Link
                            href={"/pharmacy/ai-assistant" + suffix}
                            aria-disabled={!target}
                          >
                            <MessageSquare />
                            <span>
                              <strong>AI Medical Assistant</strong>
                              <small>Ask about authorized history</small>
                            </span>
                            <ArrowUpRight />
                          </Link>
                          <Link
                            href={"/pharmacy/upload" + suffix}
                            aria-disabled={!target}
                          >
                            <UploadCloud />
                            <span>
                              <strong>Upload medical document</strong>
                              <small>Requires separate upload permission</small>
                            </span>
                            <ArrowUpRight />
                          </Link>
                          <Link
                            href={"/pharmacy/dispensing" + suffix}
                            aria-disabled={!target}
                          >
                            <Pill />
                            <span>
                              <strong>Record medicine dispensing</strong>
                              <small>Requires separate dispensing permission</small>
                            </span>
                            <ArrowUpRight />
                          </Link>
                        </div>
                      </section>
                      <div className="panel narrow-panel">
                        <h2>Record pharmacy assistance</h2>
                        <p>
                          Basic support only. This record cannot add a diagnosis
                          or create a prescription.
                        </p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(
                              new FormData(e.currentTarget),
                            );
                            void action(
                              () =>
                                api(
                                  "pharmacy/encounters" + suffix,
                                  "POST",
                                  data,
                                ),
                              "Pharmacy encounter added to the patient timeline",
                            );
                          }}
                        >
                          <label>
                            Patient
                            <input
                              value={
                                target ? `Authorized patient ${target.slice(-8)}` : ""
                              }
                              readOnly
                              placeholder="Choose an authorized patient above"
                            />
                          </label>
                          <label>
                            Visit date
                            <input
                              name="visitDate"
                              type="date"
                              required
                              defaultValue={new Date().toISOString().slice(0, 10)}
                            />
                          </label>
                          <label>
                            Pharmacy organization
                            <input
                              value={profile.pharmacyName || ""}
                              readOnly
                            />
                          </label>
                          <label>
                            Patient-reported concern
                            <textarea
                              name="patientReportedConcern"
                              required
                              maxLength={2000}
                            />
                          </label>
                          <label>
                            Relevant history reviewed
                            <textarea
                              name="relevantHistoryReviewed"
                              maxLength={5000}
                            />
                          </label>
                          <label>
                            Basic guidance or service provided
                            <textarea
                              name="guidanceOrService"
                              required
                              maxLength={5000}
                            />
                          </label>
                          <fieldset>
                            <legend>Doctor referral recommended</legend>
                            <label className="checkbox">
                              <input
                                type="radio"
                                name="doctorReferralRecommended"
                                value="YES"
                                required
                              />
                              Yes
                            </label>
                            <label className="checkbox">
                              <input
                                type="radio"
                                name="doctorReferralRecommended"
                                value="NO"
                              />
                              No
                            </label>
                          </fieldset>
                          <label>
                            Notes
                            <textarea name="notes" maxLength={5000} />
                          </label>
                          <Button disabled={busy || !target}>
                            Save pharmacy encounter
                          </Button>
                        </form>
                      </div>
                      <section className="panel">
                        <h2>Previous pharmacy encounters</h2>
                        {recordsTable(
                          records.filter(
                            (record) =>
                              record.category === "PHARMACY_ENCOUNTER",
                          ),
                        )}
                      </section>
                    </>
                  ) : (
                    <div className="panel narrow-panel">
                      <h2>Record an outpatient encounter</h2>
                      <p>
                        Requires separate encounter permission from the patient.
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const data = Object.fromEntries(
                            new FormData(e.currentTarget),
                          );
                          void action(
                            () => api("encounters" + suffix, "POST", data),
                            "Encounter added to the patient timeline",
                          );
                        }}
                      >
                        {[
                          ["date", "Encounter date"],
                          ["organization", "Organization"],
                          ["chiefComplaint", "Chief complaint"],
                          ["notes", "Clinical notes"],
                          ["history", "Relevant history"],
                          ["diagnosis", "Doctor-recorded diagnosis"],
                          ["testOrders", "Test orders"],
                          ["followUp", "Follow-up instructions"],
                        ].map(([key, name]) => (
                          <label key={key}>
                            {name}
                            {key === "date" ? (
                              <input
                                name={key}
                                type="date"
                                required
                                defaultValue={new Date()
                                  .toISOString()
                                  .slice(0, 10)}
                              />
                            ) : (
                              <textarea
                                name={key}
                                required={["chiefComplaint", "notes"].includes(
                                  key,
                                )}
                              />
                            )}
                          </label>
                        ))}
                        <Button disabled={busy || !target}>Save encounter</Button>
                      </form>
                    </div>
                  )
                ) : section === "dispensing" ? (
                  role === "pharmacy" ? (
                    <>
                      <div className="panel narrow-panel">
                        <h2>Medicine dispensing record</h2>
                        <p>
                          Record only medicines actually supplied. Dispensing
                          does not mean the medicine was taken.
                        </p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const data = new FormData(e.currentTarget);
                            void action(
                              () =>
                                api("pharmacy/dispensing" + suffix, "POST", {
                                  ...Object.fromEntries(data),
                                  activeIngredientVerified:
                                    data.get("activeIngredientVerified") ===
                                    "on",
                                }),
                              "Dispensing record added to the patient timeline",
                            );
                          }}
                        >
                          <label>
                            Patient
                            <input
                              value={
                                target ? `Authorized patient ${target.slice(-8)}` : ""
                              }
                              readOnly
                              placeholder="Choose an authorized patient above"
                            />
                          </label>
                          <label>
                            Medicine name
                            <input name="medicineName" required maxLength={160} />
                          </label>
                          <label>
                            Generic / active ingredient (only when verified)
                            <input name="activeIngredient" maxLength={160} />
                          </label>
                          <label className="checkbox">
                            <input name="activeIngredientVerified" type="checkbox" />
                            I verified this active ingredient
                          </label>
                          <label>
                            Strength
                            <input name="strength" maxLength={100} />
                          </label>
                          <label>
                            Quantity supplied
                            <input
                              name="quantitySupplied"
                              required
                              maxLength={100}
                            />
                          </label>
                          <label>
                            Dispensing date
                            <input
                              name="dispensingDate"
                              type="date"
                              required
                              defaultValue={new Date().toISOString().slice(0, 10)}
                            />
                          </label>
                          <label>
                            Prescription reference (optional)
                            <input
                              name="prescriptionReference"
                              maxLength={200}
                            />
                          </label>
                          <Button disabled={busy || !target}>
                            Save dispensing record
                          </Button>
                        </form>
                      </div>
                      <section className="panel">
                        <h2>Medicine history matching</h2>
                        <p>
                          Informational matching only. It does not recommend
                          medicines or approve prescriptions.
                        </p>
                        <label>
                          Search previous medicine records
                          <input
                            value={medicineMatch}
                            onChange={(event) =>
                              setMedicineMatch(event.target.value)
                            }
                            placeholder="Medicine name"
                          />
                        </label>
                        <h3>Previously prescribed</h3>
                        {recordsTable(
                          records.filter(
                            (record) =>
                              record.category === "PRESCRIPTION" &&
                              (!medicineMatch ||
                                `${record.title} ${record.filename} ${record.extracted?.medications.join(" ") || ""} ${record.confirmed?.medications.join(" ") || ""}`
                                  .toLowerCase()
                                  .includes(medicineMatch.toLowerCase())),
                          ),
                        )}
                        <h3>Previously dispensed</h3>
                        {recordsTable(
                          records.filter(
                            (record) =>
                              record.category === "MEDICINE_DISPENSING" &&
                              (!medicineMatch ||
                                `${record.title} ${record.pharmacyDispensing?.medicineName || ""} ${record.pharmacyDispensing?.activeIngredient || ""}`
                                  .toLowerCase()
                                  .includes(medicineMatch.toLowerCase())),
                          ),
                        )}
                        <h3>Patient-reported medicines</h3>
                        <p>
                          No structured patient-reported medicine list is
                          available in this workspace. Prescribed and dispensed
                          records are not treated as patient-reported or
                          consumed.
                        </p>
                      </section>
                    </>
                  ) : (
                    <section className="panel">
                      <h2>Medicine dispensing history</h2>
                      {recordsTable(
                        records.filter(
                          (record) =>
                            record.category === "MEDICINE_DISPENSING",
                        ),
                      )}
                    </section>
                  )
                ) : section === "timeline" ? (
                  <section className="panel">
                    {filters()}
                    <div className="timeline-list">
                      {filtered.length ? (
                        filtered.map((r) => (
                          <article key={r._id}>
                            <span className="timeline-dot" />
                            <div className="timeline-date">
                              {date(r.reportDate)}
                            </div>
                            <div className="timeline-body">
                              <span className="badge">
                                {recordTypeLabel(r)}
                              </span>
                              <h3>
                                <Link href={"/patient/records/" + r._id}>
                                  {displayTitle(r)}
                                </Link>
                              </h3>
                              <p>
                                {r.pharmacyEncounter
                                  ? `Recorded by ${r.pharmacyEncounter.staffName || r.uploadedByStaffName || r.authorName || "Pharmacy staff"}`
                                  : r.encounter
                                    ? `Recorded by ${r.authorName || "Doctor"}`
                                    : `${label(r.verification)} · ${r.authorName ? "Uploaded" : "Added"}`}{" "}
                                {date(r.createdAt)}
                                {r.organizationName
                                  ? ` · ${r.documentSource === "PHARMACY_UPLOAD" ? "Pharmacy upload" : "Pharmacy"}: ${r.organizationName}`
                                  : ""}
                                {r.pharmacyEncounter
                                  ? ` · ${label(r.verification)}`
                                  : ""}
                              </p>
                              {r.fileId && (
                                <a href={"/api/records/" + r._id + "/file"}>
                                  Open original <ArrowUpRight size={15} />
                                </a>
                              )}
                            </div>
                          </article>
                        ))
                      ) : (
                        <Empty
                          title="A timeline takes shape here"
                          description="Your medical report dates will connect your history over time."
                        />
                      )}
                    </div>
                  </section>
                ) : (
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>
                        {section === "doctor-records"
                          ? "Doctor-added records"
                          : "Medical records"}
                      </h2>
                      {role === "patient" && (
                        <Button asChild size="small">
                          <Link href="/patient/records/upload">
                            <Plus size={16} /> Upload
                          </Link>
                        </Button>
                      )}
                    </div>
                    {filters()}
                    {recordsTable(
                      section === "doctor-records"
                        ? filtered.filter(
                            (r) =>
                              r.verification === "CLINICIAN_AUTHORED" ||
                              r.authorName,
                          )
                        : filtered,
                    )}
                  </section>
                )}
              </>
            )
          )}
        </main>
        {openedRecord && (
          <div className="record-dialog-backdrop">
            <section
              role="dialog"
              aria-modal="true"
              aria-label="Medical record details"
              className="panel record-dialog"
            >
              <Button
                variant="outline"
                size="small"
                onClick={() => setOpenedRecord(null)}
              >
                Close
              </Button>
              <h2 className="medical-value">{displayTitle(openedRecord)}</h2>
              <p>
                {date(openedRecord.reportDate)} ·{" "}
                {label(openedRecord.verification)}
              </p>
              {openedRecord.encounter ? (
                Object.entries(openedRecord.encounter).map(([k, v]) => (
                  <div key={k}>
                    <strong>{k}</strong>
                    <p>{v || "Not recorded"}</p>
                  </div>
                ))
              ) : openedRecord.pharmacyEncounter ||
                openedRecord.pharmacyDispensing ? (
                <PharmacyRecordDetails
                  record={openedRecord}
                  backHref={"/pharmacy/history" + suffix}
                />
              ) : (
                <>
                  <p>
                    Source: <span className="medical-value">{openedRecord.filename}</span>
                  </p>
                  {(
                    openedRecord.confirmed || openedRecord.extracted
                  )?.observations.map((o, i) => (
                    <p key={i}>
                      {o.test}: {o.result} {o.unit} · Page {o.page}
                    </p>
                  ))}
                </>
              )}
              {openedRecord.fileId && (
                <a
                  className="button primary"
                  href={"/api/records/" + openedRecord._id + "/file"}
                >
                  Download original
                </a>
              )}
            </section>
          </div>
        )}
        <footer className="workspace-footer">
          <ShieldCheck size={13} /> Patient-controlled medical memory{" "}
          <span>Controlled MVP · Fictional records only</span>
        </footer>
      </div>
    </div>
    </Localize>
  );
}
function LockIcon() {
  return <ShieldCheck size={15} />;
}
function ArrowRightIcon() {
  return <ArrowUpRight size={16} />;
}
function UploadPanel({
  target,
  disabled,
  onUpload,
  onError,
}: {
  target?: string;
  disabled: boolean;
  onUpload: () => Promise<void>;
  onError: (s: string) => void;
}) {
  const { locale } = useI18n();
  const [files, setFiles] = useState<File[]>([]),
    [status, setStatus] = useState(""),
    [progress, setProgress] = useState(0),
    [uploading, setUploading] = useState(false);
  async function upload() {
    if (!target) return;
    setUploading(true);
    onError("");
    try {
      for (const file of files) {
        setStatus("Uploading " + file.name);
        const form = new FormData();
        form.set("file", file);
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/records/upload?patientId=" + target);
          xhr.upload.onprogress = (e) =>
            setProgress(
              e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0,
            );
          xhr.onload = () => {
            let result;
            try {
              result = JSON.parse(xhr.responseText);
            } catch {
              reject(new Error("Upload failed"));
              return;
            }
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(result.error));
          };
          xhr.onerror = () =>
            reject(new Error("Upload interrupted. Try again."));
          xhr.send(form);
        });
      }
      setStatus(
        "Uploaded and queued. Run the processing worker, then review extracted details.",
      );
      setFiles([]);
      await onUpload();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <Localize>
    <section className="panel upload-panel">
      <h2>Bring your medical history together.</h2>
      <p>Upload original reports and review the details after processing.</p>
      <label
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <UploadCloud size={45} />
        <strong>Drop your reports here</strong>
        <span>or click to browse files</span>
        <small>
          PDF, JPG, PNG, WEBP · Default limit 5 MB per file · 10 pages
        </small>
        <input
          aria-label="Select medical reports"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </label>
      {files.map((f, i) => (
        <div className="file-preview" key={i}>
          <FileText />
          <span>
            {f.name}
            <small>{(f.size / 1024).toFixed(0)} KB</small>
          </span>
          <button
            aria-label={translate("Remove", locale) + " " + f.name}
            onClick={() => setFiles(files.filter((_, j) => i !== j))}
          >
            <X size={17} />
          </button>
        </div>
      ))}
      <div className="notice">
        By uploading, you consent to local OCR and Groq processing of extracted
        text. Use synthetic medical reports only.
      </div>
      <Button
        disabled={!files.length || disabled || uploading || !target}
        onClick={() => void upload()}
      >
        <UploadCloud size={17} />
        {uploading ? "Uploading…" : "Upload & process"}
      </Button>
      {uploading && <progress max={100} value={progress} />}
      <p role="status">{status}</p>
      <div className="upload-steps">
        <span>01 · Private storage</span>
        <span>02 · OCR & extraction</span>
        <span>03 · Your review</span>
      </div>
    </section>
    </Localize>
  );
}
function ApprovalForm({
  request,
  records,
  busy,
  onSubmit,
}: {
  request: RequestItem;
  records: RecordItem[];
  busy: boolean;
  onSubmit: (body: unknown) => Promise<void>;
}) {
  const [scope, setScope] = useState("ALL");
  const pharmacyRequest = request.providerRole === "PHARMACY";
  const availableCapabilities = pharmacyRequest
    ? [
        ["READ_RECORDS", "View authorized medical history and reports"],
        ["QUERY_MEDICAL_HISTORY", "Search authorized history with source citations"],
        ["UPLOAD_PHARMACY_DOCUMENT", "Upload records with separate permission"],
        ["CREATE_PHARMACY_ENCOUNTER", "Record basic pharmacy assistance"],
        ["RECORD_MEDICINE_DISPENSING", "Record medicines actually supplied"],
      ]
    : [
        ["READ_RECORDS", "Open the original reports"],
        ["QUERY_MEDICAL_HISTORY", "Use AI clinical memory over those reports"],
        ["ADD_CLINICAL_DOCUMENT", "Add own notes and documents"],
        ["CREATE_OUTPATIENT_ENCOUNTER", "Write outpatient encounters"],
      ];
  return (
    <Localize>
    <form
      className="approval-form"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        void onSubmit({
          requestId: request._id,
          decision: "APPROVE",
          minutes: Number(d.get("minutes")),
          scope,
          documentIds: d.getAll("documentIds"),
          capabilities: d.getAll("capabilities"),
        });
      }}
    >
      <div className="form-row">
        <label>
          Duration
          <select name="minutes">
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </label>
        <label>
          Records
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            {[
              "ALL",
              "SELECTED",
              "LAB",
              "PRESCRIPTION",
              "CLINICAL_NOTE",
              "PHARMACY_ENCOUNTER",
              "MEDICINE_DISPENSING",
            ].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
      </div>
      {scope === "SELECTED" &&
        records.map((r) => (
          <label className="checkbox" key={r._id}>
            <input name="documentIds" value={r._id} type="checkbox" />
            {displayTitle(r)}
          </label>
        ))}
      <div className="capability-list">
        {availableCapabilities.map(([c, description]) => (
          <label className="checkbox" key={c}>
            <input
              type="checkbox"
              name="capabilities"
              value={c}
              defaultChecked={
                c === "READ_RECORDS" || c === "QUERY_MEDICAL_HISTORY"
              }
            />
            {label(c)}
            <small>{description}</small>
          </label>
        ))}
      </div>
      <p className="approval-hint">
        Reading and AI history search are selected by default. Upload and
        record-writing permissions stay off until you choose them.
      </p>
      <div className="inline-buttons">
        <Button size="small" disabled={busy}>
          Approve
        </Button>
        <Button
          type="button"
          size="small"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void onSubmit({
              requestId: request._id,
              decision: "REJECT",
              minutes: 30,
              scope: "ALL",
              documentIds: [],
              capabilities: ["READ_RECORDS"],
            })
          }
        >
          Reject
        </Button>
      </div>
    </form>
    </Localize>
  );
}
type AdminData = {
  users?: User[] | number;
  patients?: number;
  doctors?:
    | (User & {
        profile?: {
          registrationNumber: string;
          specialization: string;
          workplace: string;
          credentialDetails: string;
        };
      })[]
    | number;
  pharmacies?:
    | (User & {
        profile?: {
          pharmacyName: string;
          registrationNumber: string;
          address: string;
          credentialDetails: string;
        };
      })[]
    | number;
  pending?: number;
  failedJobs?: number;
  storage?: { bytes: number };
  events?: {
    _id: string;
    action: string;
    actorId: string;
    targetId: string;
    createdAt: string;
  }[];
  organizations?: { _id: string; name: string; address: string }[];
  database?: string;
  jobs?: { _id: string; status: string; attempts: number; error?: string }[];
};
function AdminPanel({
  section,
  user,
  onError,
}: {
  section: string;
  user: User;
  onError: (s: string) => void;
}) {
  const [data, setData] = useState<AdminData>({}),
    [busy, setBusy] = useState(false);
  const [loadedSection, setLoadedSection] = useState<string | null>(null);
  async function load() {
    try {
      setData(
        await api("admin/" + (section === "dashboard" ? "overview" : section)),
      );
    } catch (e) {
      onError((e as Error).message);
    }
  }
  if (loadedSection !== section) {
    setLoadedSection(section);
    void load();
  }
  async function change(path: string, body: unknown) {
    setBusy(true);
    try {
      await api("admin/" + path, "POST", body);
      await load();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (section === "dashboard")
    return (
      <Localize>
      <>
        <div className="stat-grid">
          {[
            ["Total users", data.users],
            ["Patients", data.patients],
            ["Doctors", data.doctors],
            ["Pharmacies", data.pharmacies],
            ["Pending review", data.pending],
          ].map(([name, value]) => (
            <div className="stat-card" key={String(name)}>
              <span className="round-icon">
                <Users size={20} />
              </span>
              <span className="stat-number">
                {typeof value === "number" ? value : 0}
              </span>
              <small>{String(name)}</small>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>Operations at a glance</h2>
          <p>
            Document storage:{" "}
            {((data.storage?.bytes || 0) / 1024 / 1024).toFixed(2)} MB
          </p>
          <p>Failed processing jobs: {data.failedJobs || 0}</p>
          <Link className="arrow-link" href="/admin/doctors">
            Review doctor registrations <ArrowUpRight size={16} />
          </Link>
          <Link className="arrow-link" href="/admin/pharmacies">
            Review pharmacy registrations <ArrowUpRight size={16} />
          </Link>
        </div>
      </>
      </Localize>
    );
  if (section === "users")
    return (
      <Localize>
      <section className="panel">
        <h2>Registered accounts</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ShebaMed ID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data.users) &&
                data.users.map((u) => (
                  <tr key={u._id}>
                    <td className="medical-value">{u.name}</td>
                    <td className="medical-value">{u.shebamedId}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>
                      {u.role !== "ADMIN" && u._id !== user._id && (
                        <Button
                          variant="outline"
                          size="small"
                          disabled={busy}
                          onClick={() =>
                            void change("status", {
                              id: u._id,
                              status:
                                u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                            })
                          }
                        >
                          {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      </Localize>
    );
  if (section === "doctors")
    return (
      <Localize>
      <section className="panel">
        <h2>Professional review</h2>
        <p>
          Review credentials manually. Approval means admin-reviewed, not
          official regulatory verification.
        </p>
        {Array.isArray(data.doctors) &&
          data.doctors.map((u) => (
            <article className="doctor-review" key={u._id}>
              <h3 className="medical-value">{u.name}</h3>
              <span className="badge">{label(u.professionalStatus)}</span>
              <dl>
                <dt>Registration</dt>
                <dd className="medical-value">{u.profile?.registrationNumber}</dd>
                <dt>Specialization</dt>
                <dd className="medical-value">{u.profile?.specialization}</dd>
                <dt>Workplace</dt>
                <dd className="medical-value">{u.profile?.workplace}</dd>
                <dt>Credentials</dt>
                <dd className="medical-value">{u.profile?.credentialDetails}</dd>
              </dl>
              <div className="inline-buttons">
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() =>
                    void change("review", { id: u._id, decision: "APPROVED" })
                  }
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void change("review", { id: u._id, decision: "REJECTED" })
                  }
                >
                  Reject
                </Button>
              </div>
            </article>
          ))}
      </section>
      </Localize>
    );
  if (section === "pharmacies")
    return (
      <Localize>
        <section className="panel">
          <h2>Pharmacy verification</h2>
          <p>
            Review registration details manually. Approval is an internal
            review, not regulatory certification.
          </p>
          {Array.isArray(data.pharmacies) &&
            data.pharmacies.map((u) => (
              <article className="doctor-review" key={u._id}>
                <h3 className="medical-value">
                  {u.profile?.pharmacyName || u.name}
                </h3>
                <p>{u.name} · {u.shebamedId}</p>
                <span className="badge">{label(u.professionalStatus)}</span>
                <dl>
                  <dt>License / registration</dt>
                  <dd className="medical-value">
                    {u.profile?.registrationNumber}
                  </dd>
                  <dt>Address</dt>
                  <dd className="medical-value">{u.profile?.address}</dd>
                  <dt>Registration details</dt>
                  <dd className="medical-value">
                    {u.profile?.credentialDetails}
                  </dd>
                </dl>
                <div className="inline-buttons">
                  <Button
                    size="small"
                    disabled={busy}
                    onClick={() =>
                      void change("pharmacy-review", {
                        id: u._id,
                        decision: "APPROVED",
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void change("pharmacy-review", {
                        id: u._id,
                        decision: "REJECTED",
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))}
        </section>
      </Localize>
    );
  if (section === "organizations")
    return (
      <Localize>
      <section className="panel">
        <h2>Organizations</h2>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            void change(
              "organizations",
              Object.fromEntries(new FormData(e.currentTarget)),
            );
          }}
        >
          <input
            aria-label="Organization name"
            name="name"
            placeholder="Organization name"
            required
          />
          <input
            aria-label="Organization address"
            name="address"
            placeholder="Address"
          />
          <Button disabled={busy}>Add organization</Button>
        </form>
        {data.organizations?.map((o) => (
          <div className="grant-row" key={o._id}>
            <strong className="medical-value">{o.name}</strong>
            <span className="medical-value">{o.address}</span>
          </div>
        ))}
      </section>
      </Localize>
    );
  if (section === "audit")
    return (
      <Localize>
      <section className="panel">
        <h2>Access & activity events</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.events?.map((e) => (
                <tr key={e._id}>
                  <td>{label(e.action)}</td>
                  <td>{e.actorId.slice(-8)}</td>
                  <td>{e.targetId.slice(-8)}</td>
                  <td>{timestamp(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </Localize>
    );
  return (
    <Localize>
    <section className="panel">
      <h2>System health</h2>
      <p>
        Database: <strong>{data.database || "Checking…"}</strong>
      </p>
      <p>
        Reserved file storage:{" "}
        {((data.storage?.bytes || 0) / 1024 / 1024).toFixed(2)} MB
      </p>
      <h3>Processing jobs</h3>
      {data.jobs?.map((j) => (
        <div className="grant-row" key={j._id}>
          <strong>{label(j.status)}</strong>
          <span>Attempts: {j.attempts}</span>
          <span>{j.error}</span>
        </div>
      ))}
    </section>
    </Localize>
  );
}
