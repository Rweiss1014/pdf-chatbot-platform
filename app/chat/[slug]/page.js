import { createServiceClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import ChatView from "./ChatView";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = createServiceClient();
  const { data: guide } = await service
    .from("guides")
    .select("title")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  return {
    title: guide ? `${guide.title} — PDF Chatbot` : "Guide Not Found",
  };
}

export default async function ChatPage({ params }) {
  const { slug } = await params;
  const service = createServiceClient();

  const { data: guide } = await service
    .from("guides")
    .select("title, slug, pdf_storage_path, knowledge_base, starter_questions")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!guide) notFound();

  // Get a signed URL for the PDF so the browser can render it
  const { data: urlData } = await service.storage
    .from("pdfs")
    .createSignedUrl(guide.pdf_storage_path, 3600); // 1 hour

  return (
    <ChatView
      guide={guide}
      pdfUrl={urlData?.signedUrl || ""}
    />
  );
}
