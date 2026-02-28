import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase-server";
import { decrypt } from "@/lib/encryption";
import { buildSystemPrompt } from "@/lib/build-prompt";

function parseCitations(text) {
  const pattern = /\[Page\s+(\d+)(?:,\s*([^\]]+))?\]/g;
  const citations = [];
  const seen = new Set();
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const page = parseInt(match[1]);
    const section = match[2]?.trim() || "";
    const key = `${page}-${section}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({ page, section });
    }
  }
  return citations;
}

export async function POST(request) {
  try {
    const { message, history, slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing guide slug" }, { status: 400 });
    }

    const service = createServiceClient();

    // Get guide by slug
    const { data: guide } = await service
      .from("guides")
      .select("*, profiles!inner(openai_api_key_encrypted)")
      .eq("slug", slug)
      .eq("is_public", true)
      .single();

    if (!guide) {
      return NextResponse.json(
        { answer: "This guide was not found or is not public.", citations: [] },
        { status: 404 }
      );
    }

    if (!guide.profiles?.openai_api_key_encrypted) {
      return NextResponse.json(
        { answer: "The guide owner has not configured their API key.", citations: [] },
        { status: 400 }
      );
    }

    if (!guide.knowledge_base) {
      return NextResponse.json(
        { answer: "This guide is still being processed. Please try again in a moment.", citations: [] },
        { status: 400 }
      );
    }

    // Decrypt the guide owner's API key
    const apiKey = decrypt(guide.profiles.openai_api_key_encrypted);
    const client = new OpenAI({ apiKey });

    const systemPrompt = buildSystemPrompt(guide.knowledge_base, guide.title);

    const messages = [{ role: "system", content: systemPrompt }];
    for (const h of history || []) {
      messages.push({ role: h.role, content: h.content });
    }
    messages.push({ role: "user", content: message });

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    });

    const answer = response.choices[0].message.content;
    const citations = parseCitations(answer);

    return NextResponse.json({ answer, citations });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { answer: "Sorry, something went wrong. Please try again.", citations: [] },
      { status: 500 }
    );
  }
}
