import mongoose, { Schema, model, models } from "mongoose";

export interface ISetting {
  _id: string; // fixed "clinic"
  clinicName: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxRatePercent: number;
  invoiceFooter?: string;
  appointmentDefaultMins: number;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    _id: { type: String, default: "clinic" },
    clinicName: { type: String, default: "Clinically" },
    tagline: { type: String, default: "Your health, our priority" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    taxRatePercent: { type: Number, default: 0, min: 0, max: 100 },
    invoiceFooter: {
      type: String,
      default: "Thank you for visiting. Get well soon!",
    },
    appointmentDefaultMins: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export const Setting =
  (models.Setting as mongoose.Model<ISetting>) ||
  model<ISetting>("Setting", SettingSchema);

export const SETTINGS_ID = "clinic";
