"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">SmartDoc</div>
        <h1>Reset password</h1>

        {sent ? (
          <>
            <p className="auth-success">
              Check your email for a password reset link. It may take a minute to arrive.
            </p>
            <div className="auth-divider" />
            <p className="auth-switch">
              <Link href="/login">Back to sign in</Link>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : "Send Reset Link"}
              </button>
            </form>
            <div className="auth-divider" />
            <p className="auth-switch">
              Remember your password? <Link href="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
