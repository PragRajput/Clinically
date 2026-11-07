import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Visit, computeBilling } from "@/models/Visit";
import { visitSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function cleanVitals(v?: Record<string, unknown>) {
  if (!v) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === "" || val === undefined || val === null) continue;
    out[k] = val;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("visits.manage");
    const { id } = await params;
    const data = visitSchema.parse(await req.json());
    await connectDB();

    const services = data.services.map((s) => ({
      service: s.service,
      name: s.name,
      price: Number(s.price),
      qty: Number(s.qty || 1),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any[];
    const billing = computeBilling({
      services,
      discount: data.discount,
      tax: data.tax,
      paid: data.paid,
      method: data.method,
    });

    const visit = await Visit.findByIdAndUpdate(
      id,
      {
        patient: data.patient,
        doctor: data.doctor,
        date: data.date ? new Date(data.date) : new Date(),
        chiefComplaint: data.chiefComplaint || undefined,
        diagnosis: data.diagnosis || undefined,
        vitals: cleanVitals(data.vitals),
        services,
        prescriptions: data.prescriptions.filter((p) => p.drug),
        notes: data.notes || undefined,
        followUpDate: data.followUpDate
          ? new Date(data.followUpDate)
          : undefined,
        billing,
      },
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!visit) throw new ApiError(404, "Visit not found");
    return ok(serialize(visit));
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("visits.delete");
    const { id } = await params;
    await connectDB();
    const visit = await Visit.findByIdAndDelete(id);
    if (!visit) throw new ApiError(404, "Visit not found");
    return ok({ deleted: true });
  });
}
