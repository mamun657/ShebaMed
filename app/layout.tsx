import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import "./globals.css";
import { cookies } from "next/headers";
import { LocaleProvider, type Locale } from "@/lib/i18n";
export const metadata: Metadata = {
  title: "ShebaMed — Your medical history, always within reach",
  description:
    "A patient-controlled outpatient medical record platform. Organize your records, explore your history, and securely collaborate with your doctor.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const savedLocale = (await cookies()).get("shebamed_locale")?.value;
  const locale: Locale = savedLocale === "bn" ? "bn" : "en";
  return (
    <html
      lang={locale === "bn" ? "bn" : "en"}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
