import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { Appointment } from "@/models/Appointment";
import { Patient } from "@/models/Patient";
import { getCurrentUser } from "@/lib/auth";
import { getDoctors } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { toDateInput, formatDate } from "@/lib/utils";
import { PageHeader, Avatar, EmptyState, apptBadge } from "@/components/ui";
import AppointmentDialog from "@/components/forms/AppointmentDialog";
import AppointmentActions from "@/components/AppointmentActions";
import type { AppointmentVM, PatientRef } from "@/lib/types";

export const dynamic = "force-dynamic";

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; patient?: string }>;
}) {
  const { date, patient: patientId } = await searchParams;
  const user = (await getCurrentUser())!;
  const day = date || toDateInput(new Date());

  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  await connectDB();
  const [doctors, appts, prefillPatientDoc] = await Promise.all([
    getDoctors(),
    Appointment.find({ scheduledAt: { $gte: start, $lt: end } })
      .populate("patient", "name code phone")
      .populate("doctor", "name")
      .sort({ scheduledAt: 1 })
      .lean(),
    patientId
      ? Patient.findById(patientId).select("name code phone").lean()
      : null,
  ]);

  const appointments = serialize(appts) as unknown as AppointmentVM[];
  const prefillPatient = prefillPatientDoc
    ? (serialize(prefillPatientDoc) as unknown as PatientRef)
    : null;
  const isToday = day === toDateInput(new Date());

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Schedule and track patient appointments."
        action={
          can(user.role, "appointments.manage") && (
            <AppointmentDialog
              doctors={doctors}
              initialPatient={prefillPatient}
              defaultDate={day}
              openByDefault={Boolean(patientId)}
            />
          )
        }
      />

      {/* Date navigator */}
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/appointments?date=${shiftDate(day, -1)}`}
          className="btn-outline px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          <CalendarDays className="h-4 w-4 text-brand-600" />
          {formatDate(day)}
          {isToday && (
            <span className="rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-700">
              Today
            </span>
          )}
        </div>
        <Link
          href={`/appointments?date=${shiftDate(day, 1)}`}
          className="btn-outline px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
        {!isToday && (
          <Link href="/appointments" className="btn-ghost text-sm">
            Today
          </Link>
        )}
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No appointments"
          description={`Nothing scheduled for ${formatDate(day)}.`}
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {appointments.map((a) => (
            <div key={a._id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
              <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50 py-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="mt-0.5 text-sm font-semibold text-slate-700">
                  {new Date(a.scheduledAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <Avatar name={a.patient?.name || "—"} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/patients/${a.patient?._id}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {a.patient?.name}
                </Link>
                <p className="truncate text-xs text-slate-400">
                  {a.reason || "Consultation"} · {a.doctor?.name} ·{" "}
                  {a.durationMins} min
                </p>
              </div>
              {apptBadge(a.status)}
              <AppointmentActions
                id={a._id}
                status={a.status}
                canManage={can(user.role, "appointments.manage")}
                canVisit={can(user.role, "visits.manage")}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
