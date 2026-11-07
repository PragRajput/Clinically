import { connectDB } from "./db";
import { serialize } from "./api";
import { Setting, SETTINGS_ID } from "@/models/Setting";

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxRatePercent: number;
  invoiceFooter: string;
  appointmentDefaultMins: number;
}

const FALLBACK: ClinicSettings = {
  clinicName: process.env.NEXT_PUBLIC_CLINIC_NAME || "Clinically",
  tagline: "Your health, our priority",
  address: "",
  phone: "",
  email: "",
  website: "",
  taxRatePercent: 0,
  invoiceFooter: "Thank you for visiting. Get well soon!",
  appointmentDefaultMins: 30,
};

/** Read the singleton clinic settings, creating defaults on first access. */
export async function getSettings(): Promise<ClinicSettings> {
  await connectDB();
  let doc = await Setting.findById(SETTINGS_ID).lean();
  if (!doc) {
    const created = await Setting.create({
      _id: SETTINGS_ID,
      clinicName: FALLBACK.clinicName,
    });
    doc = created.toObject();
  }
  return { ...FALLBACK, ...serialize(doc) } as ClinicSettings;
}

export async function updateSettings(
  patch: Partial<ClinicSettings>
): Promise<ClinicSettings> {
  await connectDB();
  const doc = await Setting.findByIdAndUpdate(
    SETTINGS_ID,
    { $set: patch },
    { returnDocument: "after", upsert: true }
  ).lean();
  return { ...FALLBACK, ...serialize(doc) } as ClinicSettings;
}
