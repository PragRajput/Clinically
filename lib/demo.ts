/**
 * Demo mode: seeds demo accounts + sample data into an empty database and
 * lists those accounts on the login page.
 *
 * On by default in development; in production it's off unless AUTO_SEED=true
 * (e.g. for a public demo deployment). AUTO_SEED=false always disables it.
 */
export function demoModeEnabled(): boolean {
  const flag = process.env.AUTO_SEED;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/** Must match the accounts created in lib/seed.ts. */
export const DEMO_ACCOUNTS = [
  { role: "Administrator", email: "admin@clinically.test", password: "admin123" },
  { role: "Doctor", email: "doctor@clinically.test", password: "doctor123" },
  { role: "Receptionist", email: "reception@clinically.test", password: "reception123" },
];

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];
