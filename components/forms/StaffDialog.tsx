"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil } from "lucide-react";
import Modal from "@/components/Modal";
import type { StaffVM } from "@/lib/types";

export default function StaffDialog({
  member,
  trigger = "new",
}: {
  member?: StaffVM;
  trigger?: "new" | "edit";
}) {
  const router = useRouter();
  const editing = Boolean(member);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    role: member?.role ?? "receptionist",
    phone: member?.phone ?? "",
    specialization: member?.specialization ?? "",
    password: "",
    active: member?.active ?? true,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone,
        specialization: form.specialization,
        active: form.active,
      };
      if (form.password) body.password = form.password;
      const res = await fetch(
        editing ? `/api/staff/${member!._id}` : "/api/staff",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save staff member");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {trigger === "new" ? (
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add staff
        </button>
      ) : (
        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          onClick={() => setOpen(true)}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit staff member" : "Add staff member"}
      >
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div>
            <label className="label">Full name *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Role *</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              >
                <option value="admin">Administrator</option>
                <option value="doctor">Doctor</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Specialization</label>
              <input
                className="input"
                placeholder="e.g. Pediatrics"
                value={form.specialization}
                onChange={(e) => set("specialization", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">
              {editing ? "New password (leave blank to keep)" : "Password *"}
            </label>
            <input
              type="password"
              className="input"
              required={!editing}
              minLength={6}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </div>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Active (can sign in)
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
