"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  Receipt,
  ListChecks,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { can, ROLE_LABELS, type Permission, type Role } from "@/lib/permissions";
import type { SessionUser } from "@/lib/session";
import GlobalSearch from "./GlobalSearch";
import UserMenu from "./UserMenu";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perm?: Permission;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users, perm: "patients.view" },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, perm: "appointments.view" },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock, perm: "visits.view" },
  { href: "/visits", label: "Visits", icon: ClipboardList, perm: "visits.view" },
  { href: "/billing", label: "Billing", icon: Receipt, perm: "billing.view" },
  { href: "/services", label: "Services", icon: ListChecks, perm: "services.view" },
  { href: "/staff", label: "Staff", icon: UserCog, perm: "staff.view" },
  { href: "/reports", label: "Reports", icon: BarChart3, perm: "reports.view" },
  { href: "/settings", label: "Settings", icon: Settings, perm: "staff.manage" },
];

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "Clinically";

export default function Shell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((i) => !i.perm || can(user.role as Role, i.perm));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-[0_6px_16px_-6px_rgba(33,116,234,0.7)]">
          <Stethoscope className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold tracking-tight text-slate-800">
          {clinicName}
        </span>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-[0_8px_18px_-8px_rgba(33,116,234,0.7)]"
                  : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-transform",
                  active ? "" : "text-slate-400 group-hover:text-brand-600"
                )}
              />
              {item.label}
              {active && <ChevronRight className="ml-auto h-4 w-4 opacity-80" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-400">
              {ROLE_LABELS[user.role as Role]}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar — pinned to the viewport so it's always visible */}
      <aside className="no-print hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block lg:h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-6 no-print">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden flex-1 sm:block">
            <GlobalSearch />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile close button when drawer open */}
      {open && (
        <button
          className="fixed right-4 top-4 z-50 rounded-lg bg-white p-2 shadow lg:hidden"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
