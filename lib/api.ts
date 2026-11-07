import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "./auth";
import { can, type Permission } from "./permissions";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Throws 401 if not logged in, otherwise returns the user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Not authenticated");
  return user;
}

/** Throws 401/403 unless the user holds the given permission. */
export async function requirePermission(
  permission: Permission
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    throw new ApiError(403, "You don't have permission to do that");
  }
  return user;
}

/** Wrap a route handler so thrown ApiErrors become clean JSON responses. */
export function handle(
  fn: () => Promise<NextResponse | Response>
): Promise<NextResponse | Response> {
  return fn().catch((err) => {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // Surface Mongoose validation / duplicate-key errors nicely.
    const message =
      err?.code === 11000
        ? "A record with that value already exists"
        : err?.message || "Something went wrong";
    // eslint-disable-next-line no-console
    console.error("API error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  });
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Convert Mongoose lean docs / ObjectIds / Dates into plain JSON-safe values
 * so they can cross the server→client boundary.
 */
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
