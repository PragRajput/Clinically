import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import { serviceSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("services.manage");
    const { id } = await params;
    const data = serviceSchema.partial().parse(await req.json());
    await connectDB();
    const service = await Service.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!service) throw new ApiError(404, "Service not found");
    return ok(serialize(service));
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("services.manage");
    const { id } = await params;
    await connectDB();
    // Soft-disable so historical invoices keep their service reference.
    await Service.findByIdAndUpdate(id, { active: false });
    return ok({ archived: true });
  });
}
