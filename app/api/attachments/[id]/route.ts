import { NextRequest, NextResponse } from "next/server";
import { handle, ok, requirePermission, ApiError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Attachment } from "@/models/Attachment";
import { readUpload, deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Stream the file inline (or as a download with ?download=1). Auth required. */
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission("attachments.view");
    const { id } = await params;
    await connectDB();
    const att = await Attachment.findById(id).lean();
    if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buf = await readUpload(att.storedName);
    const download = req.nextUrl.searchParams.get("download") === "1";
    const disposition = download ? "attachment" : "inline";

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": att.mimeType,
        "Content-Disposition": `${disposition}; filename="${att.fileName.replace(/"/g, "")}"`,
        "Content-Length": String(att.size),
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json(
      { error: (err as Error).message || "Error" },
      { status }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    await requirePermission("attachments.manage");
    const { id } = await params;
    await connectDB();
    const att = await Attachment.findByIdAndDelete(id);
    if (!att) throw new ApiError(404, "Attachment not found");
    await deleteUpload(att.storedName);
    return ok({ deleted: true });
  });
}
