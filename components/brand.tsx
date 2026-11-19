import Link from "next/link";
import { Cross } from "lucide-react";
import { Localize } from "@/lib/i18n";
export function Brand() {
  return (
    <Localize>
    <Link className="brand" href="/">
      <Cross size={34} strokeWidth={2.8} />
      <span>
        Sheba<span>Med</span>
        <small>YOUR HEALTH, CONNECTED</small>
      </span>
    </Link>
    </Localize>
  );
}
