import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import PatientForm from "@/components/forms/PatientForm";

export default async function NewPatientPage() {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "patients.manage")) redirect("/patients");
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New patient"
        subtitle="Register a new patient record."
      />
      <PatientForm />
    </div>
  );
}
