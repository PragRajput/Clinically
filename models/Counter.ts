import mongoose, { Schema, model, models } from "mongoose";

interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter =
  (models.Counter as mongoose.Model<ICounter>) ||
  model<ICounter>("Counter", CounterSchema);

/** Atomically increment and return the next value of a named sequence. */
export async function nextSeq(name: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  ).lean();
  return doc!.seq;
}

/** e.g. formatCode("P", 7) -> "P-0007" */
export function formatCode(prefix: string, seq: number, pad = 4): string {
  return `${prefix}-${String(seq).padStart(pad, "0")}`;
}
