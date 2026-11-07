import mongoose, { Schema, model, models } from "mongoose";

export interface IService {
  _id: mongoose.Types.ObjectId;
  name: string;
  category?: string;
  price: number;
  durationMins?: number;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    durationMins: { type: Number, min: 0 },
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service =
  (models.Service as mongoose.Model<IService>) ||
  model<IService>("Service", ServiceSchema);
