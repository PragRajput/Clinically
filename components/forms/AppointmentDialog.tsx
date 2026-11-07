"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarPlus } from "lucide-react";
import Modal from "@/components/Modal";
import PatientPicker from "@/components/PatientPicker";
import { toDateTimeInput } from "@/lib/utils";
import type { DoctorRef, PatientRef } from "@/lib/types";

export default function AppointmentDialog({
  doctors,
  initialPatient,
  defaultDate,
  openByDefault,
}: {
  doctors: DoctorRef[];
  initialPatient?: PatientRef | null;
  defaultDate?: string;
  openByDefault?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(openByDefault));
  const [patient, setPatient] = useState<PatientRef | null>(
    initialPatient || null
  );
  const [doctor, setDoctor] = useState(doctors[0]?._id || "");
  const [when, setWhen] = useState(
    defaultDate
      ? toDateTimeInput(`${defaultDate}T10:00`)
      : toDateTimeInput(new Date())
  );
  const [duration, setDuration] = useState("30");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return setError("Please select a patient.");
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patient._id,
          doctor,
          scheduledAt: new Date(when).toISOString(),
          durationMins: Number(duration),
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not schedule");
      setOpen(false);
      setReason("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4" /> New appointment
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule appointment"
      >
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div>
            <label className="label">Patient *</label>
            <PatientPicker value={patient} onChange={setPatient} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Doctor *</label>
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
            </div>
            <div>
              <label className="label">Duration (mins)</label>
              <input
                type="number"
                min={5}
                step={5}
                className="input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Date & time *</label>
            <input
              type="datetime-local"
              className="input"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Reason</label>
            <input
              className="input"
              placeholder="Consultation, follow-up…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
              Schedule
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
