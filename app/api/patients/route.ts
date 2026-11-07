import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { nextSeq, formatCode } from "@/models/Counter";
import { patientSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/patients?q=  — search by name/phone/code (used by autocomplete). */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePermission("patients.view");
    await connectDB();
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } },
            { code: { $regex: q, $options: "i" } },
          ],
        }
      : {};
    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return ok(serialize(patients));
  });
}

/** Drop empty-string fields so Mongoose enum validators don't choke. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v === undefined) continue;
    out[k] = v;
  }
  return out as T;
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requirePermission("patients.manage");
    const data = patientSchema.parse(await req.json());
    await connectDB();
    const code = formatCode("P", await nextSeq("patient"));
    const patient = await Patient.create({
      ...clean(data),
      emergencyContact: data.emergencyContact
        ? clean(data.emergencyContact)
        : undefined,
      allergies: data.allergies?.filter(Boolean) || [],
      chronicConditions: data.chronicConditions?.filter(Boolean) || [],
      code,
      createdBy: user.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    return ok(serialize(patient), 201);
  });
}
