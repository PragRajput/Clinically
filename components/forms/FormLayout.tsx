import { cn } from "@/lib/utils";

/** A single elevated card that holds form sections separated by dividers. */
export function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card divide-y divide-slate-100 px-5 sm:px-7">{children}</div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="soft-icon h-9 w-9 shrink-0 bg-gradient-to-br from-brand-50 to-teal-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold leading-6 text-slate-800">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * A form section. By default it lays out the header (icon/title/description)
 * in a left column with the fields on the right (settings-style). Pass `full`
 * to stack the header above full-width content (for wide tables/rows).
 */
export function FormSection({
  icon,
  title,
  description,
  children,
  full = false,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  if (full) {
    return (
      <section className="py-6 first:pt-6">
        <SectionHeader icon={icon} title={title} description={description} />
        <div className="mt-4">{children}</div>
      </section>
    );
  }
  return (
    <section className="grid gap-x-8 gap-y-5 py-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <SectionHeader icon={icon} title={title} description={description} />
      </div>
      <div className="space-y-4 md:col-span-2">{children}</div>
    </section>
  );
}

/** Responsive grid for fields inside a section. */
export function FieldGrid({
  cols = 2,
  children,
}: {
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}

/** A single labelled field. Use `full` to span the whole grid row. */
export function Field({
  label,
  hint,
  full,
  children,
}: {
  label?: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(full && "sm:col-span-2 md:col-span-3")}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Sticky action bar that floats at the bottom of long forms. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-4 z-10 mt-5 flex items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur">
      {children}
    </div>
  );
}
