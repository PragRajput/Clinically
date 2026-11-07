import Link from "next/link";
import { Receipt, Wallet, TrendingUp, CheckCircle2, Download } from "lucide-react";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { Visit } from "@/models/Visit";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/utils";
import { PageHeader, StatCard, EmptyState, Avatar, paymentBadge } from "@/components/ui";
import RecordPayment from "@/components/RecordPayment";
import type { VisitVM } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const view = filter === "all" ? "all" : "outstanding";
  const user = (await getCurrentUser())!;
  const manage = can(user.role, "billing.manage");
  await connectDB();

  const query = view === "outstanding" ? { "billing.balance": { $gt: 0 } } : {};
  const [rows, totals] = await Promise.all([
    Visit.find(query)
      .populate("patient", "name code")
      .sort({ date: -1 })
      .limit(200)
      .lean(),
    Visit.aggregate([
      {
        $group: {
          _id: null,
          billed: { $sum: "$billing.total" },
          collected: { $sum: "$billing.paid" },
          outstanding: { $sum: "$billing.balance" },
        },
      },
    ]),
  ]);

  const visits = serialize(rows) as unknown as VisitVM[];
  const t = totals[0] || { billed: 0, collected: 0, outstanding: 0 };

  return (
    <div>
      <PageHeader
        title="Billing & payments"
        subtitle="Track invoices, collections and outstanding balances."
        action={
          <a href="/api/export/visits" download className="btn-outline">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total billed"
          value={formatMoney(t.billed)}
          icon={<Receipt className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Collected"
          value={formatMoney(t.collected)}
          icon={<Wallet className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(t.outstanding)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <div className="mb-4 mt-6 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-max">
        {[
          { key: "outstanding", label: "Outstanding" },
          { key: "all", label: "All invoices" },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/billing${tab.key === "all" ? "?filter=all" : ""}`}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
              view === tab.key
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {visits.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title={
            view === "outstanding" ? "All settled up!" : "No invoices yet"
          }
          description={
            view === "outstanding"
              ? "There are no outstanding balances right now."
              : "Record a visit to generate invoices."
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">
                  Invoice
                </th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">
                  Date
                </th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium text-right">Balance</th>
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
                  <td className="hidden px-5 py-3 font-mono text-xs text-slate-500 sm:table-cell">
                    {v.invoiceNo}
                  </td>
                  <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">
                    {formatDate(v.date)}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">
                    {formatMoney(v.billing.total)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">
                    {formatMoney(v.billing.balance)}
                  </td>
                  <td className="px-5 py-3">{paymentBadge(v.billing.status)}</td>
                  <td className="px-5 py-3 text-right">
                    {manage && v.billing.balance > 0 ? (
                      <RecordPayment
                        visitId={v._id}
                        balance={v.billing.balance}
                        label="Collect"
                        variant="outline"
                      />
                    ) : (
                      <Link
                        href={`/visits/${v._id}`}
                        className="text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
