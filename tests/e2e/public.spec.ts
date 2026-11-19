import { test, expect } from "@playwright/test";
test("landing, registration and recovery are connected", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Your medical history, always within reach.",
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Get started free", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Start your health story." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I’m a doctor", exact: true }).click();
  await expect(
    page.getByLabel("Professional registration number", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("input[type=email]")).toHaveCount(0);
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(page.getByLabel("One-time recovery code")).toBeVisible();
});
test("pages do not overflow horizontally", async ({ page }) => {
  for (const path of ["/", "/login", "/register/doctor", "/privacy"]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
