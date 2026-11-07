import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./permissions";

// Edge-safe session helpers (no next/headers import) so they can run in
// middleware as well as in Node route handlers.

export const SESSION_COOKIE = "clinically_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const DEV_FALLBACK_SECRET = "dev-secret-change-me";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    // The fallback is public (it's in the repo), so anyone could forge a
    // session with it. Refuse to run in production without a real secret.
    if (!secret || secret === DEV_FALLBACK_SECRET || secret.length < 32) {
      throw new Error(
        "AUTH_SECRET must be set to a random string of at least 32 characters in production " +
          "(generate one with: openssl rand -base64 32)"
      );
    }
    return new TextEncoder().encode(secret);
  }
  return new TextEncoder().encode(secret || DEV_FALLBACK_SECRET);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  // Resolved outside the try so a missing secret fails loudly instead of
  // silently looking like "not logged in".
  const key = secretKey();
  try {
    const { payload } = await jwtVerify(token, key);
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
