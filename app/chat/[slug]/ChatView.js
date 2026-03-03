"use client";
import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import ChatPanel from "@/app/components/ChatPanel";

const PdfViewer = dynamic(() => import("@/app/components/PdfViewer"), {
  ssr: false,
  loading: () => <div style={{ padding: 20, color: "#888" }}>Loading PDF...</div>,
});

export default function ChatView({ guide, pdfUrl, embed }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [messages, setMessages] = useState([]);
  const [highlightPulse, setHighlightPulse] = useState(0);
  const [mode, setMode] = useState("chat");

  const branding = guide.branding || {};
  const brandColor = branding.primaryColor || "#1a73e8";
  const quizEnabled = branding.quizEnabled !== false;

  // Track unique visitors per guide via localStorage
  useEffect(() => {
    const key = `smartdoc_viewed_${guide.slug}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, Date.now().toString());
      fetch(`/api/track-view?slug=${guide.slug}`, { method: "POST" }).catch(() => {});
    }
  }, [guide.slug]);

  function handleCitationClick(pageNumber) {
    setCurrentPage(pageNumber);
    setHighlightPulse((prev) => prev + 1);
  }

  function handleModeSwitch(newMode) {
    if (newMode === mode) return;
    setMode(newMode);
    setMessages([]);
  }

  // Track quiz progress by counting assistant messages that contain "Question"
  const quizProgress = useMemo(() => {
    if (mode !== "quiz") return null;
    const questionMessages = messages.filter(
      (m) => m.role === "assistant" && /question\s*\d/i.test(m.content)
    );
    const current = questionMessages.length;
    // Check if quiz is complete (final score message)
    const isComplete = messages.some(
      (m) => m.role === "assistant" && /final|total score|overall|results.*\d\s*\/\s*5/i.test(m.content)
    );
    return { current: Math.min(current, 5), total: 5, isComplete };
  }, [messages, mode]);

  if (!guide.knowledge_base) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Processing...</h1>
          <p>This guide is still being set up. Please check back in a moment.</p>
        </div>
      </div>
    );
  }

  const style = { "--brand-color": brandColor };

  return (
    <div className={`app ${embed ? "embed-mode" : ""}`} style={style}>
      {!embed && (
        <div className="pdf-pane">
          <PdfViewer
            pdfUrl={pdfUrl}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            highlightPulse={highlightPulse}
          />
        </div>
      )}
      <div className="chat-pane">
        {quizEnabled && (
          <div className="mode-toggle">
            <button
              className={`mode-tab ${mode === "chat" ? "active" : ""}`}
              onClick={() => handleModeSwitch("chat")}
            >
              Chat
            </button>
            <button
              className={`mode-tab ${mode === "quiz" ? "active" : ""}`}
              onClick={() => handleModeSwitch("quiz")}
            >
              Quiz
            </button>
          </div>
        )}
        {mode === "quiz" && quizProgress && (
          <div className="quiz-progress-bar">
            <div className="quiz-progress-info">
              {quizProgress.isComplete
                ? "Quiz Complete!"
                : `Question ${quizProgress.current} of ${quizProgress.total}`}
            </div>
            <div className="quiz-progress-track">
              <div
                className="quiz-progress-fill"
                style={{
                  width: `${(quizProgress.isComplete ? 5 : quizProgress.current) / quizProgress.total * 100}%`
                }}
              />
            </div>
          </div>
        )}
        <ChatPanel
          slug={guide.slug}
          title={guide.title}
          messages={messages}
          setMessages={setMessages}
          onCitationClick={handleCitationClick}
          mode={mode}
          branding={branding}
          onSwitchToQuiz={quizEnabled ? () => handleModeSwitch("quiz") : null}
        />
      </div>
    </div>
  );
}
