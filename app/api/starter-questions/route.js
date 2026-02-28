import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ questions: [] });
    }

    const service = createServiceClient();
    const { data: guide } = await service
      .from("guides")
      .select("starter_questions")
      .eq("slug", slug)
      .single();

    return NextResponse.json({
      questions: guide?.starter_questions || [],
    });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
