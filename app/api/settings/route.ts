import { NextRequest } from "next/server";
import { handle, ok, requirePermission } from "@/lib/api";
import { updateSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  return handle(async () => {
    await requirePermission("staff.manage"); // admin only
    const data = settingsSchema.parse(await req.json());
    const settings = await updateSettings(data);
    return ok(settings);
  });
}
