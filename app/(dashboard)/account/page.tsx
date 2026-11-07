import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { PageHeader, Badge } from "@/components/ui";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = (await getCurrentUser())!;
  await connectDB();
  const doc = serialize(
    await User.findById(session.id).select("name email phone role").lean()
  ) as { name: string; email: string; phone?: string; role: Role } | null;

  const initial = {
    name: doc?.name || session.name,
    email: doc?.email || session.email,
    phone: doc?.phone || "",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="My account"
        subtitle="Manage your profile and password."
        action={<Badge tone="violet">{ROLE_LABELS[session.role as Role]}</Badge>}
      />
      <AccountForm initial={initial} />
    </div>
  );
}
