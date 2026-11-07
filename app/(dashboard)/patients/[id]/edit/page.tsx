import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { serialize } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import PatientForm from "@/components/forms/PatientForm";
import type { PatientVM } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  if (!can(user.role, "patients.manage")) redirect(`/patients/${id}`);

  await connectDB();
  const doc = await Patient.findById(id).lean();
  if (!doc) notFound();
  const patient = serialize(doc) as unknown as PatientVM;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Edit ${patient.name}`}
        subtitle={`Patient ID ${patient.code}`}
      />
      <PatientForm patient={patient} />
    </div>
  );
}
