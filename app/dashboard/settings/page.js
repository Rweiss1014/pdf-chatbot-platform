"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkApiKey();
  }, []);

  async function checkApiKey() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("openai_api_key_encrypted")
      .eq("id", user.id)
      .single();

    setHasKey(!!data?.openai_api_key_encrypted);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("API key saved successfully!");
        setHasKey(true);
        setApiKey("");
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Failed to save API key.");
    }

    setSaving(false);
  }

  async function handleRemove() {
    if (!confirm("Remove your API key? Your chatbots will stop working until you add a new one.")) return;

    setSaving(true);
    try {
      const res = await fetch("/api/settings/api-key", {
        method: "DELETE",
      });
      if (res.ok) {
        setHasKey(false);
        setMessage("API key removed.");
      }
    } catch {
      setMessage("Failed to remove key.");
    }
    setSaving(false);
  }

  return (
    <div className="dashboard-content">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2>OpenAI API Key</h2>
        <p className="settings-desc">
          Your API key is encrypted and stored securely. It is used server-side only
          to power your chatbots. We never share it.
        </p>

        {hasKey && (
          <div className="key-status">
            <span className="key-badge">API Key Set</span>
            <button onClick={handleRemove} className="btn btn-danger btn-small" disabled={saving}>
              Remove Key
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="settings-form">
          <label>{hasKey ? "Replace API Key" : "Enter your OpenAI API key"}</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            required
          />
          <button type="submit" className="btn btn-primary" disabled={saving || !apiKey.trim()}>
            {saving ? "Saving..." : hasKey ? "Update Key" : "Save Key"}
          </button>
        </form>

        {message && <p className="settings-message">{message}</p>}

        <div className="settings-help">
          <h3>How to get an OpenAI API key</h3>
          <ol>
            <li>Go to <strong>platform.openai.com</strong></li>
            <li>Sign in or create an account</li>
            <li>Go to API Keys in your account settings</li>
            <li>Click &quot;Create new secret key&quot;</li>
            <li>Copy and paste it here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
