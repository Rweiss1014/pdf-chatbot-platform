import Link from "next/link";

export default function Home() {
  return (
    <div className="landing">
      <div className="landing-content">
        <h1>SmartDoc</h1>
        <p className="landing-subtitle">
          Upload any PDF and instantly create an AI-powered chatbot.
          Share it with anyone via a simple link.
        </p>
        <div className="landing-features">
          <div className="feature">
            <div className="feature-icon">1</div>
            <h3>Sign Up</h3>
            <p>Create your free account and add your OpenAI API key</p>
          </div>
          <div className="feature">
            <div className="feature-icon">2</div>
            <h3>Upload PDF</h3>
            <p>Upload any PDF — AI extracts the content automatically</p>
          </div>
          <div className="feature">
            <div className="feature-icon">3</div>
            <h3>Share</h3>
            <p>Get a shareable link to your chatbot — no login needed to use it</p>
          </div>
        </div>
        <div className="landing-actions">
          <Link href="/signup" className="btn btn-primary">Get Started</Link>
          <Link href="/login" className="btn btn-secondary">Log In</Link>
        </div>
      </div>
    </div>
  );
}
