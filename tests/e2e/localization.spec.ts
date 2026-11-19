import { expect, test } from "@playwright/test";

test("language selection persists from the landing page through login and refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch language to Bangla" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(
    page.getByRole("link", { name: "সাইন ইন", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "আপনার স্বাস্থ্য-তথ্যের মালিক আপনি।",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/localization-bangla.png",
    fullPage: true,
  });

  await page.getByRole("link", { name: "সাইন ইন", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "আপনার ইতিহাস এখন এখানে।" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.locator('input[name="phone"]')).toBeVisible();

  await page
    .getByRole("button", { name: "ভাষা ইংরেজিতে পরিবর্তন করুন" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Your history is here." }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Your Medical Records. Your Doctor. One Connected Story.",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/localization-english.png",
    fullPage: true,
  });
});

test("patient, doctor and admin screens use the selected language", async ({
  page,
}) => {
  let activeRole: "PATIENT" | "DOCTOR" | "ADMIN" = "PATIENT";
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/auth/me")) {
      const id = activeRole.toLowerCase();
      await route.fulfill({
        json: {
          user: {
            _id: id,
            name: `Synthetic ${id}`,
            role: activeRole,
            shebamedId: `SHEBA-${id}`,
            phoneE164: "+8801700000000",
            professionalStatus: "APPROVED",
            status: "ACTIVE",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          profile: {},
        },
      });
      return;
    }
    if (url.pathname.endsWith("/api/access")) {
      await route.fulfill({ json: { requests: [], grants: [] } });
      return;
    }
    if (url.pathname.endsWith("/api/records")) {
      await route.fulfill({ json: { records: [] } });
      return;
    }
    if (url.pathname.endsWith("/api/admin/overview")) {
      await route.fulfill({
        json: { users: 3, patients: 2, doctors: 1, pending: 0, storage: { bytes: 0 } },
      });
      return;
    }
    if (url.pathname.endsWith("/api/admin/doctors")) {
      await route.fulfill({ json: { doctors: [] } });
      return;
    }
    await route.fulfill({ json: {} });
  });

  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch language to Bangla" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");

  await page.goto("/patient/dashboard");
  await expect(
    page.getByRole("link", { name: "আমার চিকিৎসা-নথি" }),
  ).toBeVisible();
  await expect(page.getByText("মোট নথি", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "রিফ্রেশ" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByText("মোট নথি", { exact: true })).toBeVisible();

  activeRole = "DOCTOR";
  await page.goto("/doctor/dashboard");
  await expect(
    page.getByRole("link", { name: "প্রবেশাধিকারের অনুরোধ" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "সারসংক্ষেপ" })).toBeVisible();

  activeRole = "ADMIN";
  await page.goto("/admin/dashboard");
  await expect(page.getByRole("link", { name: "ব্যবহারকারী" })).toBeVisible();
  await expect(page.getByText("মোট ব্যবহারকারী", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "কার্যক্রম এক নজরে" }),
  ).toBeVisible();
  await page.goto("/admin/doctors");
  await expect(
    page.getByRole("heading", { name: "পেশাগত পর্যালোচনা" }),
  ).toBeVisible();
});

test("records and AI controls localize while source content and answer overrides remain intact", async ({
  page,
}) => {
  const record = {
    _id: "synthetic-record",
    title: "Synthetic HbA1c Report",
    filename: "synthetic-hba1c.pdf",
    mime: "application/pdf",
    category: "LAB_REPORT",
    reportDate: "2026-01-15",
    createdAt: "2026-01-16T00:00:00.000Z",
    status: "COMPLETED",
    extractionState: "COMPLETED",
    verification: "PATIENT_CONFIRMED",
    fileId: "synthetic-file",
    extracted: {
      title: "Synthetic HbA1c Report",
      category: "LAB_REPORT",
      reportDate: "2026-01-15",
      laboratory: "Synthetic Lab",
      hospital: null,
      observations: [
        {
          test: "HbA1c",
          result: "5.4",
          unit: "%",
          referenceRange: null,
          page: 1,
        },
      ],
      medications: [],
      diagnoses: [],
    },
  };
  let aiLanguage = "";
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/auth/me")) {
      await route.fulfill({
        json: {
          user: {
            _id: "patient",
            name: "Synthetic Patient",
            role: "PATIENT",
            shebamedId: "SHEBA-TEST",
            phoneE164: "+8801700000000",
            professionalStatus: "APPROVED",
            status: "ACTIVE",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          profile: {},
        },
      });
    } else if (url.pathname.endsWith("/api/access")) {
      await route.fulfill({ json: { requests: [], grants: [] } });
    } else if (url.pathname.endsWith("/api/records")) {
      await route.fulfill({ json: { records: [record] } });
    } else if (url.pathname.endsWith("/api/ai")) {
      const request = route.request().postDataJSON() as { language: string };
      aiLanguage = request.language;
      await route.fulfill({
        json: {
          answer:
            request.language === "Bangla"
              ? "কৃত্রিম পরীক্ষার ফল 5.4%।"
              : "The synthetic result is 5.4%.",
          sources: [
            {
              documentId: record._id,
              page: 1,
              quote: "HbA1c 5.4%",
              filename: record.filename,
              reportDate: record.reportDate,
              category: record.category,
              verification: record.verification,
              url: "/api/records/synthetic-record/file",
            },
          ],
          intent: "HISTORY",
          pendingDocuments: 0,
          usedModel: false,
        },
      });
    } else {
      await route.fulfill({ json: {} });
    }
  });

  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch language to Bangla" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");

  await page.goto("/patient/records");
  await expect(
    page.getByRole("columnheader", { name: "নথি" }),
  ).toBeVisible();
  await expect(
    page.getByText("Synthetic HbA1c Report", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("সম্পন্ন", { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/patient/records/synthetic-record");
  await expect(
    page.getByRole("link", { name: "মূল রিপোর্ট" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "ফলাফল" }),
  ).toBeVisible();
  await expect(page.getByText("5.4", { exact: true })).toBeVisible();

  await page.goto("/patient/ai-assistant");
  const language = page.getByLabel("উত্তরের ভাষা");
  await expect(language).toHaveValue("Bangla");
  await page
    .getByRole("button", { name: "আমি কি আগে HbA1c পরীক্ষা করিয়েছি?" })
    .click();
  await expect(
    page.getByText("আমি কি আগে HbA1c পরীক্ষা করিয়েছি?", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("কৃত্রিম পরীক্ষার ফল 5.4%।")).toBeVisible();
  await expect(page.getByText("HbA1c 5.4%", { exact: true })).toBeVisible();
  expect(aiLanguage).toBe("Bangla");
  await language.selectOption("English");
  await page
    .getByRole("button", { name: "ভাষা ইংরেজিতে পরিবর্তন করুন" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const englishLanguage = page.getByLabel("Answer language");
  await expect(englishLanguage).toHaveValue("English");
  await englishLanguage.selectOption("Bangla");
  await page
    .getByRole("button", { name: "Switch language to Bangla" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByLabel("উত্তরের ভাষা")).toHaveValue("Bangla");
});

test("public and role routes render their localized page titles", async ({
  page,
}) => {
  test.skip(
    test.info().project.name === "mobile",
    "Mobile language switching and workspace screens are covered by the mobile smoke tests.",
  );
  let activeRole: "PATIENT" | "DOCTOR" | "ADMIN" = "PATIENT";
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/auth/me")) {
      const id = activeRole.toLowerCase();
      await route.fulfill({
        json: {
          user: {
            _id: id,
            name: `Synthetic ${id}`,
            role: activeRole,
            shebamedId: `SHEBA-${id}`,
            phoneE164: "+8801700000000",
            professionalStatus: "APPROVED",
            status: "ACTIVE",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          profile: {},
        },
      });
    } else if (url.pathname.endsWith("/api/access")) {
      await route.fulfill({ json: { requests: [], grants: [] } });
    } else if (url.pathname.endsWith("/api/records")) {
      await route.fulfill({ json: { records: [] } });
    } else if (url.pathname.endsWith("/api/admin/overview")) {
      await route.fulfill({
        json: { users: 3, patients: 2, doctors: 1, pending: 0 },
      });
    } else {
      await route.fulfill({
        json: { users: [], doctors: [], organizations: [], events: [], jobs: [] },
      });
    }
  });

  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch language to Bangla" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");

  const publicPages = [
    ["/login", "মোবাইল নম্বর"],
    ["/register", "মোবাইল নম্বর"],
    ["/register/doctor", "মোবাইল নম্বর"],
    ["/recover-account", "মোবাইল নম্বর"],
    ["/reset-password", "মোবাইল নম্বর"],
    ["/about", "আরও সংযুক্ত চিকিৎসা-ইতিহাস।"],
    ["/how-it-works", "আপনার প্রথম রিপোর্ট থেকে পরবর্তী সাক্ষাৎ পর্যন্ত।"],
    ["/features", "প্রাসঙ্গিক তথ্যসহ আপনার নথি।"],
    ["/for-doctors", "আরও প্রাসঙ্গিক তথ্য। আরও তথ্যভিত্তিক সাক্ষাৎ।"],
    ["/security", "অনুমতি এই সেবারই অংশ।"],
    ["/privacy", "আপনার তথ্য, সহজ ভাষায়।"],
    ["/terms", "নিয়ন্ত্রিত প্রাথমিক সংস্করণের ব্যবহারের শর্ত।"],
  ] as const;
  for (const [path, expectedText] of publicPages) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    if (expectedText === "মোবাইল নম্বর") {
      await expect(
        page.getByRole("textbox", { name: /মোবাইল নম্বর/ }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", { name: expectedText }),
      ).toBeVisible();
    }
  }

  const workspacePages: [
    "PATIENT" | "DOCTOR" | "ADMIN",
    string,
    string,
  ][] = [
    ["PATIENT", "/patient/dashboard", "আবার স্বাগতম"],
    ["PATIENT", "/patient/records", "আমার চিকিৎসা-নথি"],
    ["PATIENT", "/patient/records/upload", "নথি আপলোড"],
    ["PATIENT", "/patient/timeline", "চিকিৎসার সময়রেখা"],
    ["PATIENT", "/patient/ai-assistant", "এআই চিকিৎসা-সহকারী"],
    ["PATIENT", "/patient/doctor-access", "চিকিৎসকের প্রবেশাধিকার"],
    ["PATIENT", "/patient/doctor-records", "চিকিৎসকের যোগ করা নথি"],
    ["PATIENT", "/patient/profile", "প্রোফাইল"],
    ["PATIENT", "/patient/settings", "সেটিংস"],
    ["DOCTOR", "/doctor/dashboard", "সারসংক্ষেপ"],
    ["DOCTOR", "/doctor/requests", "প্রবেশাধিকারের অনুরোধ"],
    ["DOCTOR", "/doctor/patients", "অনুমোদিত রোগী"],
    ["DOCTOR", "/doctor/history", "চিকিৎসার ইতিহাস"],
    ["DOCTOR", "/doctor/ai-assistant", "এআই চিকিৎসা-ইতিহাস"],
    ["DOCTOR", "/doctor/encounters", "বহির্বিভাগীয় সাক্ষাৎ"],
    ["DOCTOR", "/doctor/upload", "নথি আপলোড"],
    ["DOCTOR", "/doctor/profile", "প্রোফাইল"],
    ["DOCTOR", "/doctor/settings", "সেটিংস"],
    ["ADMIN", "/admin/dashboard", "সারসংক্ষেপ"],
    ["ADMIN", "/admin/users", "ব্যবহারকারী"],
    ["ADMIN", "/admin/doctors", "চিকিৎসক নিবন্ধন"],
    ["ADMIN", "/admin/organizations", "প্রতিষ্ঠান"],
    ["ADMIN", "/admin/audit", "নিরীক্ষা-লগ"],
    ["ADMIN", "/admin/system", "সিস্টেমের অবস্থা"],
    ["ADMIN", "/admin/settings", "সেটিংস"],
  ];
  let currentRole: "PATIENT" | "DOCTOR" | "ADMIN" | null = null;
  for (const [role, path, expectedTitle] of workspacePages) {
    if (role !== currentRole) {
      activeRole = role;
      await page.goto(path);
      currentRole = role;
    } else {
      const menuToggle = page.getByRole("button", {
        name: "মেনু খুলুন বা বন্ধ করুন",
      });
      if (await menuToggle.isVisible()) await menuToggle.click();
      await page.locator(`nav a[href="${path}"]`).click();
    }
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    if (path.endsWith("/dashboard") && role === "PATIENT") {
      await expect(page.locator("main h1")).toContainText(expectedTitle);
    } else {
      await expect(
        page.getByRole("heading", { level: 1, name: expectedTitle }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "ভাষা ইংরেজিতে পরিবর্তন করুন" }),
    ).toBeVisible();
  }
});
