import { NextRequest } from "next/server";
import { handle, ok, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Maps a role to its seeded demo account. DEV ONLY — disabled in production.
const DEMO: Record<string, string> = {
  admin: "admin@clinically.test",
  doctor: "doctor@clinically.test",
  receptionist: "reception@clinically.test",
};

export async function POST(req: NextRequest) {
  return handle(async () => {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(404, "Not found");
    }
    const { role } = await req.json();
    const email = DEMO[role as string];
    if (!email) throw new ApiError(400, "Unknown role");

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "Demo account not found");

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
