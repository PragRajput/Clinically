import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Visit, computeBilling } from "@/models/Visit";
import { Appointment } from "@/models/Appointment";
import { nextSeq, formatCode } from "@/models/Counter";
import { visitSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Strip empty strings from a vitals object → undefined. */
function cleanVitals(v?: Record<string, unknown>) {
  if (!v) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val === "" || val === undefined || val === null) continue;
    out[k] = val;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requirePermission("visits.manage");
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

    const invoiceNo = formatCode("INV", await nextSeq("invoice"), 5);
    const visit = await Visit.create({
      invoiceNo,
      patient: data.patient,
      doctor: data.doctor,
      appointment: data.appointment,
      date: data.date ? new Date(data.date) : new Date(),
      chiefComplaint: data.chiefComplaint || undefined,
      diagnosis: data.diagnosis || undefined,
      vitals: cleanVitals(data.vitals),
      services,
      prescriptions: data.prescriptions.filter((p) => p.drug),
      notes: data.notes || undefined,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      billing,
      createdBy: user.id,
    });

    // If this visit came from an appointment, mark it completed.
    if (data.appointment) {
      await Appointment.findByIdAndUpdate(data.appointment, {
        status: "completed",
        visit: visit._id,
      });
    }

    return ok(serialize(visit), 201);
  });
}
