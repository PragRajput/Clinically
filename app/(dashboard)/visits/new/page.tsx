import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { Patient } from "@/models/Patient";
import { Appointment } from "@/models/Appointment";
import { getDoctors, getActiveServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import VisitForm from "@/components/forms/VisitForm";
import type { PatientRef } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string; appointment?: string }>;
}) {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "visits.manage")) redirect("/visits");

  const { patient: patientId, appointment: appointmentId } = await searchParams;
  const [doctors, services, settings] = await Promise.all([
    getDoctors(),
    getActiveServices(),
    getSettings(),
  ]);

  await connectDB();
  let initialPatient: PatientRef | null = null;
  let resolvedAppointmentId = appointmentId;

  if (appointmentId) {
    const appt = await Appointment.findById(appointmentId)
      .populate("patient", "name code phone")
      .lean();
    if (appt?.patient) {
      initialPatient = serialize(appt.patient) as unknown as PatientRef;
    }
  } else if (patientId) {
    const p = await Patient.findById(patientId)
      .select("name code phone")
      .lean();
    if (p) initialPatient = serialize(p) as unknown as PatientRef;
  } else {
    resolvedAppointmentId = undefined;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Record visit"
        subtitle="Capture clinical notes, prescriptions and billing for this visit."
      />
      <VisitForm
        doctors={doctors}
        services={services}
        initialPatient={initialPatient}
        appointmentId={resolvedAppointmentId}
        defaultTaxRate={settings.taxRatePercent}
      />
    </div>
  );
}
