import mongoose, { Schema, model, models } from "mongoose";

export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface IVisitServiceLine {
  service?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  qty: number;
}

export interface IPrescription {
  drug: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface IVitals {
  bp?: string;
  pulse?: number;
  tempC?: number;
  weightKg?: number;
  heightCm?: number;
  spo2?: number;
  respRate?: number;
}

export interface IBilling {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  method?: "cash" | "card" | "upi" | "insurance" | "other";
  status: PaymentStatus;
}

export interface IVisit {
  _id: mongoose.Types.ObjectId;
  invoiceNo: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  appointment?: mongoose.Types.ObjectId;
  date: Date;
  chiefComplaint?: string;
  diagnosis?: string;
  vitals?: IVitals;
  services: IVisitServiceLine[];
  prescriptions: IPrescription[];
  notes?: string;
  followUpDate?: Date;
  billing: IBilling;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceLineSchema = new Schema<IVisitServiceLine>(
  {
    service: { type: Schema.Types.ObjectId, ref: "Service" },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    drug: { type: String, required: true },
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
  },
  { _id: false }
);

const VitalsSchema = new Schema<IVitals>(
  {
    bp: String,
    pulse: Number,
    tempC: Number,
    weightKg: Number,
    heightCm: Number,
    spo2: Number,
    respRate: Number,
  },
  { _id: false }
);

const BillingSchema = new Schema<IBilling>(
  {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    method: {
      type: String,
      enum: ["cash", "card", "upi", "insurance", "other"],
    },
    status: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },
  },
  { _id: false }
);

const VisitSchema = new Schema<IVisit>(
  {
    invoiceNo: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointment: { type: Schema.Types.ObjectId, ref: "Appointment" },
    date: { type: Date, default: Date.now },
    chiefComplaint: { type: String, trim: true },
    diagnosis: { type: String, trim: true },
    vitals: VitalsSchema,
    services: { type: [ServiceLineSchema], default: [] },
    prescriptions: { type: [PrescriptionSchema], default: [] },
    notes: { type: String, trim: true },
    followUpDate: { type: Date },
    billing: { type: BillingSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

VisitSchema.index({ patient: 1, date: -1 });
VisitSchema.index({ date: -1 });
VisitSchema.index({ "billing.status": 1 });

export const Visit =
  (models.Visit as mongoose.Model<IVisit>) ||
  model<IVisit>("Visit", VisitSchema);

/** Recompute billing totals from line items + payment amount. */
export function computeBilling(input: {
  services: { price: number; qty: number }[];
  discount?: number;
  tax?: number;
  paid?: number;
  method?: IBilling["method"];
}): IBilling {
  const subtotal = input.services.reduce(
    (sum, s) => sum + Number(s.price || 0) * Number(s.qty || 1),
    0
  );
  const discount = Math.max(0, Number(input.discount || 0));
  const tax = Math.max(0, Number(input.tax || 0));
  const total = Math.max(0, subtotal - discount + tax);
  const paid = Math.max(0, Number(input.paid || 0));
  const balance = Math.max(0, total - paid);
  const status: PaymentStatus =
    paid <= 0 ? "unpaid" : balance <= 0 ? "paid" : "partial";
  return {
    subtotal,
    discount,
    tax,
    total,
    paid,
    balance,
    method: input.method,
    status,
  };
}
