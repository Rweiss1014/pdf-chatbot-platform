"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function GuideCard({ guide }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const chatUrl = `/chat/${guide.slug}`;
  const pageCount = guide.knowledge_base?.length || 0;

  const handleDelete = async () => {
    if (!confirm("Delete this guide? This cannot be undone.")) return;
    setDeleting(true);

    const supabase = createClient();

    // Delete PDF from storage
    if (guide.pdf_storage_path) {
      await supabase.storage.from("pdfs").remove([guide.pdf_storage_path]);
    }

    // Delete guide record
    await supabase.from("guides").delete().eq("id", guide.id);

    router.refresh();
  };

  return (
    <div className="guide-card">
      <div className="guide-card-header">
        <h3>{guide.title}</h3>
        <span className={`guide-status ${guide.knowledge_base ? "ready" : "processing"}`}>
          {guide.knowledge_base ? "Ready" : "Processing..."}
        </span>
      </div>
      <p className="guide-meta">
        {pageCount} pages &middot; Created {new Date(guide.created_at).toLocaleDateString()}
      </p>
      <div className="guide-card-actions">
        {guide.knowledge_base && (
          <Link href={chatUrl} className="btn btn-primary btn-small" target="_blank">
            Open Chatbot
          </Link>
        )}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin + chatUrl);
            alert("Link copied!");
          }}
          className="btn btn-secondary btn-small"
          disabled={!guide.knowledge_base}
        >
          Copy Link
        </button>
        <button
          onClick={handleDelete}
          className="btn btn-danger btn-small"
          disabled={deleting}
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
