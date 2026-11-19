import Link from "next/link";
import { Localize, LocaleSwitcher } from "@/lib/i18n";
export default function NotFound() {
  return (
    <Localize>
    <main className="info-page">
      <LocaleSwitcher />
      <h1>Page not found.</h1>
      <p>This page is not part of your medical history.</p>
      <Link className="button primary" href="/">
        Return home
      </Link>
    </main>
    </Localize>
  );
}
