import { NextRequest } from "next/server";
import { handle, ok, requireUser, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signSession, setSessionCookie } from "@/lib/auth";
import { accountSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const me = await requireUser();
    const data = accountSchema.parse(await req.json());
    await connectDB();

    const user = await User.findById(me.id);
    if (!user) throw new ApiError(404, "Account not found");

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new ApiError(400, "Enter your current password to change it");
      }
      const valid = await verifyPassword(
        data.currentPassword,
        user.passwordHash
      );
      if (!valid) throw new ApiError(400, "Current password is incorrect");
      user.passwordHash = await hashPassword(data.newPassword);
    }
    if (data.name) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone || undefined;
    await user.save();

    // Refresh the session cookie so the new name shows immediately.
    await setSessionCookie(
      await signSession({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      })
    );

    return ok({ name: user.name });
  });
}
