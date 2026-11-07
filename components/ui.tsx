import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  tone?: "brand" | "green" | "amber" | "rose" | "violet";
}) {
  const tones: Record<string, string> = {
    brand: "bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-brand-100",
    green: "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 ring-emerald-100",
    amber: "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 ring-amber-100",
    rose: "bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 ring-rose-100",
    violet: "bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 ring-violet-100",
  };
  return (
    <div className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              "soft-icon h-11 w-11 ring-1 ring-inset",
              tones[tone]
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "amber" | "rose" | "blue" | "violet";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    blue: "bg-brand-100 text-brand-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return <span className={cn("badge", tones[tone])}>{children}</span>;
}

export function paymentBadge(status: string) {
  const map: Record<string, { tone: "green" | "amber" | "rose"; label: string }> =
    {
      paid: { tone: "green", label: "Paid" },
      partial: { tone: "amber", label: "Partial" },
      unpaid: { tone: "rose", label: "Unpaid" },
    };
  const m = map[status] || { tone: "rose" as const, label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export function apptBadge(status: string) {
  const map: Record<
    string,
    { tone: "blue" | "green" | "rose" | "slate"; label: string }
  > = {
    scheduled: { tone: "blue", label: "Scheduled" },
    completed: { tone: "green", label: "Completed" },
    cancelled: { tone: "rose", label: "Cancelled" },
    "no-show": { tone: "slate", label: "No-show" },
  };
  const m = map[status] || { tone: "slate" as const, label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const init = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-teal-100 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-brand-200/50">
      {init}
    </span>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "btn-primary"
      : variant === "outline"
        ? "btn-outline"
        : "btn-ghost";
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
