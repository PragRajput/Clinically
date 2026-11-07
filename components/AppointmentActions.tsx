"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreVertical, Check, X, UserX, Stethoscope, Trash2 } from "lucide-react";

export default function AppointmentActions({
  id,
  status,
  canManage,
  canVisit,
}: {
  id: string;
  status: string;
  canManage: boolean;
  canVisit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function setStatus(s: string) {
    setBusy(true);
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this appointment?")) return;
    setBusy(true);
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    setOpen(false);
    setBusy(false);
    router.refresh();
  }

  if (!canManage && !canVisit) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
            {canVisit && status === "scheduled" && (
              <Link
                href={`/visits/new?appointment=${id}`}
                className="flex items-center gap-2 px-3 py-2 text-brand-600 hover:bg-slate-50"
              >
                <Stethoscope className="h-4 w-4" /> Start visit
              </Link>
            )}
            {canManage && (
              <>
                <button
                  onClick={() => setStatus("completed")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <Check className="h-4 w-4 text-emerald-600" /> Mark completed
                </button>
                <button
                  onClick={() => setStatus("no-show")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <UserX className="h-4 w-4 text-slate-500" /> No-show
                </button>
                <button
                  onClick={() => setStatus("cancelled")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <X className="h-4 w-4 text-amber-600" /> Cancel
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={remove}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
