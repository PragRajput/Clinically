import mongoose, { Schema, model, models } from "mongoose";

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no-show";

export interface IAppointment {
  _id: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  scheduledAt: Date;
  durationMins: number;
  reason?: string;
  status: AppointmentStatus;
  notes?: string;
  visit?: mongoose.Types.ObjectId; // linked once the visit happens
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduledAt: { type: Date, required: true },
    durationMins: { type: Number, default: 30 },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    notes: { type: String, trim: true },
    visit: { type: Schema.Types.ObjectId, ref: "Visit" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AppointmentSchema.index({ scheduledAt: 1 });
AppointmentSchema.index({ doctor: 1, scheduledAt: 1 });

export const Appointment =
  (models.Appointment as mongoose.Model<IAppointment>) ||
  model<IAppointment>("Appointment", AppointmentSchema);
