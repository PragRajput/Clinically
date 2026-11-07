"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, UserRound, UserPlus, ArrowLeft } from "lucide-react";
import { useToast } from "./Toast";
import type { PatientRef } from "@/lib/types";

export default function PatientPicker({
  value,
  onChange,
  canCreate = true,
}: {
  value: PatientRef | null;
  onChange: (p: PatientRef | null) => void;
  canCreate?: boolean;
}) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Inline "create new patient" state
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [np, setNp] = useState({ name: "", phone: "", gender: "" });

  useEffect(() => {
    if (!open || creating) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open, creating]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function startCreate() {
    // Prefill name or phone from the search query
    const digits = q.replace(/[^\d]/g, "");
    const looksLikePhone = digits.length >= 6 && digits.length / q.length > 0.5;
    setNp({
      name: looksLikePhone ? "" : q.trim(),
      phone: looksLikePhone ? q.trim() : "",
      gender: "",
    });
    setCreateError("");
    setCreating(true);
  }

  async function create() {
    if (!np.name.trim()) return setCreateError("Name is required.");
    if (!np.phone.trim()) return setCreateError("Phone is required.");
    setSaving(true);
    setCreateError("");
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: np.name.trim(),
          phone: np.phone.trim(),
          gender: np.gender || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create patient");
      toast(`Patient ${data.name} created`, "success");
      onChange({
        _id: data._id,
        name: data.name,
        code: data.code,
        phone: data.phone,
      });
      setCreating(false);
      setOpen(false);
      setQ("");
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Selected patient chip
  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <UserRound className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium text-slate-800">{value.name}</span>
          {value.code && (
            <span className="font-mono text-xs text-slate-400">{value.code}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded p-1 text-slate-400 hover:bg-slate-200"
          title="Change patient"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className="input pl-9"
        placeholder="Search patient by name, phone or ID…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {loading && !creating && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
      )}

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-pop)]">
          {!creating ? (
            <>
              <div className="max-h-56 overflow-auto">
                {results.length === 0 && !loading ? (
                  <p className="px-3 py-3 text-sm text-slate-400">
                    No matching patient found.
                  </p>
                ) : (
                  results.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        onChange(p);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs text-slate-400">
                        <span className="font-mono">{p.code}</span> · {p.phone}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="flex w-full items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5 text-left text-sm font-medium text-brand-600 hover:bg-brand-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Register new patient{q.trim() ? ` “${q.trim()}”` : ""}
                </button>
              )}
            </>
          ) : (
            <div className="space-y-2.5 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                  title="Back to search"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                Register new patient
              </div>
              {createError && (
                <p className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">
                  {createError}
                </p>
              )}
              <input
                className="input"
                placeholder="Full name *"
                value={np.name}
                autoFocus
                onChange={(e) => setNp({ ...np, name: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Phone *"
                  value={np.phone}
                  onChange={(e) => setNp({ ...np, phone: e.target.value })}
                />
                <select
                  className="input w-28"
                  value={np.gender}
                  onChange={(e) => setNp({ ...np, gender: e.target.value })}
                >
                  <option value="">Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn-outline flex-1"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={create}
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create &amp; select
                </button>
              </div>
              <p className="text-xs text-slate-400">
                You can add full details later from the patient&apos;s profile.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
