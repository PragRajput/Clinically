"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Paperclip } from "lucide-react";
import Modal from "./Modal";
import { useToast } from "./Toast";

const CATEGORIES = [
  { value: "lab_report", label: "Lab report" },
  { value: "scan", label: "Scan / Imaging" },
  { value: "prescription", label: "Prescription" },
  { value: "insurance", label: "Insurance" },
  { value: "invoice", label: "Invoice" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
];

export default function AttachmentUploader({
  patientId,
  visitId,
  label = "Upload",
  variant = "outline",
}: {
  patientId: string;
  visitId?: string;
  label?: string;
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("lab_report");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setCategory("lab_report");
    setNotes("");
    setFileName("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Please choose a file.");
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
      fd.append("category", category);
      if (notes) fd.append("notes", notes);
      if (visitId) fd.append("visit", visitId);

      const res = await fetch(`/api/patients/${patientId}/attachments`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast("Document uploaded", "success");
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className={variant === "primary" ? "btn-primary" : "btn-outline"}
        onClick={() => setOpen(true)}
      >
        <Upload className="h-4 w-4" /> {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Upload document"
      >
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center hover:border-brand-400 hover:bg-brand-50/40">
            <Paperclip className="mb-2 h-6 w-6 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              {fileName || "Choose a file"}
            </span>
            <span className="mt-1 text-xs text-slate-400">
              PDF or image · up to 10 MB
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFileName(f?.name || "");
                if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CBC results"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              Upload
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
