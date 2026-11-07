"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, HeartPulse, Siren, FileText } from "lucide-react";
import { toDateInput } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import type { PatientVM } from "@/lib/types";
import {
  FormCard,
  FormSection,
  FieldGrid,
  Field,
  FormActions,
} from "./FormLayout";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientForm({ patient }: { patient?: PatientVM }) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(patient);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: patient?.name ?? "",
    phone: patient?.phone ?? "",
    dob: toDateInput(patient?.dob),
    gender: patient?.gender ?? "",
    email: patient?.email ?? "",
    bloodGroup: patient?.bloodGroup ?? "",
    address: patient?.address ?? "",
    allergies: (patient?.allergies ?? []).join(", "),
    chronicConditions: (patient?.chronicConditions ?? []).join(", "),
    ecName: patient?.emergencyContact?.name ?? "",
    ecPhone: patient?.emergencyContact?.phone ?? "",
    ecRelation: patient?.emergencyContact?.relation ?? "",
    occupation: patient?.occupation ?? "",
    maritalStatus: patient?.maritalStatus ?? "",
    insuranceProvider: patient?.insuranceProvider ?? "",
    insuranceNumber: patient?.insuranceNumber ?? "",
    referredBy: patient?.referredBy ?? "",
    notes: patient?.notes ?? "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      phone: form.phone,
      dob: form.dob,
      gender: form.gender || undefined,
      email: form.email,
      bloodGroup: form.bloodGroup || undefined,
      address: form.address,
      allergies: form.allergies.split(",").map((s) => s.trim()).filter(Boolean),
      chronicConditions: form.chronicConditions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      emergencyContact: {
        name: form.ecName,
        phone: form.ecPhone,
        relation: form.ecRelation,
      },
      occupation: form.occupation,
      maritalStatus: form.maritalStatus || undefined,
      insuranceProvider: form.insuranceProvider,
      insuranceNumber: form.insuranceNumber,
      referredBy: form.referredBy,
      notes: form.notes,
    };
    try {
      const res = await fetch(
        editing ? `/api/patients/${patient!._id}` : "/api/patients",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save patient");
      toast(editing ? "Patient updated" : "Patient registered", "success");
      router.push(`/patients/${editing ? patient!._id : data._id}`);
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

      <FormCard>
        <FormSection
          icon={<User className="h-4 w-4" />}
          title="Personal details"
          description="Basic identity and contact information."
        >
          <Field label="Full name *">
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <FieldGrid cols={2}>
            <Field label="Phone *">
              <input
                className="input"
                required
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
            <Field label="Date of birth">
              <input
                type="date"
                className="input"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </Field>
            <Field label="Gender">
              <select
                className="input"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood group">
              <select
                className="input"
                value={form.bloodGroup}
                onChange={(e) => set("bloodGroup", e.target.value)}
              >
                <option value="">—</option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGrid>
          <Field label="Address">
            <textarea
              className="input"
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
        </FormSection>

        <FormSection
          icon={<HeartPulse className="h-4 w-4" />}
          title="Medical background"
          description="Allergies and ongoing conditions to keep clinicians informed."
        >
          <Field label="Allergies" hint="Comma separated">
            <input
              className="input"
              placeholder="Penicillin, Peanuts…"
              value={form.allergies}
              onChange={(e) => set("allergies", e.target.value)}
            />
          </Field>
          <Field label="Chronic conditions" hint="Comma separated">
            <input
              className="input"
              placeholder="Hypertension, Diabetes…"
              value={form.chronicConditions}
              onChange={(e) => set("chronicConditions", e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </FormSection>

        <FormSection
          icon={<Siren className="h-4 w-4" />}
          title="Emergency contact"
          description="Who to reach in case of an emergency."
        >
          <FieldGrid cols={1}>
            <Field label="Name">
              <input
                className="input"
                value={form.ecName}
                onChange={(e) => set("ecName", e.target.value)}
              />
            </Field>
            <FieldGrid cols={2}>
              <Field label="Phone">
                <input
                  className="input"
                  value={form.ecPhone}
                  onChange={(e) => set("ecPhone", e.target.value)}
                />
              </Field>
              <Field label="Relationship">
                <input
                  className="input"
                  placeholder="Spouse, Parent…"
                  value={form.ecRelation}
                  onChange={(e) => set("ecRelation", e.target.value)}
                />
              </Field>
            </FieldGrid>
          </FieldGrid>
        </FormSection>

        <FormSection
          icon={<FileText className="h-4 w-4" />}
          title="Additional details"
          description="Insurance, occupation and referral information."
        >
          <FieldGrid cols={2}>
            <Field label="Occupation">
              <input
                className="input"
                value={form.occupation}
                onChange={(e) => set("occupation", e.target.value)}
              />
            </Field>
            <Field label="Marital status">
              <select
                className="input"
                value={form.maritalStatus}
                onChange={(e) => set("maritalStatus", e.target.value)}
              >
                <option value="">—</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Insurance provider">
              <input
                className="input"
                value={form.insuranceProvider}
                onChange={(e) => set("insuranceProvider", e.target.value)}
              />
            </Field>
            <Field label="Insurance / policy no.">
              <input
                className="input"
                value={form.insuranceNumber}
                onChange={(e) => set("insuranceNumber", e.target.value)}
              />
            </Field>
          </FieldGrid>
          <Field label="Referred by">
            <input
              className="input"
              placeholder="Dr. Smith, walk-in, online…"
              value={form.referredBy}
              onChange={(e) => set("referredBy", e.target.value)}
            />
          </Field>
        </FormSection>
      </FormCard>

      <FormActions>
        <button
          type="button"
          className="btn-outline"
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Save changes" : "Register patient"}
        </button>
      </FormActions>
    </form>
  );
}
