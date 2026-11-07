import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Patient } from "@/models/Patient";
import { Attachment } from "@/models/Attachment";
import { saveUpload, ALLOWED_MIME, MAX_FILE_SIZE } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Upload a document (lab report, scan, etc.) for a patient. */
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const user = await requirePermission("attachments.manage");
    const { id } = await params;
    await connectDB();

    const patient = await Patient.findById(id).select("_id").lean();
    if (!patient) throw new ApiError(404, "Patient not found");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError(400, "Please choose a file to upload");
    }
    if (!ALLOWED_MIME.has(file.type)) {
      throw new ApiError(400, "Unsupported file type. Use PDF or an image.");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(400, "File is too large (max 10 MB).");
    }

    const { storedName, size, mimeType } = await saveUpload(file);

    const title = (form.get("title") as string)?.trim() || file.name;
    const category = (form.get("category") as string) || "document";
    const visit = (form.get("visit") as string) || undefined;
    const notes = (form.get("notes") as string) || undefined;

    const attachment = await Attachment.create({
      patient: id,
      visit: visit || undefined,
      title,
      category,
      fileName: file.name,
      storedName,
      mimeType,
      size,
      notes,
      uploadedBy: user.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return ok(serialize(attachment), 201);
  });
}
