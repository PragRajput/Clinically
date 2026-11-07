import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { appointmentUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("appointments.manage");
    const { id } = await params;
    const data = appointmentUpdateSchema.parse(await req.json());
    await connectDB();

    const update: Record<string, unknown> = {};
    if (data.status) update.status = data.status;
    if (data.reason !== undefined) update.reason = data.reason;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.durationMins) update.durationMins = data.durationMins;
    if (data.scheduledAt) update.scheduledAt = new Date(data.scheduledAt);

    const appt = await Appointment.findByIdAndUpdate(id, update, {
      returnDocument: "after",
    }).lean();
    if (!appt) throw new ApiError(404, "Appointment not found");
    return ok(serialize(appt));
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("appointments.manage");
    const { id } = await params;
    await connectDB();
    await Appointment.findByIdAndDelete(id);
    return ok({ deleted: true });
  });
}
