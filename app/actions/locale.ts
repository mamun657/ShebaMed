"use server";

import { cookies } from "next/headers";

export async function saveLocale(locale: "en" | "bn") {
  if (locale !== "en" && locale !== "bn")
    throw new Error("Unsupported language preference");

  (await cookies()).set("shebamed_locale", locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
