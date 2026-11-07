import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "staff.manage")) redirect("/dashboard");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Clinic settings"
        subtitle="Branding and billing defaults used across the app and on invoices."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}
