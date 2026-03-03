import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) return NextResponse.json({}, { status: 400 });

  const service = createServiceClient();
  await service.rpc("increment_views", { guide_slug: slug });

  return NextResponse.json({ ok: true });
}
