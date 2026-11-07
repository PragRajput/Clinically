import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";
import { staffSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("staff.manage");
    const { id } = await params;
    const data = staffSchema.partial().parse(await req.json());
    await connectDB();

    const update: Record<string, unknown> = {};
    if (data.name) update.name = data.name;
    if (data.email) update.email = data.email.toLowerCase();
    if (data.role) update.role = data.role;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.specialization !== undefined)
      update.specialization = data.specialization;
    if (typeof data.active === "boolean") update.active = data.active;
    if (data.password) update.passwordHash = await hashPassword(data.password);

    const user = await User.findByIdAndUpdate(id, update, { returnDocument: "after" })
      .select("-passwordHash")
      .lean();
    if (!user) throw new ApiError(404, "Staff member not found");
    return ok(serialize(user));
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const me = await requirePermission("staff.manage");
    const { id } = await params;
    if (me.id === id) throw new ApiError(400, "You can't deactivate yourself");
    await connectDB();
    await User.findByIdAndUpdate(id, { active: false });
    return ok({ archived: true });
  });
}
