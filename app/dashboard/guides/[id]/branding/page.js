"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BrandingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [branding, setBranding] = useState({
    primaryColor: "#1a73e8",
    logoUrl: "",
    welcomeMessage: "",
    quizEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/guides/${id}/branding`)
      .then((r) => r.json())
      .then((data) => {
        if (data.primaryColor || data.logoUrl || data.welcomeMessage || data.quizEnabled !== undefined) {
          setBranding({
            primaryColor: data.primaryColor || "#1a73e8",
            logoUrl: data.logoUrl || "",
            welcomeMessage: data.welcomeMessage || "",
            quizEnabled: data.quizEnabled !== false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/guides/${id}/branding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      if (res.ok) {
        setToast({ type: "success", text: "Branding saved!" });
      } else {
        setToast({ type: "error", text: "Failed to save branding." });
      }
    } catch {
      setToast({ type: "error", text: "Failed to save branding." });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="dashboard-main">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <h1>Custom Branding</h1>
        <button onClick={() => router.push("/dashboard")} className="btn btn-secondary btn-small">
          Back to Dashboard
        </button>
      </div>

      <div className="branding-layout">
        <div className="branding-form-section">
          <div className="settings-section">
            <h2>Appearance</h2>
            <p className="settings-desc">Customize how your chatbot looks to learners.</p>

            <div className="settings-form">
              <label>Primary Color</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="color-input"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  placeholder="#1a73e8"
                />
              </div>

              <label>Logo URL (optional)</label>
              <input
                type="text"
                value={branding.logoUrl}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />

              <label>Welcome Message (optional)</label>
              <textarea
                value={branding.welcomeMessage}
                onChange={(e) => setBranding({ ...branding, welcomeMessage: e.target.value })}
                placeholder="Welcome! Ask me anything about this guide."
                rows={3}
                className="branding-textarea"
              />

              <div className="toggle-row">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={branding.quizEnabled}
                    onChange={(e) => setBranding({ ...branding, quizEnabled: e.target.checked })}
                    className="toggle-checkbox"
                  />
                  <span className="toggle-switch" />
                  Enable Quiz Mode
                </label>
                <span className="toggle-desc">Learners can test their knowledge with a 5-question quiz</span>
              </div>

              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>

            {toast && (
              <div className={`settings-toast settings-toast-${toast.type}`}>
                <span className="toast-check">{toast.type === "success" ? "+" : "!"}</span>
                {toast.text}
              </div>
            )}
          </div>
        </div>

        <div className="branding-preview-section">
          <h3>Preview</h3>
          <div className="branding-preview-card">
            <div
              className="branding-preview-header"
              style={{ background: branding.primaryColor }}
            >
              {branding.logoUrl && (
                <img src={branding.logoUrl} alt="Logo" className="branding-preview-logo" />
              )}
              <span>AI Assistant</span>
            </div>
            <div className="branding-preview-body">
              {branding.welcomeMessage && (
                <p className="branding-preview-welcome">{branding.welcomeMessage}</p>
              )}
              <div className="branding-preview-chip">What is this guide about?</div>
              <div className="branding-preview-chip">Summarize the key points</div>
            </div>
            <div className="branding-preview-input">
              <span>Ask a question...</span>
              <span
                className="branding-preview-send"
                style={{ background: branding.primaryColor }}
              >
                Send
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
