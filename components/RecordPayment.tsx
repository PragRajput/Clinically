"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
import Modal from "./Modal";
import { useToast } from "./Toast";
import { formatMoney, currencySymbol } from "@/lib/utils";

export default function RecordPayment({
  visitId,
  balance,
  label = "Record payment",
  variant = "primary",
}: {
  visitId: string;
  balance: number;
  label?: string;
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/visits/${visitId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not record payment");
      toast(`Payment of ${formatMoney(Number(amount))} recorded`, "success");
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
      <button
        className={variant === "primary" ? "btn-primary" : "btn-outline"}
        onClick={() => {
          setAmount(String(balance));
          setOpen(true);
        }}
      >
        <Wallet className="h-4 w-4" /> {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Record payment">
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <p className="text-sm text-slate-500">
            Outstanding balance:{" "}
            <span className="font-semibold text-slate-800">
              {formatMoney(balance)}
            </span>
          </p>
          <div>
            <label className="label">Amount received</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                min={0}
                className="input pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Method</label>
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </select>
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
              Save payment
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
