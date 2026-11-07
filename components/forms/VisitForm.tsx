"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  Pill,
  Activity,
  UserRound,
  ListChecks,
  Wallet,
} from "lucide-react";
import { formatMoney, toDateInput, currencySymbol } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { DoctorRef, PatientRef, ServiceVM, VisitVM } from "@/lib/types";
import PatientPicker from "@/components/PatientPicker";
import PatientContextCard from "@/components/PatientContextCard";
import {
  FormCard,
  FormSection,
  FieldGrid,
  Field,
  FormActions,
} from "./FormLayout";

type Line = { service?: string; name: string; price: number; qty: number };
type Rx = {
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export default function VisitForm({
  doctors,
  services,
  initialPatient,
  appointmentId,
  visit,
  defaultTaxRate = 0,
}: {
  doctors: DoctorRef[];
  services: ServiceVM[];
  initialPatient?: PatientRef | null;
  appointmentId?: string;
  visit?: VisitVM;
  defaultTaxRate?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(visit);

  const [patient, setPatient] = useState<PatientRef | null>(
    visit?.patient || initialPatient || null
  );
  const [doctor, setDoctor] = useState(visit?.doctor?._id || doctors[0]?._id || "");
  const [date, setDate] = useState(
    toDateInput(visit?.date) || toDateInput(new Date())
  );
  const [chiefComplaint, setChiefComplaint] = useState(visit?.chiefComplaint || "");
  const [diagnosis, setDiagnosis] = useState(visit?.diagnosis || "");
  const [notes, setNotes] = useState(visit?.notes || "");
  const [followUpDate, setFollowUpDate] = useState(toDateInput(visit?.followUpDate));

  const [vitals, setVitals] = useState({
    bp: visit?.vitals?.bp ?? "",
    pulse: visit?.vitals?.pulse?.toString() ?? "",
    tempC: visit?.vitals?.tempC?.toString() ?? "",
    weightKg: visit?.vitals?.weightKg?.toString() ?? "",
    heightCm: visit?.vitals?.heightCm?.toString() ?? "",
    spo2: visit?.vitals?.spo2?.toString() ?? "",
  });

  const [lines, setLines] = useState<Line[]>(
    visit?.services.map((s) => ({
      service: s.service,
      name: s.name,
      price: s.price,
      qty: s.qty,
    })) || []
  );
  const [rx, setRx] = useState<Rx[]>(
    visit?.prescriptions.map((p) => ({
      drug: p.drug,
      dosage: p.dosage || "",
      frequency: p.frequency || "",
      duration: p.duration || "",
      instructions: p.instructions || "",
    })) || []
  );

  const [discount, setDiscount] = useState(visit?.billing.discount?.toString() || "0");
  const [tax, setTax] = useState(visit?.billing.tax?.toString() || "0");
  const [paid, setPaid] = useState(visit?.billing.paid?.toString() || "0");
  const [method, setMethod] = useState(visit?.billing.method || "cash");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(
    () => lines.reduce((a, l) => a + l.price * l.qty, 0),
    [lines]
  );
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));
  const balance = Math.max(0, total - Number(paid || 0));

  function addServiceById(id: string) {
    const s = services.find((x) => x._id === id);
    if (!s) return;
    setLines((l) => [...l, { service: s._id, name: s.name, price: s.price, qty: 1 }]);
  }
  function addCustomLine() {
    setLines((l) => [...l, { name: "", price: 0, qty: 1 }]);
  }
  function updateLine(i: number, patch: Partial<Line>) {
    setLines((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeLine(i: number) {
    setLines((l) => l.filter((_, idx) => idx !== i));
  }

  function addRx() {
    setRx((r) => [
      ...r,
      { drug: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  }
  function updateRx(i: number, patch: Partial<Rx>) {
    setRx((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeRx(i: number) {
    setRx((r) => r.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return setError("Please select a patient.");
    if (!doctor) return setError("Please select a doctor.");
    setSaving(true);
    setError("");
    const payload = {
      patient: patient._id,
      doctor,
      appointment: appointmentId,
      date,
      chiefComplaint,
      diagnosis,
      notes,
      followUpDate,
      vitals,
      services: lines.filter((l) => l.name),
      prescriptions: rx.filter((r) => r.drug),
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      paid: Number(paid || 0),
      method,
    };
    try {
      const res = await fetch(
        editing ? `/api/visits/${visit!._id}` : "/api/visits",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save visit");
      toast(editing ? "Visit updated" : "Visit saved", "success");
      router.push(`/visits/${editing ? visit!._id : data._id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, "error");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {patient && <PatientContextCard patientId={patient._id} />}

      <FormCard>
        {/* Visit details */}
        <FormSection
          icon={<UserRound className="h-4 w-4" />}
          title="Visit details"
          description="Who is being seen, by whom and when."
        >
          <Field label="Patient *">
            <PatientPicker value={patient} onChange={setPatient} />
          </Field>
          <FieldGrid cols={2}>
            <Field label="Doctor *">
              <select
                className="input"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        {/* Clinical assessment */}
        <FormSection
          icon={<Activity className="h-4 w-4" />}
          title="Clinical assessment"
          description="Complaint, diagnosis and recorded vitals."
          full
        >
          <FieldGrid cols={2}>
            <Field label="Chief complaint">
              <textarea
                className="input"
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              />
            </Field>
            <Field label="Diagnosis">
              <textarea
                className="input"
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </Field>
          </FieldGrid>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Vitals
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Vital label="BP" unit="mmHg" value={vitals.bp} onChange={(v) => setVitals({ ...vitals, bp: v })} placeholder="120/80" />
            <Vital label="Pulse" unit="bpm" value={vitals.pulse} onChange={(v) => setVitals({ ...vitals, pulse: v })} />
            <Vital label="Temp" unit="°C" value={vitals.tempC} onChange={(v) => setVitals({ ...vitals, tempC: v })} />
            <Vital label="Weight" unit="kg" value={vitals.weightKg} onChange={(v) => setVitals({ ...vitals, weightKg: v })} />
            <Vital label="Height" unit="cm" value={vitals.heightCm} onChange={(v) => setVitals({ ...vitals, heightCm: v })} />
            <Vital label="SpO₂" unit="%" value={vitals.spo2} onChange={(v) => setVitals({ ...vitals, spo2: v })} />
          </div>
        </FormSection>

        {/* Services & charges */}
        <FormSection
          icon={<ListChecks className="h-4 w-4" />}
          title="Services & charges"
          description="Add services from your catalog or enter a custom charge."
          full
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <select
              className="input w-auto"
              value=""
              onChange={(e) => e.target.value && addServiceById(e.target.value)}
            >
              <option value="">+ Add from catalog</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} — {formatMoney(s.price)}
                </option>
              ))}
            </select>
            <button type="button" className="btn-outline" onClick={addCustomLine}>
              <Plus className="h-4 w-4" /> Custom
            </button>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
              No services added. Pick from the catalog or add a custom charge.
            </p>
          ) : (
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Service name"
                    value={l.name}
                    onChange={(e) => updateLine(i, { name: e.target.value })}
                  />
                  <div className="relative w-28">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="input pl-6"
                      value={l.price}
                      onChange={(e) =>
                        updateLine(i, { price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <input
                    type="number"
                    min={1}
                    className="input w-16"
                    value={l.qty}
                    onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
                  />
                  <div className="w-24 text-right text-sm font-semibold text-slate-700">
                    {formatMoney(l.price * l.qty)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        {/* Prescriptions */}
        <FormSection
          icon={<Pill className="h-4 w-4" />}
          title="Prescriptions"
          description="Medications, follow-up and any additional notes."
          full
        >
          <div className="mb-3 flex justify-end">
            <button type="button" className="btn-outline" onClick={addRx}>
              <Plus className="h-4 w-4" /> Add medication
            </button>
          </div>
          {rx.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
              No medications prescribed.
            </p>
          ) : (
            <div className="space-y-3">
              {rx.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-12"
                >
                  <input className="input sm:col-span-3" placeholder="Drug *" value={r.drug} onChange={(e) => updateRx(i, { drug: e.target.value })} />
                  <input className="input sm:col-span-2" placeholder="Dosage" value={r.dosage} onChange={(e) => updateRx(i, { dosage: e.target.value })} />
                  <input className="input sm:col-span-2" placeholder="Frequency" value={r.frequency} onChange={(e) => updateRx(i, { frequency: e.target.value })} />
                  <input className="input sm:col-span-2" placeholder="Duration" value={r.duration} onChange={(e) => updateRx(i, { duration: e.target.value })} />
                  <input className="input sm:col-span-2" placeholder="Instructions" value={r.instructions} onChange={(e) => updateRx(i, { instructions: e.target.value })} />
                  <button
                    type="button"
                    onClick={() => removeRx(i)}
                    className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:col-span-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <FieldGrid cols={2}>
            <Field label="Additional notes">
              <textarea
                className="input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <Field label="Follow-up date">
              <input
                type="date"
                className="input"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        {/* Billing */}
        <FormSection
          icon={<Wallet className="h-4 w-4" />}
          title="Billing"
          description="Apply discounts or tax and record the payment."
          full
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Discount</label>
                  <input type="number" min={0} className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="label">Tax</label>
                  <input type="number" min={0} className="input" value={tax} onChange={(e) => setTax(e.target.value)} />
                  {defaultTaxRate > 0 && (
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-brand-600 hover:underline"
                      onClick={() =>
                        setTax(
                          String(
                            Math.round(
                              ((subtotal - Number(discount || 0)) *
                                defaultTaxRate) /
                                100
                            )
                          )
                        )
                      }
                    >
                      Apply {defaultTaxRate}% tax
                    </button>
                  )}
                </div>
                <div>
                  <label className="label">Amount paid</label>
                  <input type="number" min={0} className="input" value={paid} onChange={(e) => setPaid(e.target.value)} />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select className="input" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-brand-600 hover:underline"
                onClick={() => setPaid(String(total))}
              >
                Mark as fully paid ({formatMoney(total)})
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-inset ring-slate-100">
              <Row label="Subtotal" value={formatMoney(subtotal)} />
              <Row label="Discount" value={`- ${formatMoney(Number(discount || 0))}`} />
              <Row label="Tax" value={`+ ${formatMoney(Number(tax || 0))}`} />
              <div className="my-2 border-t border-slate-200" />
              <Row label="Total" value={formatMoney(total)} bold />
              <Row label="Paid" value={formatMoney(Number(paid || 0))} />
              <Row
                label="Balance"
                value={formatMoney(balance)}
                bold
                tone={balance > 0 ? "rose" : "green"}
              />
            </div>
          </div>
        </FormSection>
      </FormCard>

      <FormActions>
        <button type="button" className="btn-outline" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Save visit"}
        </button>
      </FormActions>
    </form>
  );
}

function Vital({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label} <span className="text-slate-400">({unit})</span>
      </label>
      <input
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Row({
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
    <div className="flex items-center justify-between py-0.5">
      <span className="text-slate-500">{label}</span>
      <span
        className={`${bold ? "font-bold" : "font-medium"} ${
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
