import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  Stethoscope,
  Pill,
  Activity,
  ArrowLeft,
  Trash2,
  Paperclip,
} from "lucide-react";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/api";
import { Visit } from "@/models/Visit";
import { Attachment } from "@/models/Attachment";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatDate, formatMoney } from "@/lib/utils";
import { Badge, paymentBadge } from "@/components/ui";
import RecordPayment from "@/components/RecordPayment";
import PrintButton from "@/components/PrintButton";
import ConfirmButton from "@/components/ConfirmButton";
import AttachmentList from "@/components/AttachmentList";
import AttachmentUploader from "@/components/AttachmentUploader";
import type { AttachmentVM, VisitVM } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const settings = await getSettings();
  await connectDB();
  const doc = await Visit.findById(id)
    .populate("patient", "name code phone email")
    .populate("doctor", "name specialization")
    .lean();
  if (!doc) notFound();
  const v = serialize(doc) as unknown as VisitVM & {
    patient: { _id: string; name: string; code: string; phone?: string; email?: string };
  };

  const attachments = serialize(
    await Attachment.find({ visit: id })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .lean()
  ) as unknown as AttachmentVM[];
  const canManageDocs = can(user.role, "attachments.manage");

  const vitals = v.vitals || {};
  const hasVitals = Object.values(vitals).some((x) => x !== undefined && x !== "");

  return (
    <div className="mx-auto max-w-3xl">
      {/* Action bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 no-print">
        <Link href="/visits" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Visits
        </Link>
        <div className="ml-auto flex flex-wrap gap-2">
          {can(user.role, "visits.manage") && (
            <Link href={`/visits/${v._id}/edit`} className="btn-outline">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
          <PrintButton label="Print invoice" />
          {can(user.role, "billing.manage") && v.billing.balance > 0 && (
            <RecordPayment visitId={v._id} balance={v.billing.balance} />
          )}
          {can(user.role, "visits.delete") && (
            <ConfirmButton
              url={`/api/visits/${v._id}`}
              message="Delete this visit permanently?"
              redirectTo="/visits"
              className="btn-outline text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
            </ConfirmButton>
          )}
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold text-slate-800">
                {settings.clinicName}
              </p>
              <p className="text-xs text-slate-400">
                {[settings.address, settings.phone, settings.email]
                  .filter(Boolean)
                  .join(" · ") || "Clinic Invoice & Record"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-slate-800">
              {v.invoiceNo}
            </p>
            <p className="text-xs text-slate-400">{formatDate(v.date)}</p>
            <div className="mt-1">{paymentBadge(v.billing.status)}</div>
          </div>
        </div>

        {/* Patient & doctor */}
        <div className="grid grid-cols-2 gap-4 py-5 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Patient
            </p>
            <p className="font-semibold text-slate-800">{v.patient?.name}</p>
            <p className="font-mono text-xs text-slate-400">{v.patient?.code}</p>
            {v.patient?.phone && (
              <p className="text-slate-500">{v.patient.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Attending doctor
            </p>
            <p className="font-semibold text-slate-800">{v.doctor?.name}</p>
            {v.doctor?.specialization && (
              <p className="text-slate-500">{v.doctor.specialization}</p>
            )}
          </div>
        </div>

        {/* Clinical */}
        {(v.chiefComplaint || v.diagnosis) && (
          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 py-5 sm:grid-cols-2">
            {v.chiefComplaint && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Chief complaint
                </p>
                <p className="mt-1 text-sm text-slate-700">{v.chiefComplaint}</p>
              </div>
            )}
            {v.diagnosis && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Diagnosis
                </p>
                <p className="mt-1 text-sm text-slate-700">{v.diagnosis}</p>
              </div>
            )}
          </div>
        )}

        {/* Vitals */}
        {hasVitals && (
          <div className="border-t border-slate-100 py-5">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
              <Activity className="h-3.5 w-3.5" /> Vitals
            </p>
            <div className="flex flex-wrap gap-2">
              {vitals.bp && <Vital label="BP" value={`${vitals.bp} mmHg`} />}
              {vitals.pulse !== undefined && (
                <Vital label="Pulse" value={`${vitals.pulse} bpm`} />
              )}
              {vitals.tempC !== undefined && (
                <Vital label="Temp" value={`${vitals.tempC} °C`} />
              )}
              {vitals.weightKg !== undefined && (
                <Vital label="Weight" value={`${vitals.weightKg} kg`} />
              )}
              {vitals.heightCm !== undefined && (
                <Vital label="Height" value={`${vitals.heightCm} cm`} />
              )}
              {vitals.spo2 !== undefined && (
                <Vital label="SpO₂" value={`${vitals.spo2}%`} />
              )}
            </div>
          </div>
        )}

        {/* Prescriptions */}
        {v.prescriptions.length > 0 && (
          <div className="border-t border-slate-100 py-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
              <Pill className="h-3.5 w-3.5" /> Prescription
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Medication</th>
                    <th className="px-3 py-2 font-medium">Dosage</th>
                    <th className="px-3 py-2 font-medium">Frequency</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {v.prescriptions.map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {p.drug}
                        {p.instructions && (
                          <span className="block text-xs font-normal text-slate-400">
                            {p.instructions}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{p.dosage || "—"}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {p.frequency || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {p.duration || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Services / charges */}
        <div className="border-t border-slate-100 py-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
            Services & charges
          </p>
          {v.services.length === 0 ? (
            <p className="text-sm text-slate-400">No charges recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="py-1 font-medium">Item</th>
                  <th className="py-1 text-center font-medium">Qty</th>
                  <th className="py-1 text-right font-medium">Price</th>
                  <th className="py-1 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {v.services.map((s, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    <td className="py-2 text-slate-700">{s.name}</td>
                    <td className="py-2 text-center text-slate-600">{s.qty}</td>
                    <td className="py-2 text-right text-slate-600">
                      {formatMoney(s.price)}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-800">
                      {formatMoney(s.price * s.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Billing summary */}
        <div className="flex justify-end border-t border-slate-100 pt-5">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <SummaryRow label="Subtotal" value={formatMoney(v.billing.subtotal)} />
            {v.billing.discount > 0 && (
              <SummaryRow
                label="Discount"
                value={`- ${formatMoney(v.billing.discount)}`}
              />
            )}
            {v.billing.tax > 0 && (
              <SummaryRow label="Tax" value={`+ ${formatMoney(v.billing.tax)}`} />
            )}
            <div className="my-1 border-t border-slate-200" />
            <SummaryRow label="Total" value={formatMoney(v.billing.total)} bold />
            <SummaryRow
              label={`Paid${v.billing.method ? ` (${v.billing.method})` : ""}`}
              value={formatMoney(v.billing.paid)}
            />
            <SummaryRow
              label="Balance due"
              value={formatMoney(v.billing.balance)}
              bold
              tone={v.billing.balance > 0 ? "rose" : "green"}
            />
          </div>
        </div>

        {v.followUpDate && (
          <div className="mt-5 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <strong>Follow-up:</strong> {formatDate(v.followUpDate)}
          </div>
        )}
        {v.notes && (
          <div className="mt-4 text-sm text-slate-600">
            <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
            <p className="mt-1">{v.notes}</p>
          </div>
        )}

        {settings.invoiceFooter && (
          <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
            {settings.invoiceFooter}
          </p>
        )}
      </div>

      {/* Attachments for this visit (not part of the printed invoice) */}
      <section className="card mt-4 p-5 no-print">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <Paperclip className="h-4 w-4 text-brand-600" /> Documents & lab
            reports
          </h2>
          {canManageDocs && (
            <AttachmentUploader patientId={v.patient._id} visitId={v._id} />
          )}
        </div>
        <AttachmentList attachments={attachments} canManage={canManageDocs} />
      </section>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <Badge tone="blue">
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold">{value}</span>
    </Badge>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "rose" | "green";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={`${bold ? "text-base font-bold" : "font-medium"} ${
          tone === "rose"
            ? "text-rose-600"
            : tone === "green"
              ? "text-emerald-600"
              : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
