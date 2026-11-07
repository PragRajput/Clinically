import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

// Files are stored in a private ./uploads directory (gitignored) and served
// only through the authenticated /api/attachments/[id] route — never from
// /public — so medical documents are access-controlled.

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/heic",
]);

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
};

export async function saveUpload(
  file: File
): Promise<{ storedName: string; size: number; mimeType: string }> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = EXT_BY_MIME[file.type] || path.extname(file.name) || "";
  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return { storedName, size: buffer.length, mimeType: file.type };
}

export async function readUpload(storedName: string): Promise<Buffer> {
  // Guard against path traversal — only the bare filename is allowed.
  const safe = path.basename(storedName);
  return fs.readFile(path.join(UPLOAD_DIR, safe));
}

export async function deleteUpload(storedName: string): Promise<void> {
  const safe = path.basename(storedName);
  await fs.rm(path.join(UPLOAD_DIR, safe), { force: true });
}
