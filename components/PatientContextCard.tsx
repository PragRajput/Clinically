"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  ShieldAlert,
  ClipboardList,
  Wallet,
  ExternalLink,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import { ageFromDob, formatDate, formatMoney } from "@/lib/utils";
import { Avatar, Badge, paymentBadge } from "./ui";

type RecentVisit = {
  _id: string;
  date: string;
  chiefComplaint?: string;
  diagnosis?: string;
  invoiceNo: string;
  billing?: { status?: string };
  doctor?: { name?: string };
};

type Summary = {
  patient: {
    _id: string;
    name: string;
    code: string;
    dob?: string;
    gender?: string;
    bloodGroup?: string;
    allergies: string[];
    chronicConditions: string[];
  };
  recentVisits: RecentVisit[];
  stats: { totalVisits: number; totalBalance: number; lastVisit: string | null };
};

export default function PatientContextCard({
  patientId,
}: {
  patientId: string;
}) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/patients/${patientId}/summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setData(d))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [patientId]);

  if (loading) {
    return (
      <div className="card mb-4 flex items-center gap-2 p-5 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading patient history…
      </div>
    );
  }
  if (!data) return null;

  const { patient: p, recentVisits, stats } = data;
  const age = ageFromDob(p.dob);
  const last = recentVisits[0];
  const older = recentVisits.slice(1);

  return (
    <div className="card mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-brand-50/60 to-teal-50/40 px-5 py-4">
        <Avatar name={p.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-800">{p.name}</span>
            <span className="font-mono text-xs text-slate-400">{p.code}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {age !== null && <Badge>{age} yrs</Badge>}
            {p.gender && <Badge>{p.gender}</Badge>}
            {p.bloodGroup && <Badge tone="rose">{p.bloodGroup}</Badge>}
            {p.chronicConditions.slice(0, 2).map((c) => (
              <Badge key={c} tone="amber">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <a
          href={`/patients/${p._id}`}
          target="_blank"
          rel="noreferrer"
          className="btn-outline"
        >
          <ExternalLink className="h-4 w-4" /> Full history
        </a>
      </div>

      {/* Allergy safety banner */}
      {p.allergies.length > 0 && (
        <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-2.5 text-sm text-rose-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            <strong>Allergies:</strong> {p.allergies.join(", ")}
          </span>
        </div>
      )}

      <div className="grid gap-4 p-5 md:grid-cols-3">
        {/* Last visit */}
        <div className="md:col-span-2">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <CalendarClock className="h-3.5 w-3.5" /> Last visit
          </p>
          {last ? (
            <a
              href={`/visits/${last._id}`}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-slate-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {formatDate(last.date)}
                </span>
                <div className="flex items-center gap-2">
                  {last.billing?.status &&
                    paymentBadge(last.billing.status)}
                  <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                </div>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {last.diagnosis || last.chiefComplaint || "No notes recorded"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {last.doctor?.name}
                {last.chiefComplaint && last.diagnosis
                  ? ` · ${last.chiefComplaint}`
                  : ""}
              </p>
            </a>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-400">
              First visit for this patient.
            </p>
          )}

          {older.length > 0 && (
            <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {older.map((v) => (
                <a
                  key={v._id}
                  href={`/visits/${v._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <span className="w-24 shrink-0 text-slate-500">
                    {formatDate(v.date)}
                  </span>
                  <span className="flex-1 truncate text-slate-700">
                    {v.diagnosis || v.chiefComplaint || "—"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <ClipboardList className="h-3.5 w-3.5" /> Total visits
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-800">
              {stats.totalVisits}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Wallet className="h-3.5 w-3.5" /> Outstanding
            </p>
            <p
              className={`mt-0.5 text-lg font-bold ${
                stats.totalBalance > 0 ? "text-rose-600" : "text-slate-800"
              }`}
            >
              {formatMoney(stats.totalBalance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
