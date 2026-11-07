import Link from "next/link";
import { ClipboardList, Plus, ChevronRight, Pill } from "lucide-react";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { Visit } from "@/models/Visit";
import { Patient } from "@/models/Patient";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/utils";
import { PageHeader, Avatar, EmptyState, Badge, paymentBadge } from "@/components/ui";
import SearchBox from "@/components/SearchBox";
import type { VisitVM } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const user = (await getCurrentUser())!;
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status) filter["billing.status"] = status;
  if (q) {
    const matches = await Patient.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();
    filter.$or = [
      { invoiceNo: { $regex: q, $options: "i" } },
      { patient: { $in: matches.map((m) => m._id) } },
    ];
  }

  const visits = serialize(
    await Visit.find(filter)
      .populate("patient", "name code")
      .populate("doctor", "name")
      .sort({ date: -1 })
      .limit(200)
      .lean()
  ) as unknown as VisitVM[];

  const statuses = [
    { key: "", label: "All" },
    { key: "unpaid", label: "Unpaid" },
    { key: "partial", label: "Partial" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <div>
      <PageHeader
        title="Visits"
        subtitle="All recorded visits and invoices."
        action={
          can(user.role, "visits.manage") && (
            <Link href="/visits/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Record visit
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox placeholder="Search patient or invoice no…" />
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {statuses.map((s) => (
            <Link
              key={s.key}
              href={`/visits${s.key ? `?status=${s.key}` : ""}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                (status || "") === s.key
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {visits.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No visits found"
          description="Record a visit to start building patient history."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Doctor</th>
                <th className="px-5 py-3 font-medium">Diagnosis</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/visits/${v._id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar name={v.patient?.name || "—"} />
                      <span className="font-medium text-slate-800">
                        {v.patient?.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {v.invoiceNo}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(v.date)}</td>
                  <td className="px-5 py-3 text-slate-600">{v.doctor?.name}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {v.diagnosis || "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">
                    {formatMoney(v.billing.total)}
                  </td>
                  <td className="px-5 py-3">{paymentBadge(v.billing.status)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/visits/${v._id}`}
                      className="text-brand-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="divide-y divide-slate-100 md:hidden">
            {visits.map((v) => (
              <Link
                key={v._id}
                href={`/visits/${v._id}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar name={v.patient?.name || "—"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">
                    {v.patient?.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(v.date)} · {v.invoiceNo}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {v.prescriptions.length > 0 && (
                      <Badge tone="violet">
                        <Pill className="h-3 w-3" />
                        {v.prescriptions.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">
                    {formatMoney(v.billing.total)}
                  </p>
                  {paymentBadge(v.billing.status)}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
