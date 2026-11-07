import { redirect } from "next/navigation";
import {
  BarChart3,
  Receipt,
  Wallet,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getReports } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function ReportsPage() {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "reports.view")) redirect("/dashboard");
  const r = await getReports();

  const maxMonth = Math.max(
    1,
    ...r.revenueByMonth.map((m: { billed: number }) => m.billed)
  );
  const maxDoctor = Math.max(
    1,
    ...r.byDoctor.map((d: { visits: number }) => d.visits)
  );
  const maxService = Math.max(
    1,
    ...r.topServices.map((s: { revenue: number }) => s.revenue)
  );

  const collectionRate =
    r.totals.billed > 0
      ? Math.round((r.totals.collected / r.totals.billed) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title="Reports & analytics"
        subtitle="Revenue, visits and service performance at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total billed"
          value={formatMoney(r.totals.billed)}
          icon={<Receipt className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Collected"
          value={formatMoney(r.totals.collected)}
          hint={`${collectionRate}% collection rate`}
          icon={<Wallet className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(r.totals.outstanding)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Total visits"
          value={r.totals.visits}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="violet"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by month */}
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
            <BarChart3 className="h-4 w-4 text-brand-600" /> Revenue (last 6
            months)
          </h2>
          {r.revenueByMonth.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {r.revenueByMonth.map(
                (m: {
                  _id: { y: number; m: number };
                  billed: number;
                  collected: number;
                }) => (
                  <div key={`${m._id.y}-${m._id.m}`}>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>
                        {MONTHS[m._id.m - 1]} {m._id.y}
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatMoney(m.collected)}{" "}
                        <span className="text-slate-400">
                          / {formatMoney(m.billed)}
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(m.billed / maxMonth) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* Visits by doctor */}
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Visits by doctor</h2>
          {r.byDoctor.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {r.byDoctor.map(
                (d: {
                  _id: string;
                  visits: number;
                  collected: number;
                  doc?: { name?: string };
                }) => (
                  <div key={d._id}>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{d.doc?.name || "Unknown"}</span>
                      <span className="font-medium text-slate-700">
                        {d.visits} visits · {formatMoney(d.collected)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${(d.visits / maxDoctor) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* Top services */}
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-800">
            Top services by revenue
          </h2>
          {r.topServices.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-3">
              {r.topServices.map(
                (s: { _id: string; count: number; revenue: number }) => (
                  <div key={s._id}>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>
                        {s._id}{" "}
                        <span className="text-slate-400">×{s.count}</span>
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatMoney(s.revenue)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${(s.revenue / maxService) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* Payment status */}
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Payment status</h2>
          <div className="grid grid-cols-3 gap-3">
            {(["paid", "partial", "unpaid"] as const).map((status) => {
              const row = r.paymentBreakdown.find(
                (p: { _id: string }) => p._id === status
              );
              const tones = {
                paid: "text-emerald-600 bg-emerald-50",
                partial: "text-amber-600 bg-amber-50",
                unpaid: "text-rose-600 bg-rose-50",
              };
              return (
                <div
                  key={status}
                  className={`rounded-xl p-4 text-center ${tones[status]}`}
                >
                  <p className="text-2xl font-bold">{row?.count || 0}</p>
                  <p className="text-xs font-medium capitalize">{status}</p>
                  {status !== "paid" && (
                    <p className="mt-1 text-xs opacity-80">
                      {formatMoney(row?.amount || 0)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <p className="py-8 text-center text-sm text-slate-400">
      Not enough data yet.
    </p>
  );
}
