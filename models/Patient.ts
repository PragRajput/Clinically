import mongoose, { Schema, model, models } from "mongoose";

export interface IPatient {
  _id: mongoose.Types.ObjectId;
  code: string; // MRN, e.g. P-0001
  name: string;
  dob?: Date;
  gender?: "male" | "female" | "other";
  phone: string;
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
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
    },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    occupation: { type: String, trim: true },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed", "other"],
    },
    insuranceProvider: { type: String, trim: true },
    insuranceNumber: { type: String, trim: true },
    referredBy: { type: String, trim: true },
    notes: { type: String, trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

PatientSchema.index({ name: "text", phone: "text", code: "text" });

export const Patient =
  (models.Patient as mongoose.Model<IPatient>) ||
  model<IPatient>("Patient", PatientSchema);
