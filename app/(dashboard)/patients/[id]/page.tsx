import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Cake,
  Droplet,
  AlertTriangle,
  HeartPulse,
  Pencil,
  Plus,
  CalendarPlus,
  ClipboardList,
  Wallet,
  ChevronRight,
  Pill,
  Archive,
  ShieldAlert,
  Paperclip,
  Briefcase,
  Heart,
  ShieldCheck,
  UserCheck,
  Activity,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPatientProfile } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { ageFromDob, formatDate, formatMoney } from "@/lib/utils";
import { PageHeader, Avatar, Badge, paymentBadge, apptBadge } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import AttachmentList from "@/components/AttachmentList";
import AttachmentUploader from "@/components/AttachmentUploader";

export const dynamic = "force-dynamic";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const data = await getPatientProfile(id);
  if (!data) notFound();
  const { patient: p, visits, appointments, attachments, stats } = data;
  const age = ageFromDob(p.dob);
  const canManageDocs = can(user.role, "attachments.manage");

  // Vitals trend (oldest → newest), only visits that recorded the metric
  const vitalsHistory = [...visits]
    .filter((v) => v.vitals && (v.vitals.weightKg || v.vitals.bp))
    .reverse();
  const weightSeries = vitalsHistory
    .map((v) => v.vitals?.weightKg)
    .filter((n): n is number => typeof n === "number");
  const bpSeries = vitalsHistory
    .map((v) => Number(v.vitals?.bp?.split("/")[0]))
    .filter((n) => !isNaN(n) && n > 0);

  return (
    <div>
      <PageHeader
        title={p.name}
        subtitle={`Patient ID ${p.code}`}
        action={
          <div className="flex flex-wrap gap-2">
            {can(user.role, "patients.manage") && (
              <Link href={`/patients/${p._id}/edit`} className="btn-outline">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            {can(user.role, "appointments.manage") && (
              <Link
                href={`/appointments?patient=${p._id}`}
                className="btn-outline"
              >
                <CalendarPlus className="h-4 w-4" /> Appointment
              </Link>
            )}
            {can(user.role, "visits.manage") && (
              <Link href={`/visits/new?patient=${p._id}`} className="btn-primary">
                <Plus className="h-4 w-4" /> Record visit
              </Link>
            )}
          </div>
        }
      />

      {/* Allergy safety banner */}
      {p.allergies.length > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>
            <strong>Allergies:</strong> {p.allergies.join(", ")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: profile details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={p.name} />
              <div>
                <p className="font-semibold text-slate-800">{p.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {age !== null && <Badge>{age} yrs</Badge>}
                  {p.gender && <Badge>{p.gender}</Badge>}
                  {p.bloodGroup && <Badge tone="rose">{p.bloodGroup}</Badge>}
                  {!p.active && <Badge tone="slate">Archived</Badge>}
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <Info icon={<Phone className="h-4 w-4" />} label="Phone">
                {p.phone}
              </Info>
              {p.email && (
                <Info icon={<Mail className="h-4 w-4" />} label="Email">
                  {p.email}
                </Info>
              )}
              {p.dob && (
                <Info icon={<Cake className="h-4 w-4" />} label="Born">
                  {formatDate(p.dob)}
                </Info>
              )}
              {p.address && (
                <Info icon={<MapPin className="h-4 w-4" />} label="Address">
                  {p.address}
                </Info>
              )}
              {p.occupation && (
                <Info icon={<Briefcase className="h-4 w-4" />} label="Occupation">
                  {p.occupation}
                </Info>
              )}
              {p.maritalStatus && (
                <Info icon={<Heart className="h-4 w-4" />} label="Marital status">
                  <span className="capitalize">{p.maritalStatus}</span>
                </Info>
              )}
              {(p.insuranceProvider || p.insuranceNumber) && (
                <Info
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Insurance"
                >
                  {[p.insuranceProvider, p.insuranceNumber]
                    .filter(Boolean)
                    .join(" · ")}
                </Info>
              )}
              {p.referredBy && (
                <Info icon={<UserCheck className="h-4 w-4" />} label="Referred by">
                  {p.referredBy}
                </Info>
              )}
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Medical background
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> Allergies
                </p>
                {p.allergies.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.allergies.map((a) => (
                      <Badge key={a} tone="rose">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">None recorded</p>
                )}
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <HeartPulse className="h-3.5 w-3.5" /> Chronic conditions
                </p>
                {p.chronicConditions.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.chronicConditions.map((c) => (
                      <Badge key={c} tone="amber">
                        {c}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">None recorded</p>
                )}
              </div>
              {p.emergencyContact?.name && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Emergency contact
                  </p>
                  <p className="text-slate-700">
                    {p.emergencyContact.name}
                    {p.emergencyContact.relation
                      ? ` (${p.emergencyContact.relation})`
                      : ""}
                  </p>
                  {p.emergencyContact.phone && (
                    <p className="text-slate-500">{p.emergencyContact.phone}</p>
                  )}
                </div>
              )}
              {p.notes && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Notes
                  </p>
                  <p className="text-slate-600">{p.notes}</p>
                </div>
              )}
            </div>
          </div>

          {can(user.role, "patients.delete") && (
            <ConfirmButton
              url={`/api/patients/${p._id}`}
              message="Archive or delete this patient? Patients with visit history are archived, not deleted."
              redirectTo="/patients"
              className="btn-outline w-full text-rose-600 hover:bg-rose-50"
            >
              <Archive className="h-4 w-4" /> Archive / delete patient
            </ConfirmButton>
          )}
        </div>

        {/* Right: stats + history */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat
              icon={<ClipboardList className="h-4 w-4" />}
              label="Visits"
              value={String(stats.totalVisits)}
            />
            <MiniStat
              icon={<Wallet className="h-4 w-4" />}
              label="Total paid"
              value={formatMoney(stats.totalPaid)}
            />
            <MiniStat
              icon={<Wallet className="h-4 w-4" />}
              label="Outstanding"
              value={formatMoney(stats.totalBalance)}
              tone={stats.totalBalance > 0 ? "rose" : "slate"}
            />
            <MiniStat
              icon={<Cake className="h-4 w-4" />}
              label="Last visit"
              value={stats.lastVisit ? formatDate(stats.lastVisit) : "—"}
            />
          </div>

          {/* Vitals trend */}
          {(weightSeries.length > 1 || bpSeries.length > 1) && (
            <section className="card p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <Activity className="h-4 w-4 text-brand-600" /> Vitals trend
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {weightSeries.length > 1 && (
                  <Sparkline
                    label="Weight"
                    unit="kg"
                    data={weightSeries}
                    color="bg-brand-500"
                  />
                )}
                {bpSeries.length > 1 && (
                  <Sparkline
                    label="BP (systolic)"
                    unit="mmHg"
                    data={bpSeries}
                    color="bg-rose-500"
                  />
                )}
              </div>
            </section>
          )}

          {/* Upcoming appointments */}
          {appointments.length > 0 && (
            <section className="card">
              <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-800">
                Upcoming appointments
              </h2>
              <div className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center gap-3 px-5 py-3 text-sm"
                  >
                    <div className="font-medium text-slate-700">
                      {formatDate(a.scheduledAt)}
                    </div>
                    <div className="text-slate-400">
                      {new Date(a.scheduledAt).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex-1 text-slate-600">
                      {a.reason || "Consultation"} · {a.doctor?.name}
                    </div>
                    {apptBadge(a.status)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Documents & lab reports */}
          <section className="card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                <Paperclip className="h-4 w-4 text-brand-600" /> Documents & lab
                reports
              </h2>
              {canManageDocs && <AttachmentUploader patientId={p._id} />}
            </div>
            <div className="p-5">
              <AttachmentList
                attachments={attachments}
                canManage={canManageDocs}
              />
            </div>
          </section>

          {/* Visit history */}
          <section className="card">
            <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-800">
              Visit history
            </h2>
            {visits.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">
                No visits recorded for this patient yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {visits.map((v) => (
                  <Link
                    key={v._id}
                    href={`/visits/${v._id}`}
                    className="block px-5 py-4 hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {formatDate(v.date)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {v.doctor?.name}
                      </span>
                      <span className="ml-auto font-semibold text-slate-800">
                        {formatMoney(v.billing.total)}
                      </span>
                      {paymentBadge(v.billing.status)}
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                    {v.diagnosis && (
                      <p className="mt-1 text-sm text-slate-600">
                        <span className="text-slate-400">Diagnosis: </span>
                        {v.diagnosis}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {v.services.map((s, i) => (
                        <Badge key={i} tone="blue">
                          {s.name}
                          {s.qty > 1 ? ` ×${s.qty}` : ""}
                        </Badge>
                      ))}
                      {v.prescriptions.length > 0 && (
                        <Badge tone="violet">
                          <Pill className="h-3 w-3" />
                          {v.prescriptions.length} Rx
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <dt className="text-xs text-slate-400">{label}</dt>
        <dd className="text-slate-700">{children}</dd>
      </div>
    </div>
  );
}

function Sparkline({
  label,
  unit,
  data,
  color,
}: {
  label: string;
  unit: string;
  data: number[];
  color: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const latest = data[data.length - 1];
  const first = data[0];
  const delta = latest - first;

  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="text-sm font-bold text-slate-800">
          {latest}
          <span className="ml-0.5 text-xs font-normal text-slate-400">
            {unit}
          </span>
        </span>
      </div>
      <div className="mt-2 flex h-12 items-end gap-1">
        {data.map((n, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${color} opacity-80`}
            style={{ height: `${15 + ((n - min) / range) * 85}%` }}
            title={`${n} ${unit}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {delta === 0
          ? "No change"
          : `${delta > 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)} ${unit} over ${data.length} visits`}
      </p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone = "slate",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "slate" | "rose";
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        {icon}
        {label}
      </div>
      <p
        className={`mt-1 text-lg font-bold ${
          tone === "rose" ? "text-rose-600" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
