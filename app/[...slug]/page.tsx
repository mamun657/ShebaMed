import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Workspace } from "@/components/workspace";
import { InfoPage, infoSlugs } from "@/components/info-page";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug[0] === "login") return <AuthForm mode="login" />;
  if (slug[0] === "register")
    return (
      <AuthForm
        mode="register"
        initialRole={
          slug[1] === "doctor"
            ? "DOCTOR"
            : slug[1] === "pharmacy"
              ? "PHARMACY"
              : "PATIENT"
        }
      />
    );
  if (["recover-account", "reset-password"].includes(slug[0]))
    return <AuthForm mode="recover" />;
  if (infoSlugs.includes(slug[0])) return <InfoPage slug={slug[0]} />;
  if (["patient", "doctor", "pharmacy", "admin"].includes(slug[0]))
    return <Workspace role={slug[0]} path={slug.slice(1)} />;
  notFound();
}
