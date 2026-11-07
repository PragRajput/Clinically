// Plain JSON-safe shapes returned by the server query helpers / APIs after
// serialize(). Used to type server components and client props.

export type ID = string;

export interface DoctorRef {
  _id: ID;
  name: string;
  specialization?: string;
}

export interface PatientRef {
  _id: ID;
  name: string;
  code: string;
  phone?: string;
}

export interface PatientVM {
  _id: ID;
  code: string;
  name: string;
  phone: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  email?: string;
  address?: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: { name?: string; phone?: string; relation?: string };
  occupation?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed" | "other";
  insuranceProvider?: string;
  insuranceNumber?: string;
  referredBy?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceVM {
  _id: ID;
  name: string;
  category?: string;
  price: number;
  durationMins?: number;
  description?: string;
  active: boolean;
}

export interface VisitServiceLine {
  service?: ID;
  name: string;
  price: number;
  qty: number;
}

export interface PrescriptionVM {
  drug: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface VitalsVM {
  bp?: string;
  pulse?: number;
  tempC?: number;
  weightKg?: number;
  heightCm?: number;
  spo2?: number;
  respRate?: number;
}

export interface BillingVM {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  method?: string;
  status: "paid" | "partial" | "unpaid";
}

export interface VisitVM {
  _id: ID;
  invoiceNo: string;
  patient: PatientRef;
  doctor: DoctorRef;
  appointment?: ID;
  date: string;
  chiefComplaint?: string;
  diagnosis?: string;
  vitals?: VitalsVM;
  services: VisitServiceLine[];
  prescriptions: PrescriptionVM[];
  notes?: string;
  followUpDate?: string;
  billing: BillingVM;
  createdAt: string;
}

export interface AppointmentVM {
  _id: ID;
  patient: PatientRef;
  doctor: DoctorRef;
  scheduledAt: string;
  durationMins: number;
  reason?: string;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  notes?: string;
  visit?: ID;
}

export interface AttachmentVM {
  _id: ID;
  patient: ID;
  visit?: ID;
  title: string;
  category:
    | "lab_report"
    | "scan"
    | "prescription"
    | "invoice"
    | "insurance"
    | "document"
    | "other";
  fileName: string;
  mimeType: string;
  size: number;
  notes?: string;
  uploadedBy?: { _id: ID; name: string } | ID;
  createdAt: string;
}

export interface StaffVM {
  _id: ID;
  name: string;
  email: string;
  role: "admin" | "doctor" | "receptionist";
  phone?: string;
  specialization?: string;
  active: boolean;
  createdAt: string;
}
