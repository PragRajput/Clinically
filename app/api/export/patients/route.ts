import { handle, requirePermission } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { toCsv, csvResponse } from "@/lib/csv";
import { ageFromDob } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requirePermission("patients.view");
    await connectDB();
    const patients = await Patient.find().sort({ createdAt: -1 }).lean();

    const rows = patients.map((p) => ({
      code: p.code,
      name: p.name,
      phone: p.phone,
      email: p.email || "",
      gender: p.gender || "",
      age: ageFromDob(p.dob) ?? "",
      bloodGroup: p.bloodGroup || "",
      allergies: (p.allergies || []).join("; "),
      conditions: (p.chronicConditions || []).join("; "),
      insurance: p.insuranceProvider || "",
      registered: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : "",
    }));

    const csv = toCsv(rows, [
      { key: "code", label: "Patient ID" },
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "gender", label: "Gender" },
      { key: "age", label: "Age" },
      { key: "bloodGroup", label: "Blood Group" },
      { key: "allergies", label: "Allergies" },
      { key: "conditions", label: "Chronic Conditions" },
      { key: "insurance", label: "Insurance" },
      { key: "registered", label: "Registered" },
    ]);
    return csvResponse(csv, "patients.csv");
  });
}
