import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { Appointment } from "@/models/Appointment";
import { patientSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === "") continue;
    out[k] = v;
  }
  return out as T;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("patients.view");
    const { id } = await params;
    await connectDB();
    const patient = await Patient.findById(id).lean();
    if (!patient) throw new ApiError(404, "Patient not found");
    return ok(serialize(patient));
  });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("patients.manage");
    const { id } = await params;
    const data = patientSchema.parse(await req.json());
    await connectDB();
    const patient = await Patient.findByIdAndUpdate(
      id,
      {
        ...clean(data),
        emergencyContact: data.emergencyContact || {},
        allergies: data.allergies?.filter(Boolean) || [],
        chronicConditions: data.chronicConditions?.filter(Boolean) || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!patient) throw new ApiError(404, "Patient not found");
    return ok(serialize(patient));
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("patients.delete");
    const { id } = await params;
    await connectDB();
    const hasVisits = await Visit.exists({ patient: id });
    if (hasVisits) {
      // Don't hard-delete clinical history — archive instead.
      await Patient.findByIdAndUpdate(id, { active: false });
      return ok({ archived: true });
    }
    await Appointment.deleteMany({ patient: id });
    await Patient.findByIdAndDelete(id);
    return ok({ deleted: true });
  });
}
