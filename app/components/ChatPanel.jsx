"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import StarterQuestions from "./StarterQuestions";

export default function ChatPanel({
  slug,
  title,
  messages,
  setMessages,
  onCitationClick,
  mode = "chat",
  branding = {},
  onSwitchToQuiz,
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starterQuestions, setStarterQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const quizStartedRef = useRef(false);

  useEffect(() => {
    fetch(`/api/starter-questions?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => setStarterQuestions(data.questions))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text, currentMessages) => {
    const msgs = currentMessages !== undefined ? currentMessages : messages;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...msgs, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: msgs, slug, mode }),
      });
      const data = await res.json();

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }, [messages, loading, slug, mode, setMessages]);

  // Auto-start quiz when switching to quiz mode
  useEffect(() => {
    if (mode === "quiz" && messages.length === 0 && !quizStartedRef.current && !loading) {
      quizStartedRef.current = true;
      // Pass empty array explicitly to avoid stale closure
      sendMessage("Start the quiz", []);
    }
    if (mode === "chat") {
      quizStartedRef.current = false;
    }
  }, [mode, messages.length, loading, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isQuiz = mode === "quiz";
  const headerTitle = isQuiz ? `${title} — Quiz` : title;
  const placeholder = isQuiz
    ? "Type your answer..."
    : "Ask a question about this guide...";

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          {branding.logoUrl && (
            <img src={branding.logoUrl} alt="Logo" className="chat-header-logo" />
          )}
          <h2>{headerTitle}</h2>
        </div>
        <span>{isQuiz ? "Quiz Mode" : "AI Assistant"}</span>
      </div>
      <div className="chat-messages">
        {messages.length === 0 && mode === "chat" && (
          <StarterQuestions
            title={title}
            questions={starterQuestions}
            onSelect={sendMessage}
            welcomeMessage={branding.welcomeMessage}
          />
        )}
        {isQuiz && messages.length <= 1 && (
          <div className="quiz-intro-banner">
            <strong>Quiz Time!</strong> You&apos;ll answer 5 questions to test your knowledge. Your score will be shown at the end.
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            onCitationClick={onCitationClick}
          />
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="message-label">Assistant</div>
            <div className="message-content typing">Thinking...</div>
          </div>
        )}
        {!isQuiz && onSwitchToQuiz && messages.filter((m) => m.role === "assistant").length >= 3 && (
          <div className="quiz-nudge">
            <p>Ready to test your knowledge?</p>
            <button onClick={onSwitchToQuiz} className="quiz-nudge-btn">Switch to Quiz Mode</button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {!isQuiz && starterQuestions.length > 0 && messages.length > 0 && messages.length < 12 && (
        <div className="suggest-chips">
          {starterQuestions
            .filter((q) => !messages.some((m) => m.role === "user" && m.content === q))
            .slice(0, 2)
            .map((q, i) => (
              <button
                key={i}
                className="suggest-chip"
                onClick={() => sendMessage(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
        </div>
      )}
      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
