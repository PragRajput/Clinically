import mongoose, { Schema, model, models } from "mongoose";
import type { Role } from "@/lib/permissions";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string;
  specialization?: string; // for doctors
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "doctor", "receptionist"],
      required: true,
    },
    phone: { type: String, trim: true },
    specialization: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User =
  (models.User as mongoose.Model<IUser>) || model<IUser>("User", UserSchema);
