"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function GuideCard({ guide }) {
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(null);
  const [quizEnabled, setQuizEnabled] = useState(guide.branding?.quizEnabled !== false);
  const [togglingQuiz, setTogglingQuiz] = useState(false);
  const router = useRouter();
  const chatUrl = `/chat/${guide.slug}`;
  const pageCount = guide.knowledge_base?.length || 0;

  const handleDelete = async () => {
    if (!confirm("Delete this guide? This cannot be undone.")) return;
    setDeleting(true);

    const supabase = createClient();

    if (guide.pdf_storage_path) {
      await supabase.storage.from("pdfs").remove([guide.pdf_storage_path]);
    }

    await supabase.from("guides").delete().eq("id", guide.id);
    router.refresh();
  };

  const copyEmbed = () => {
    const origin = window.location.origin;
    const snippet = `<iframe src="${origin}${chatUrl}?embed=true" width="400" height="600" style="border:none;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.15)" allow="clipboard-write"></iframe>`;
    navigator.clipboard.writeText(snippet);
    setCopied("embed");
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleQuiz = async () => {
    const newValue = !quizEnabled;
    setQuizEnabled(newValue);
    setTogglingQuiz(true);

    try {
      await fetch(`/api/guides/${guide.id}/branding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...guide.branding, quizEnabled: newValue }),
      });
    } catch {
      setQuizEnabled(!newValue); // revert on failure
    }
    setTogglingQuiz(false);
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

      {guide.knowledge_base && (
        <div className="guide-card-toggle">
          <label className="toggle-label" onClick={toggleQuiz}>
            <span className={`toggle-switch-inline ${quizEnabled ? "on" : ""}`} />
            Quiz Mode
          </label>
          <span className="toggle-hint">
            {quizEnabled ? "Learners can take a 5-question quiz" : "Quiz tab hidden for learners"}
          </span>
        </div>
      )}

      <div className="guide-card-actions">
        {guide.knowledge_base && (
          <Link
            href={chatUrl}
            className="btn btn-primary btn-small btn-tooltip"
            target="_blank"
            data-tip="Preview the chatbot as your learners will see it"
          >
            Open Chatbot
          </Link>
        )}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin + chatUrl);
            setCopied("link");
            setTimeout(() => setCopied(null), 2000);
          }}
          className="btn btn-secondary btn-small btn-tooltip"
          disabled={!guide.knowledge_base}
          data-tip="Copy a shareable link to send to learners"
        >
          {copied === "link" ? "Copied!" : "Copy Link"}
        </button>
        {guide.knowledge_base && (
          <>
            <button
              onClick={copyEmbed}
              className="btn btn-secondary btn-small btn-tooltip"
              data-tip="Get an iframe code to embed this chatbot on any website"
            >
              {copied === "embed" ? "Copied!" : "Embed"}
            </button>
            <Link
              href={`/dashboard/guides/${guide.id}/branding`}
              className="btn btn-secondary btn-small btn-tooltip"
              data-tip="Customize colors, logo, and welcome message"
            >
              Branding
            </Link>
            <Link
              href={`/dashboard/guides/${guide.id}/analytics`}
              className="btn btn-secondary btn-small btn-tooltip"
              data-tip="See what learners are asking and how they score on quizzes"
            >
              Analytics
            </Link>
          </>
        )}
        <button
          onClick={handleDelete}
          className="btn btn-danger btn-small btn-tooltip"
          disabled={deleting}
          data-tip="Permanently delete this guide and its chatbot"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
