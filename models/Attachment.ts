import mongoose, { Schema, model, models } from "mongoose";

export type AttachmentCategory =
  | "lab_report"
  | "scan"
  | "prescription"
  | "invoice"
  | "insurance"
  | "document"
  | "other";

export interface IAttachment {
  _id: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  visit?: mongoose.Types.ObjectId;
  title: string;
  category: AttachmentCategory;
  fileName: string; // original name
  storedName: string; // name on disk
  mimeType: string;
  size: number;
  notes?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    visit: { type: Schema.Types.ObjectId, ref: "Visit" },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "lab_report",
        "scan",
        "prescription",
        "invoice",
        "insurance",
        "document",
        "other",
      ],
      default: "document",
    },
    fileName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    notes: { type: String, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AttachmentSchema.index({ patient: 1, createdAt: -1 });
AttachmentSchema.index({ visit: 1 });

export const Attachment =
  (models.Attachment as mongoose.Model<IAttachment>) ||
  model<IAttachment>("Attachment", AttachmentSchema);

export const CATEGORY_LABELS: Record<AttachmentCategory, string> = {
  lab_report: "Lab report",
  scan: "Scan / Imaging",
  prescription: "Prescription",
  invoice: "Invoice",
  insurance: "Insurance",
  document: "Document",
  other: "Other",
};
