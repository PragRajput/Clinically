"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./Toast";

/** A button that asks for confirmation, then calls a DELETE endpoint. */
export default function ConfirmButton({
  url,
  message = "Are you sure?",
  className,
  children,
  redirectTo,
  successMessage = "Done",
}: {
  url: string;
  message?: string;
  className?: string;
  children: React.ReactNode;
  redirectTo?: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!confirm(message)) return;
    setLoading(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }
      toast(successMessage, "success");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={loading}
      className={cn(className || "btn-danger")}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
