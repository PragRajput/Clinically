import {
  Stethoscope,
  HeartPulse,
  ClipboardList,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { connection } from "next/server";
import { DEMO_ACCOUNTS, demoModeEnabled } from "@/lib/demo";
import LoginForm from "./LoginForm";

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "Clinically";

const HIGHLIGHTS = [
  { icon: HeartPulse, text: "Complete patient history at a glance" },
  { icon: ClipboardList, text: "Record visits, vitals & prescriptions" },
  { icon: Wallet, text: "Track payments and outstanding balances" },
];

export default async function LoginPage() {
  // Read AUTO_SEED at request time, not build time.
  await connection();
  // Only send demo credentials to the browser when demo mode is on.
  const demoAccounts = demoModeEnabled() ? DEMO_ACCOUNTS : [];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-teal-600 p-12 text-white lg:flex">
        <div className="medical-pattern pointer-events-none absolute inset-0 opacity-40" />
        <div
          className="pointer-events-none absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-20 -bottom-10 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur">
            <Stethoscope className="h-5 w-5" />
          </span>
          {clinicName}
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure clinic management
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight">
            Run your clinic,
            <br /> not your paperwork.
          </h1>
          <p className="mt-4 max-w-md text-brand-50/90">
            Patients, visits, prescriptions, appointments, billing and reports —
            all in one fast, modern dashboard.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-inset ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-brand-50/95">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-brand-100/80">
          © {new Date().getFullYear()} {clinicName}
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">{clinicName}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to your clinic dashboard.
          </p>
          <div className="mt-8">
            <LoginForm demoAccounts={demoAccounts} />
          </div>
        </div>
      </div>
    </div>
  );
}
