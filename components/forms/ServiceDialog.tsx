"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil } from "lucide-react";
import Modal from "@/components/Modal";
import { currencySymbol } from "@/lib/utils";
import type { ServiceVM } from "@/lib/types";

export default function ServiceDialog({
  service,
  trigger = "new",
}: {
  service?: ServiceVM;
  trigger?: "new" | "edit";
}) {
  const router = useRouter();
  const editing = Boolean(service);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: service?.name ?? "",
    category: service?.category ?? "",
    price: service?.price?.toString() ?? "",
    durationMins: service?.durationMins?.toString() ?? "",
    description: service?.description ?? "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editing ? `/api/services/${service!._id}` : "/api/services",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            price: Number(form.price || 0),
            durationMins: form.durationMins
              ? Number(form.durationMins)
              : undefined,
            description: form.description,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save service");
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
          <Plus className="h-4 w-4" /> New service
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
        title={editing ? "Edit service" : "New service"}
      >
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div>
            <label className="label">Service name *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <input
                className="input"
                placeholder="Consultation, Lab…"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Price *</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min={0}
                  required
                  className="input pl-7"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duration (mins)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.durationMins}
                onChange={(e) => set("durationMins", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
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
