import { FileText, Download, ExternalLink, Trash2 } from "lucide-react";
import { CATEGORY_LABELS, type AttachmentCategory } from "@/models/Attachment";
import { formatDate } from "@/lib/utils";
import { Badge } from "./ui";
import ConfirmButton from "./ConfirmButton";
import type { AttachmentVM } from "@/lib/types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const categoryTone: Record<
  AttachmentCategory,
  "blue" | "violet" | "amber" | "green" | "slate"
> = {
  lab_report: "blue",
  scan: "violet",
  prescription: "violet",
  invoice: "green",
  insurance: "amber",
  document: "slate",
  other: "slate",
};

export default function AttachmentList({
  attachments,
  canManage,
}: {
  attachments: AttachmentVM[];
  canManage: boolean;
}) {
  if (attachments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
        No documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {attachments.map((a) => {
        const isImage = a.mimeType.startsWith("image/");
        const href = `/api/attachments/${a._id}`;
        return (
          <div
            key={a._id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
          >
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100"
            >
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={href}
                  alt={a.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileText className="h-6 w-6 text-slate-400" />
              )}
            </a>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {a.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone={categoryTone[a.category]}>
                  {CATEGORY_LABELS[a.category]}
                </Badge>
                <span className="text-xs text-slate-400">
                  {formatSize(a.size)} · {formatDate(a.createdAt)}
                </span>
              </div>
              {a.notes && (
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {a.notes}
                </p>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                title="View"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={`${href}?download=1`}
                title="Download"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
              >
                <Download className="h-4 w-4" />
              </a>
              {canManage && (
                <ConfirmButton
                  url={href}
                  message={`Delete "${a.title}"? This permanently removes the file.`}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </ConfirmButton>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
