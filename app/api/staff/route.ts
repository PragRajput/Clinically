import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";
import { staffSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requirePermission("staff.view");
    await connectDB();
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: 1 })
      .lean();
    return ok(serialize(users));
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requirePermission("staff.manage");
    const data = staffSchema.parse(await req.json());
    if (!data.password) throw new ApiError(400, "Password is required");
    await connectDB();
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      phone: data.phone || undefined,
      specialization: data.specialization || undefined,
      passwordHash: await hashPassword(data.password),
    });
    const { passwordHash: _omit, ...obj } = user.toObject();
    void _omit;
    return ok(serialize(obj), 201);
  });
}
