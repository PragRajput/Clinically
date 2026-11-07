import { NextRequest } from "next/server";
import { handle, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/password";
import { signSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const { email, password } = loginSchema.parse(await req.json());
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.active) {
      throw new ApiError(401, "Invalid email or password");
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid email or password");

    const session = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    await setSessionCookie(await signSession(session));
    return ok({ user: session });
  });
}
