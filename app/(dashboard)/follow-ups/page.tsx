import Link from "next/link";
import { CalendarClock, CalendarPlus, Stethoscope, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getFollowUps } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { PageHeader, Avatar, EmptyState, Badge } from "@/components/ui";
import type { VisitVM } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const user = (await getCurrentUser())!;
  const visits = await getFollowUps();

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(startToday);
  endToday.setDate(endToday.getDate() + 1);
  const weekEnd = new Date(startToday);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const groups: { key: string; label: string; tone: "rose" | "blue" | "amber" | "slate"; items: VisitVM[] }[] = [
    { key: "overdue", label: "Overdue", tone: "rose", items: [] },
    { key: "today", label: "Today", tone: "blue", items: [] },
    { key: "week", label: "This week", tone: "amber", items: [] },
    { key: "later", label: "Upcoming", tone: "slate", items: [] },
  ];

  for (const v of visits) {
    const d = new Date(v.followUpDate!);
    if (d < startToday) groups[0].items.push(v);
    else if (d < endToday) groups[1].items.push(v);
    else if (d < weekEnd) groups[2].items.push(v);
    else groups[3].items.push(v);
  }

  const total = visits.length;
  const canBook = can(user.role, "appointments.manage");
  const canVisit = can(user.role, "visits.manage");

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        subtitle="Patients with a recommended follow-up coming up (next 60 days)."
      />

      {total === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="No follow-ups pending"
          description="When you set a follow-up date on a visit, it will appear here."
        />
      ) : (
        <div className="space-y-6">
          {groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <section key={g.key} className="card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  <h2 className="font-semibold text-slate-800">{g.label}</h2>
                  <Badge tone={g.tone}>{g.items.length}</Badge>
                </div>
                <div className="divide-y divide-slate-100">
                  {g.items.map((v) => (
                    <div
                      key={v._id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <Avatar name={v.patient?.name || "—"} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/patients/${v.patient?._id}`}
                          className="font-medium text-slate-800 hover:underline"
                        >
                          {v.patient?.name}
                        </Link>
                        <p className="truncate text-xs text-slate-400">
                          {v.diagnosis || "Follow-up"} · {v.doctor?.name}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-slate-600">
                        {formatDate(v.followUpDate)}
                      </div>
                      <div className="flex gap-1">
                        {canBook && (
                          <Link
                            href={`/appointments?patient=${v.patient?._id}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                            title="Book appointment"
                          >
                            <CalendarPlus className="h-4 w-4" />
                          </Link>
                        )}
                        {canVisit && (
                          <Link
                            href={`/visits/new?patient=${v.patient?._id}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                            title="Record visit"
                          >
                            <Stethoscope className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
