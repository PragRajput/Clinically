"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  Loader2,
  Repeat,
} from "lucide-react";
import { initials } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import type { SessionUser } from "@/lib/session";

const DEV = process.env.NODE_ENV !== "production";

const SWITCH = [
  { role: "admin" as Role, label: "Administrator", icon: ShieldCheck },
  { role: "doctor" as Role, label: "Doctor", icon: Stethoscope },
  { role: "receptionist" as Role, label: "Receptionist", icon: ClipboardList },
];

export default function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  async function switchTo(role: Role) {
    setBusy(role);
    await fetch("/api/auth/dev-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusy("");
    setOpen(false);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-teal-100 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-brand-200/50">
          {initials(user.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-4 text-slate-700">
            {user.name}
          </span>
          <span className="block text-xs text-slate-400">
            {ROLE_LABELS[user.role as Role]}
          </span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-pop)]">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>

            <div className="p-1">
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4 text-slate-400" /> My account
              </Link>
            </div>

            {DEV && (
              <div className="border-t border-slate-100 p-1">
                <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <Repeat className="h-3 w-3" /> Switch account (testing)
                </p>
                {SWITCH.map(({ role, label, icon: Icon }) => {
                  const current = user.role === role;
                  return (
                    <button
                      key={role}
                      disabled={current || Boolean(busy)}
                      onClick={() => switchTo(role)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-default"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="flex-1">{label}</span>
                      {busy === role ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      ) : current ? (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          current
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-slate-100 p-1">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
