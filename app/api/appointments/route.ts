import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Patient } from "@/models/Patient";
import { appointmentSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePermission("appointments.view");
    await connectDB();
    const sp = req.nextUrl.searchParams;
    const filter: Record<string, unknown> = {};
    const date = sp.get("date");
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.scheduledAt = { $gte: start, $lt: end };
    }
    if (sp.get("doctor")) filter.doctor = sp.get("doctor");
    if (sp.get("status")) filter.status = sp.get("status");

    const appts = await Appointment.find(filter)
      .populate("patient", "name code phone")
      .populate("doctor", "name")
      .sort({ scheduledAt: 1 })
      .lean();
    return ok(serialize(appts));
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requirePermission("appointments.manage");
    const data = appointmentSchema.parse(await req.json());
    await connectDB();

    // An appointment must belong to a real, existing patient.
    const exists = await Patient.exists({ _id: data.patient });
    if (!exists) {
      throw new ApiError(400, "Select an existing patient before booking.");
    }

    const appt = await Appointment.create({
      patient: data.patient,
      doctor: data.doctor,
      scheduledAt: new Date(data.scheduledAt),
      durationMins: data.durationMins || 30,
      reason: data.reason || undefined,
      createdBy: user.id,
    });
    return ok(serialize(appt), 201);
  });
}
