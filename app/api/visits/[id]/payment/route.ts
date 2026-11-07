import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Visit } from "@/models/Visit";
import { paymentSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Record an additional payment against a visit's outstanding balance. */
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("billing.manage");
    const { id } = await params;
    const { amount, method } = paymentSchema.parse(await req.json());
    await connectDB();

    const visit = await Visit.findById(id);
    if (!visit) throw new ApiError(404, "Visit not found");

    const paid = Math.min(visit.billing.total, visit.billing.paid + amount);
    const balance = Math.max(0, visit.billing.total - paid);
    visit.billing.paid = paid;
    visit.billing.balance = balance;
    visit.billing.status = paid <= 0 ? "unpaid" : balance <= 0 ? "paid" : "partial";
    if (method) visit.billing.method = method;
    await visit.save();

    return ok(serialize(visit.toObject()));
  });
}
