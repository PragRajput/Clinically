import { handle, requirePermission } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Visit } from "@/models/Visit";
import { toCsv, csvResponse } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ref = { name?: string; code?: string } | null;

export async function GET() {
  return handle(async () => {
    await requirePermission("billing.view");
    await connectDB();
    const visits = await Visit.find()
      .populate("patient", "name code")
      .populate("doctor", "name")
      .sort({ date: -1 })
      .lean();

    const rows = visits.map((v) => {
      const patient = v.patient as Ref;
      const doctor = v.doctor as Ref;
      return {
        invoice: v.invoiceNo,
        date: v.date ? new Date(v.date).toISOString().slice(0, 10) : "",
        patientId: patient?.code || "",
        patient: patient?.name || "",
        doctor: doctor?.name || "",
        diagnosis: v.diagnosis || "",
        services: (v.services || []).map((s) => s.name).join("; "),
        total: v.billing?.total ?? 0,
        paid: v.billing?.paid ?? 0,
        balance: v.billing?.balance ?? 0,
        status: v.billing?.status || "",
        method: v.billing?.method || "",
      };
    });

    const csv = toCsv(rows, [
      { key: "invoice", label: "Invoice" },
      { key: "date", label: "Date" },
      { key: "patientId", label: "Patient ID" },
      { key: "patient", label: "Patient" },
      { key: "doctor", label: "Doctor" },
      { key: "diagnosis", label: "Diagnosis" },
      { key: "services", label: "Services" },
      { key: "total", label: "Total" },
      { key: "paid", label: "Paid" },
      { key: "balance", label: "Balance" },
      { key: "status", label: "Status" },
      { key: "method", label: "Method" },
    ]);
    return csvResponse(csv, "visits.csv");
  });
}
