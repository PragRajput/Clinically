import { ListChecks, Clock } from "lucide-react";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { Service } from "@/models/Service";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/utils";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import ServiceDialog from "@/components/forms/ServiceDialog";
import ConfirmButton from "@/components/ConfirmButton";
import type { ServiceVM } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const user = (await getCurrentUser())!;
  const manage = can(user.role, "services.manage");
  await connectDB();
  const services = serialize(
    await Service.find().sort({ category: 1, name: 1 }).lean()
  ) as unknown as ServiceVM[];

  // Group by category
  const groups = new Map<string, ServiceVM[]>();
  for (const s of services) {
    const key = s.category || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div>
      <PageHeader
        title="Services & pricing"
        subtitle="Manage the catalog of services your clinic offers."
        action={manage && <ServiceDialog trigger="new" />}
      />

      {services.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="No services yet"
          description="Add the services and procedures your clinic offers."
          action={manage && <ServiceDialog trigger="new" />}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([category, items]) => (
            <section key={category} className="card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <h2 className="text-sm font-semibold text-slate-700">
                  {category}
                </h2>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {items.map((s) => (
                    <tr key={s._id} className={s.active ? "" : "opacity-50"}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">
                          {s.name}
                          {!s.active && (
                            <Badge tone="slate">Archived</Badge>
                          )}
                        </p>
                        {s.description && (
                          <p className="text-xs text-slate-400">
                            {s.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {s.durationMins ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Clock className="h-3.5 w-3.5" />
                            {s.durationMins} min
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800">
                        {formatMoney(s.price)}
                      </td>
                      {manage && (
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <ServiceDialog service={s} trigger="edit" />
                            {s.active && (
                              <ConfirmButton
                                url={`/api/services/${s._id}`}
                                message={`Archive "${s.name}"? It stays on past invoices but won't appear in new visits.`}
                                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <span className="sr-only">Archive</span>✕
                              </ConfirmButton>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
