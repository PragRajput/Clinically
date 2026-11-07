import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { Visit } from "@/models/Visit";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getDoctors, getActiveServices } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import VisitForm from "@/components/forms/VisitForm";
import type { VisitVM } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditVisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  if (!can(user.role, "visits.manage")) redirect(`/visits/${id}`);

  const [doctors, services] = await Promise.all([
    getDoctors(),
    getActiveServices(),
  ]);

  await connectDB();
  const doc = await Visit.findById(id)
    .populate("patient", "name code phone")
    .populate("doctor", "name specialization")
    .lean();
  if (!doc) notFound();
  const visit = serialize(doc) as unknown as VisitVM;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Edit visit"
        subtitle={`Invoice ${visit.invoiceNo} · ${visit.patient?.name}`}
      />
      <VisitForm doctors={doctors} services={services} visit={visit} />
    </div>
  );
}
