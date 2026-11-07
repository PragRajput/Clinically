"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserRound, KeyRound } from "lucide-react";
import { useToast } from "@/components/Toast";
import {
  FormCard,
  FormSection,
  FieldGrid,
  Field,
  FormActions,
} from "@/components/forms/FormLayout";

export default function AccountForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      toast("Profile updated", "success");
      setCurrentPassword("");
      setNewPassword("");
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
          icon={<UserRound className="h-4 w-4" />}
          title="Profile"
          description="Your name and contact details."
        >
          <FieldGrid cols={2}>
            <Field label="Full name">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </FieldGrid>
          <Field
            label="Email"
            hint="Contact an administrator to change your email."
          >
            <input className="input bg-slate-50" value={initial.email} disabled />
          </Field>
        </FormSection>

        <FormSection
          icon={<KeyRound className="h-4 w-4" />}
          title="Change password"
          description="Leave blank to keep your current password."
        >
          <FieldGrid cols={2}>
            <Field label="Current password">
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                className="input"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </FieldGrid>
        </FormSection>
      </FormCard>

      <FormActions>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </FormActions>
    </form>
  );
}
