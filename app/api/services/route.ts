import { NextRequest } from "next/server";
import { handle, ok, requirePermission, serialize } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import { serviceSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requirePermission("services.view");
    await connectDB();
    const services = await Service.find().sort({ category: 1, name: 1 }).lean();
    return ok(serialize(services));
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requirePermission("services.manage");
    const data = serviceSchema.parse(await req.json());
    await connectDB();
    const service = await Service.create({
      name: data.name,
      category: data.category || undefined,
      price: data.price,
      durationMins: data.durationMins || undefined,
      description: data.description || undefined,
    });
    return ok(serialize(service), 201);
  });
}
