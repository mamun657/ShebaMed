import { describe, it, expect, beforeAll, vi } from "vitest";
import { ObjectId } from "mongodb";
import {
  normalizePhone,
  grantMatches,
  userId,
  digest,
  checkOrigin,
  oid,
  passwordSchema,
  authorize,
  allowedRecords,
} from "../lib/security";
import { registrationSchema } from "../lib/auth";
const state = vi.hoisted(() => ({
  grants: [] as Record<string, unknown>[],
  pharmacyGrants: [] as Record<string, unknown>[],
  records: [] as Record<string, unknown>[],
  pharmacyProfile: { _id: "pharmacy-profile" } as Record<string, unknown>,
}));
vi.mock("../lib/db", () => ({
  ensureSchema: async () => {},
  db: async () => ({
    collection: (name: string) => ({
      findOne: async () => state.pharmacyProfile,
      find: () => ({
        sort: () => ({ toArray: async () => state.records }),
        toArray: async () =>
          name === "doctor_access_grants"
            ? state.grants
            : name === "pharmacy_access_grants"
              ? state.pharmacyGrants
              : state.records,
      }),
    }),
  }),
}));
beforeAll(() => {
  process.env.AUTH_SECRET = "synthetic-test-secret-with-at-least-32-characters";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});
const future = new Date(Date.now() + 600000),
  past = new Date(Date.now() - 1000);
const grant = {
  scope: "ALL",
  capabilities: ["READ_RECORDS"],
  expiresAt: future,
  revokedAt: null,
  documentIds: [],
};
describe("Phone and account validation", () => {
  it.each(["01712345678", "+8801712345678", "8801712345678", "01712 345678"])(
    "normalizes %s",
    (value) => expect(normalizePhone(value)).toBe("+8801712345678"),
  );
  it.each(["123", "+14155552671", "01112345678", "not-a-phone"])(
    "rejects %s",
    (value) => expect(() => normalizePhone(value)).toThrow(),
  );
  it("rejects weak passwords", () =>
    expect(passwordSchema.safeParse("short").success).toBe(false));
  it("rejects public admin registration", () =>
    expect(
      registrationSchema.safeParse({
        name: "Fake Admin",
        phone: "01712345678",
        password: "LongEnoughPassword!",
        confirmPassword: "LongEnoughPassword!",
        role: "ADMIN",
        consent: true,
      }).success,
    ).toBe(false));
  it("requires professional details for doctors", () =>
    expect(
      registrationSchema.safeParse({
        name: "Test Doctor",
        phone: "01712345678",
        password: "LongEnoughPassword!",
        confirmPassword: "LongEnoughPassword!",
        role: "DOCTOR",
        consent: true,
      }).success,
    ).toBe(false));
  it("requires complete pharmacy registration details", () => {
    const base = {
      name: "Synthetic Pharmacy Staff",
      phone: "01712345678",
      password: "LongEnoughPassword!",
      confirmPassword: "LongEnoughPassword!",
      role: "PHARMACY",
      consent: true,
    };
    expect(registrationSchema.safeParse(base).success).toBe(false);
    expect(
      registrationSchema.safeParse({
        ...base,
        pharmacyName: "Synthetic Community Pharmacy",
        registrationNumber: "SYNTH-PH-001",
        address: "Synthetic District",
        credentialDetails: "Synthetic registration details",
      }).success,
    ).toBe(true);
  });
  it("requires matching passwords", () =>
    expect(
      registrationSchema.safeParse({
        name: "Test Patient",
        phone: "01712345678",
        password: "LongEnoughPassword!",
        confirmPassword: "differentPassword!",
        role: "PATIENT",
        consent: true,
      }).success,
    ).toBe(false));
  it("creates unique non-phone IDs", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => userId("PATIENT")));
    expect(ids.size).toBe(1000);
    expect([...ids][0]).toMatch(/^SM-P-[A-F0-9]{20}$/);
    expect(userId("PHARMACY")).toMatch(/^SM-PH-[A-F0-9]{20}$/);
  });
  it("does not expose tokens in stored digest", () => {
    expect(digest("recovery-token")).not.toContain("recovery-token");
    expect(digest("recovery-token")).toHaveLength(64);
  });
});
describe("Consent boundaries", () => {
  it("permits a matching read grant", () =>
    expect(grantMatches(grant, "READ_RECORDS")).toBe(true));
  it("denies writes on a read-only grant", () =>
    expect(grantMatches(grant, "ADD_CLINICAL_DOCUMENT")).toBe(false));
  it("denies expired grants", () =>
    expect(grantMatches({ ...grant, expiresAt: past }, "READ_RECORDS")).toBe(
      false,
    ));
  it("denies at the precise expiry boundary", () =>
    expect(
      grantMatches(
        { ...grant, expiresAt: future },
        "READ_RECORDS",
        undefined,
        future,
      ),
    ).toBe(false));
  it("denies revoked grants", () =>
    expect(
      grantMatches({ ...grant, revokedAt: new Date() }, "READ_RECORDS"),
    ).toBe(false));
  it("restricts selected documents", () => {
    const g = { ...grant, scope: "SELECTED", documentIds: ["one"] };
    expect(
      grantMatches(g, "READ_RECORDS", { _id: "one", category: "LAB" }),
    ).toBe(true);
    expect(
      grantMatches(g, "READ_RECORDS", { _id: "two", category: "LAB" }),
    ).toBe(false);
  });
  it("restricts category grants", () => {
    expect(
      grantMatches({ ...grant, scope: "LAB" }, "READ_RECORDS", {
        category: "LAB",
      }),
    ).toBe(true);
    expect(
      grantMatches({ ...grant, scope: "LAB" }, "READ_RECORDS", {
        category: "PRESCRIPTION",
      }),
    ).toBe(false);
  });
  it("does not let admins read clinical records", async () => {
    await expect(
      authorize({ _id: "admin", role: "ADMIN" }, "patient", "READ_RECORDS"),
    ).rejects.toThrow();
  });
  it("does not let a different patient access records", async () => {
    await expect(
      authorize({ _id: "other", role: "PATIENT" }, "patient", "READ_RECORDS"),
    ).rejects.toThrow();
  });
  it("blocks pending doctors even if a grant exists", async () => {
    state.grants = [grant];
    await expect(
      authorize(
        { _id: "doctor", role: "DOCTOR", professionalStatus: "PENDING" },
        "patient",
        "READ_RECORDS",
      ),
    ).rejects.toThrow();
  });
  it("requires pharmacy verification and role-specific capabilities", async () => {
    state.pharmacyGrants = [grant];
    await expect(
      authorize(
        { _id: "pharmacist", role: "PHARMACY", professionalStatus: "PENDING" },
        "patient",
        "READ_RECORDS",
      ),
    ).rejects.toThrow();
    const pharmacist = {
      _id: "pharmacist",
      role: "PHARMACY",
      professionalStatus: "APPROVED",
    };
    await expect(
      authorize(pharmacist, "patient", "READ_RECORDS"),
    ).resolves.toBeUndefined();
    await expect(
      authorize(pharmacist, "patient", "CREATE_OUTPATIENT_ENCOUNTER"),
    ).rejects.toThrow();
  });
  it("filters records using the same grant capability and scope", async () => {
    state.grants = [
      { ...grant, scope: "LAB" },
      { ...grant, scope: "ALL", capabilities: ["QUERY_MEDICAL_HISTORY"] },
    ];
    state.records = [
      { _id: "lab", category: "LAB" },
      { _id: "prescription", category: "PRESCRIPTION" },
    ];
    const result = await allowedRecords(
      { _id: "doctor", role: "DOCTOR", professionalStatus: "APPROVED" },
      "patient",
    );
    expect(result.map((r) => r._id)).toEqual(["lab"]);
  });
});
describe("Request boundaries", () => {
  it("rejects a cross-origin mutation", () =>
    expect(() =>
      checkOrigin(
        new Request("http://localhost:3000/api/access", {
          method: "POST",
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toThrow());
  it("rejects missing origin on mutations", () =>
    expect(() =>
      checkOrigin(
        new Request("http://localhost:3000/api/access", { method: "POST" }),
      ),
    ).toThrow());
  it("allows same-origin mutations", () =>
    expect(() =>
      checkOrigin(
        new Request("http://localhost:3000/api/access", {
          method: "POST",
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow());
  it("rejects malformed IDs", () => expect(() => oid("{$ne:null}")).toThrow());
  it("accepts actual object IDs", () =>
    expect(oid(String(new ObjectId()))).toBeInstanceOf(ObjectId));
});
