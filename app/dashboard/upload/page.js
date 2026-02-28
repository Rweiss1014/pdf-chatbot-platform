"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setError("");
    setProgress("Uploading PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());

      const res = await fetch("/api/guides", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      setProgress("Extracting content with AI... This may take a minute.");

      // Poll for completion
      const guideId = data.id;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const check = await fetch(`/api/guides/${guideId}`);
        const guide = await check.json();

        if (guide.knowledge_base) {
          clearInterval(poll);
          router.push("/dashboard");
          router.refresh();
        } else if (attempts > 60) {
          clearInterval(poll);
          setError("Processing is taking longer than expected. Check your dashboard later.");
          setUploading(false);
        }
      }, 3000);
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <h1>Upload New PDF</h1>
      <p className="upload-desc">
        Upload a PDF and we&apos;ll use AI to extract the content and create a chatbot.
        The AI will read every page, including images and diagrams.
      </p>

      <form onSubmit={handleSubmit} className="upload-form">
        <label>Guide Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Employee Handbook"
          required
        />

        <label>PDF File</label>
        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          {file && <p className="file-name">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
        </div>

        {error && <p className="auth-error">{error}</p>}
        {progress && <p className="upload-progress">{progress}</p>}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={uploading || !file || !title.trim()}
        >
          {uploading ? "Processing..." : "Upload & Create Chatbot"}
        </button>
      </form>
    </div>
  );
}
