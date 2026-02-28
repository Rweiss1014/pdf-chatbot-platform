import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { decrypt } from "@/lib/encryption";
import { extractPdfContent } from "@/lib/vision-extract";
import crypto from "crypto";

function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = crypto.randomBytes(4).toString("hex");
  return `${base}-${suffix}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: guides } = await supabase
      .from("guides")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json(guides || []);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 });
    }

    // Check user has API key
    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("openai_api_key_encrypted")
      .eq("id", user.id)
      .single();

    if (!profile?.openai_api_key_encrypted) {
      return NextResponse.json({ error: "Please add your OpenAI API key in Settings first" }, { status: 400 });
    }

    const slug = generateSlug(title);
    const storagePath = `${user.id}/${slug}.pdf`;

    // Upload PDF to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await service.storage
      .from("pdfs")
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Create guide record (without knowledge_base — will be filled async)
    const { data: guide, error: insertError } = await service
      .from("guides")
      .insert({
        user_id: user.id,
        title,
        slug,
        pdf_storage_path: storagePath,
        is_public: true,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Must await — Vercel kills the function after response is sent
    await extractContentAsync(guide.id, fileBuffer, profile.openai_api_key_encrypted, service);

    return NextResponse.json(guide);
  } catch (err) {
    console.error("Guide creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function extractContentAsync(guideId, pdfBuffer, encryptedKey, service) {
  try {
    const apiKey = decrypt(encryptedKey);
    const pages = await extractPdfContent(pdfBuffer, apiKey);

    // Generate starter questions
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });
    const pagesSummary = pages.map((p) => `Page ${p.page}: ${p.content.slice(0, 200)}`).join("\n");

    const questionsRes = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Based on this document content, generate 5 good starter questions a user might ask. Return ONLY a JSON array of strings.\n\n${pagesSummary}`,
        },
      ],
      max_tokens: 500,
    });

    let starterQuestions = [];
    try {
      const raw = questionsRes.choices[0].message.content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      starterQuestions = JSON.parse(raw);
    } catch {
      starterQuestions = ["What is this document about?", "What are the key takeaways?"];
    }

    await service
      .from("guides")
      .update({
        knowledge_base: pages,
        starter_questions: starterQuestions,
      })
      .eq("id", guideId);
  } catch (err) {
    console.error("Content extraction error:", err);
    // Store error state so the UI can show what went wrong
    await service
      .from("guides")
      .update({
        knowledge_base: [{ page: 0, content: `Error extracting content: ${err.message}` }],
      })
      .eq("id", guideId);
  }
}
