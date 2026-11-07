import Link from "next/link";
import {
  Users,
  ClipboardList,
  Wallet,
  TrendingUp,
  CalendarDays,
  Plus,
  UserPlus,
  ChevronRight,
  CalendarClock,
  Cake,
  BarChart3,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { formatMoney, formatDate } from "@/lib/utils";
import { StatCard, Avatar, paymentBadge, apptBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const s = await getDashboardStats();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const firstName = user.name.replace(/^Dr\.?\s*/i, "").split(" ")[0];

  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600 p-6 text-white shadow-[var(--shadow-soft)] sm:p-7">
        <div className="medical-pattern pointer-events-none absolute inset-0 opacity-40" />
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-100/90">
              {dateStr}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting}, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-brand-50/90">
              Here&apos;s what&apos;s happening at your clinic today.
            </p>
          </div>
          <div className="flex gap-2">
            {can(user.role, "patients.manage") && (
              <Link
                href="/patients/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur transition-colors hover:bg-white/25"
              >
                <UserPlus className="h-4 w-4" /> New patient
              </Link>
            )}
            {can(user.role, "visits.manage") && (
              <Link
                href="/visits/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" /> Record visit
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active patients"
          value={s.patientsCount}
          icon={<Users className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Visits today"
          value={s.visitsTodayCount}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label="Collected today"
          value={formatMoney(s.revenueToday)}
          hint={`${formatMoney(s.revenueMonth)} this month`}
          icon={<Wallet className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(s.outstanding)}
          hint="Across all unpaid invoices"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {/* Collections chart + coming up */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
            <BarChart3 className="h-4 w-4 text-brand-600" /> Collections — last 7
            days
          </h2>
          <RevenueBars data={s.revenue7d} />
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Coming up</h2>
          <Link
            href="/follow-ups"
            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">
                {s.followUpsDueCount} follow-up
                {s.followUpsDueCount === 1 ? "" : "s"} due
              </p>
              <p className="text-xs text-slate-400">Within the next 7 days</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>

          <div className="mt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Cake className="h-3.5 w-3.5" /> Birthdays today
            </p>
            {s.birthdays.length === 0 ? (
              <p className="text-sm text-slate-400">No birthdays today.</p>
            ) : (
              <ul className="space-y-1.5">
                {s.birthdays.map((b) => (
                  <li key={b._id}>
                    <Link
                      href={`/patients/${b._id}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-600"
                    >
                      🎂 <span className="font-medium">{b.name}</span>
                      <span className="text-xs text-slate-400">{b.code}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's appointments */}
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <CalendarDays className="h-4 w-4 text-brand-600" /> Today's
              appointments
            </h2>
            <Link
              href="/appointments"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {s.todaysAppointments.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                No appointments scheduled for today.
              </p>
            )}
            {s.todaysAppointments.map((a) => (
              <div key={a._id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-16 shrink-0 text-sm font-semibold text-slate-700">
                  {new Date(a.scheduledAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                <Avatar name={a.patient?.name || "—"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {a.patient?.name}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {a.reason || "Consultation"} · {a.doctor?.name}
                  </p>
                </div>
                {apptBadge(a.status)}
              </div>
            ))}
          </div>
        </section>

        {/* Recent visits */}
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <ClipboardList className="h-4 w-4 text-brand-600" /> Recent visits
            </h2>
            <Link
              href="/visits"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {s.recentVisits.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                No visits recorded yet.
              </p>
            )}
            {s.recentVisits.map((v) => (
              <Link
                key={v._id}
                href={`/visits/${v._id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
              >
                <Avatar name={v.patient?.name || "—"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {v.patient?.name}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {formatDate(v.date)} · {v.diagnosis || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">
                    {formatMoney(v.billing.total)}
                  </p>
                  {paymentBadge(v.billing.status)}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function RevenueBars({
  data,
}: {
  data: { label: string; date: string; total: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex h-40 items-end justify-between gap-2">
      {data.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="group relative w-full rounded-t-md bg-brand-500/90 transition-all hover:bg-brand-600"
              style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }}
              title={formatMoney(d.total)}
            >
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {formatMoney(d.total)}
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
