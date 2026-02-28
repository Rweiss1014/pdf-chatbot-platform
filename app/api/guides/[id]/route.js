import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: guide } = await supabase
      .from("guides")
      .select("*")
      .eq("id", id)
      .single();

    if (!guide) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(guide);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get guide to check ownership and get storage path
    const { data: guide } = await supabase
      .from("guides")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!guide) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete PDF from storage
    if (guide.pdf_storage_path) {
      await supabase.storage.from("pdfs").remove([guide.pdf_storage_path]);
    }

    // Delete guide
    await supabase.from("guides").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
