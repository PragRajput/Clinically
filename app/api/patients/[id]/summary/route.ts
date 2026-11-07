import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Compact patient overview + recent visits, used by the Record Visit form. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("visits.view");
    const { id } = await params;
    await connectDB();

    const patient = await Patient.findById(id)
      .select("name code dob gender bloodGroup allergies chronicConditions phone")
      .lean();
    if (!patient) throw new ApiError(404, "Patient not found");

    const [recentVisits, agg] = await Promise.all([
      Visit.find({ patient: id })
        .populate("doctor", "name")
        .sort({ date: -1 })
        .limit(5)
        .select("date chiefComplaint diagnosis invoiceNo billing.status doctor")
        .lean(),
      Visit.aggregate([
        { $match: { patient: patient._id } },
        {
          $group: {
            _id: null,
            totalVisits: { $sum: 1 },
            totalBalance: { $sum: "$billing.balance" },
            lastVisit: { $max: "$date" },
          },
        },
      ]),
    ]);

    const stats = agg[0] || { totalVisits: 0, totalBalance: 0, lastVisit: null };
    return ok(serialize({ patient, recentVisits, stats }));
  });
}
