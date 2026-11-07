import Link from "next/link";
import { UserPlus, Users, Phone, ChevronRight, Droplet, Download } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { serialize } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ageFromDob, formatDate } from "@/lib/utils";
import { PageHeader, Avatar, EmptyState, Badge } from "@/components/ui";
import SearchBox from "@/components/SearchBox";
import type { PatientVM } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = (await getCurrentUser())!;
  await connectDB();

  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
          { code: { $regex: q, $options: "i" } },
        ],
      }
    : {};
  const patients = serialize(
    await Patient.find(filter).sort({ createdAt: -1 }).limit(200).lean()
  ) as unknown as PatientVM[];

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Search, register and manage patient records."
        action={
          <div className="flex gap-2">
            <a href="/api/export/patients" download className="btn-outline">
              <Download className="h-4 w-4" /> Export
            </a>
            {can(user.role, "patients.manage") && (
              <Link href="/patients/new" className="btn-primary">
                <UserPlus className="h-4 w-4" /> New patient
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-4">
        <SearchBox placeholder="Search by name, phone or ID…" />
      </div>

      {patients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={q ? "No patients match your search" : "No patients yet"}
          description={
            q
              ? "Try a different name, phone number or patient ID."
              : "Register your first patient to get started."
          }
          action={
            can(user.role, "patients.manage") && (
              <Link href="/patients/new" className="btn-primary">
                <UserPlus className="h-4 w-4" /> New patient
              </Link>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Age / Gender</th>
                <th className="px-5 py-3 font-medium">Blood</th>
                <th className="px-5 py-3 font-medium">Registered</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/patients/${p._id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar name={p.name} />
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        {!p.active && (
                          <span className="text-xs text-slate-400">Archived</span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {p.code}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.phone}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {ageFromDob(p.dob) ?? "—"}
                    {p.gender ? ` · ${p.gender[0].toUpperCase()}` : ""}
                  </td>
                  <td className="px-5 py-3">
                    {p.bloodGroup ? (
                      <Badge tone="rose">{p.bloodGroup}</Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/patients/${p._id}`}
                      className="text-brand-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {patients.map((p) => (
              <Link
                key={p._id}
                href={`/patients/${p._id}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar name={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{p.name}</p>
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono">{p.code}</span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {p.phone}
                    </span>
                  </p>
                </div>
                {p.bloodGroup && (
                  <span className="inline-flex items-center gap-1 text-xs text-rose-600">
                    <Droplet className="h-3 w-3" />
                    {p.bloodGroup}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
