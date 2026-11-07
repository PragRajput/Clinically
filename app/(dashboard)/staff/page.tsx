import { redirect } from "next/navigation";
import { UserCog, Mail, Phone } from "lucide-react";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { can, ROLE_LABELS, type Role } from "@/lib/permissions";
import { PageHeader, Avatar, Badge } from "@/components/ui";
import StaffDialog from "@/components/forms/StaffDialog";
import ConfirmButton from "@/components/ConfirmButton";
import type { StaffVM } from "@/lib/types";

export const dynamic = "force-dynamic";

const roleTone: Record<Role, "blue" | "violet" | "slate"> = {
  admin: "violet",
  doctor: "blue",
  receptionist: "slate",
};

export default async function StaffPage() {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "staff.view")) redirect("/dashboard");
  await connectDB();
  const staff = serialize(
    await User.find().select("-passwordHash").sort({ createdAt: 1 }).lean()
  ) as unknown as StaffVM[];

  return (
    <div>
      <PageHeader
        title="Staff & roles"
        subtitle="Manage who can access the clinic dashboard and what they can do."
        action={<StaffDialog trigger="new" />}
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">
                Contact
              </th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((m) => (
              <tr key={m._id} className={m.active ? "" : "opacity-60"}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} />
                    <div>
                      <p className="font-medium text-slate-800">{m.name}</p>
                      {m.specialization && (
                        <p className="text-xs text-slate-400">
                          {m.specialization}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hidden px-5 py-3 text-slate-600 md:table-cell">
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {m.email}
                  </p>
                  {m.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Phone className="h-3 w-3" />
                      {m.phone}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={roleTone[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                </td>
                <td className="px-5 py-3">
                  {m.active ? (
                    <Badge tone="green">Active</Badge>
                  ) : (
                    <Badge tone="slate">Inactive</Badge>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <StaffDialog member={m} trigger="edit" />
                    {m.active && m._id !== user.id && (
                      <ConfirmButton
                        url={`/api/staff/${m._id}`}
                        message={`Deactivate ${m.name}? They won't be able to sign in.`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <span className="sr-only">Deactivate</span>✕
                      </ConfirmButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RoleCard
          role="admin"
          desc="Full access: staff, services, clinical records, billing and reports."
        />
        <RoleCard
          role="doctor"
          desc="Manage patients, appointments and clinical visits with prescriptions."
        />
        <RoleCard
          role="receptionist"
          desc="Register patients, schedule appointments and collect payments."
        />
      </div>
    </div>
  );
}

function RoleCard({ role, desc }: { role: Role; desc: string }) {
  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center gap-2">
        <UserCog className="h-4 w-4 text-brand-600" />
        <h3 className="font-semibold text-slate-800">{ROLE_LABELS[role]}</h3>
      </div>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}
