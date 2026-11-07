import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const optStr = z.string().trim().optional().or(z.literal(""));

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const patientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  dob: optStr,
  gender: z.enum(["male", "female", "other"]).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: optStr,
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .or(z.literal("")),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  emergencyContact: z
    .object({ name: optStr, phone: optStr, relation: optStr })
    .optional(),
  occupation: optStr,
  maritalStatus: z
    .enum(["single", "married", "divorced", "widowed", "other"])
    .optional()
    .or(z.literal("")),
  insuranceProvider: optStr,
  insuranceNumber: optStr,
  referredBy: optStr,
  notes: optStr,
});

export const serviceSchema = z.object({
  name: z.string().trim().min(1),
  category: optStr,
  price: z.coerce.number().min(0),
  durationMins: z.coerce.number().min(0).optional(),
  description: optStr,
  active: z.boolean().optional(),
});

export const appointmentSchema = z.object({
  patient: objectId,
  doctor: objectId,
  scheduledAt: z.string().min(1),
  durationMins: z.coerce.number().min(5).optional(),
  reason: optStr,
});

export const appointmentUpdateSchema = z.object({
  scheduledAt: z.string().optional(),
  durationMins: z.coerce.number().min(5).optional(),
  reason: optStr,
  status: z.enum(["scheduled", "completed", "cancelled", "no-show"]).optional(),
  notes: optStr,
});

const serviceLineSchema = z.object({
  service: objectId.optional(),
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  qty: z.coerce.number().min(1).default(1),
});

const prescriptionSchema = z.object({
  drug: z.string().min(1),
  dosage: optStr,
  frequency: optStr,
  duration: optStr,
  instructions: optStr,
});

export const visitSchema = z.object({
  patient: objectId,
  doctor: objectId,
  appointment: objectId.optional(),
  date: z.string().optional(),
  chiefComplaint: optStr,
  diagnosis: optStr,
  vitals: z
    .object({
      bp: optStr,
      pulse: z.coerce.number().optional().or(z.literal("")),
      tempC: z.coerce.number().optional().or(z.literal("")),
      weightKg: z.coerce.number().optional().or(z.literal("")),
      heightCm: z.coerce.number().optional().or(z.literal("")),
      spo2: z.coerce.number().optional().or(z.literal("")),
      respRate: z.coerce.number().optional().or(z.literal("")),
    })
    .optional(),
  services: z.array(serviceLineSchema).default([]),
  prescriptions: z.array(prescriptionSchema).default([]),
  notes: optStr,
  followUpDate: optStr,
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  paid: z.coerce.number().min(0).default(0),
  method: z.enum(["cash", "card", "upi", "insurance", "other"]).optional(),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0),
  method: z.enum(["cash", "card", "upi", "insurance", "other"]).optional(),
});

export const staffSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "doctor", "receptionist"]),
  phone: optStr,
  specialization: optStr,
  password: z.string().min(6).optional(),
  active: z.boolean().optional(),
});

export const accountSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: optStr,
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional().or(z.literal("")),
});

export const settingsSchema = z.object({
  clinicName: z.string().trim().min(1),
  tagline: optStr,
  address: optStr,
  phone: optStr,
  email: z.string().email().optional().or(z.literal("")),
  website: optStr,
  taxRatePercent: z.coerce.number().min(0).max(100),
  invoiceFooter: optStr,
  appointmentDefaultMins: z.coerce.number().min(5).max(240),
});

export type PatientInput = z.infer<typeof patientSchema>;
export type VisitInput = z.infer<typeof visitSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type StaffInput = z.infer<typeof staffSchema>;
