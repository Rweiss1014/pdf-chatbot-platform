import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: guide } = await supabase
      .from("guides")
      .select("branding")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!guide) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(guide.branding || {});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const branding = await request.json();

    const { data, error } = await supabase
      .from("guides")
      .update({ branding })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("branding")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json(data.branding);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
