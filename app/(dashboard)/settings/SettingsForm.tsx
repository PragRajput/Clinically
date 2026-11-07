"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, Receipt } from "lucide-react";
import { useToast } from "@/components/Toast";
import {
  FormCard,
  FormSection,
  FieldGrid,
  Field,
  FormActions,
} from "@/components/forms/FormLayout";
import type { ClinicSettings } from "@/lib/settings";

export default function SettingsForm({ initial }: { initial: ClinicSettings }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    clinicName: initial.clinicName,
    tagline: initial.tagline,
    address: initial.address,
    phone: initial.phone,
    email: initial.email,
    website: initial.website,
    taxRatePercent: String(initial.taxRatePercent),
    invoiceFooter: initial.invoiceFooter,
    appointmentDefaultMins: String(initial.appointmentDefaultMins),
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          taxRatePercent: Number(form.taxRatePercent || 0),
          appointmentDefaultMins: Number(form.appointmentDefaultMins || 30),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save settings");
      toast("Settings saved", "success");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      <FormCard>
        <FormSection
          icon={<Building2 className="h-4 w-4" />}
          title="Clinic profile"
          description="Shown across the app and on printed invoices."
        >
          <FieldGrid cols={2}>
            <Field label="Clinic name *">
              <input
                className="input"
                required
                value={form.clinicName}
                onChange={(e) => set("clinicName", e.target.value)}
              />
            </Field>
            <Field label="Tagline">
              <input
                className="input"
                value={form.tagline}
                onChange={(e) => set("tagline", e.target.value)}
              />
            </Field>
          </FieldGrid>
          <Field label="Address">
            <input
              className="input"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <FieldGrid cols={3}>
            <Field label="Phone">
              <input
                className="input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Website">
              <input
                className="input"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection
          icon={<Receipt className="h-4 w-4" />}
          title="Billing & invoicing"
          description="Defaults applied to new visits and invoices."
        >
          <FieldGrid cols={2}>
            <Field
              label="Default tax rate (%)"
              hint="Pre-filled on new visits (editable per visit)."
            >
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                className="input"
                value={form.taxRatePercent}
                onChange={(e) => set("taxRatePercent", e.target.value)}
              />
            </Field>
            <Field label="Default appointment length (mins)">
              <input
                type="number"
                min={5}
                step={5}
                className="input"
                value={form.appointmentDefaultMins}
                onChange={(e) => set("appointmentDefaultMins", e.target.value)}
              />
            </Field>
          </FieldGrid>
          <Field label="Invoice footer note">
            <input
              className="input"
              value={form.invoiceFooter}
              onChange={(e) => set("invoiceFooter", e.target.value)}
            />
          </Field>
        </FormSection>
      </FormCard>

      <FormActions>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save settings
        </button>
      </FormActions>
    </form>
  );
}
