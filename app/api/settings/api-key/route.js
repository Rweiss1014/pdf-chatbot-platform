import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { encrypt } from "@/lib/encryption";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey } = await request.json();
    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json({ error: "Invalid API key format" }, { status: 400 });
    }

    const encrypted = encrypt(apiKey);
    const service = createServiceClient();

    // Upsert profile with encrypted key
    const { error } = await service
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        openai_api_key_encrypted: encrypted,
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = createServiceClient();
    await service
      .from("profiles")
      .update({ openai_api_key_encrypted: null })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
