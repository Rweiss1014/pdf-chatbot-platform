"use client";
import { useState, useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import StarterQuestions from "./StarterQuestions";

export default function ChatPanel({ slug, title, messages, setMessages, onCitationClick }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starterQuestions, setStarterQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`/api/starter-questions?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => setStarterQuestions(data.questions))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages, slug }),
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
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>{title}</h2>
        <span>AI Assistant</span>
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <StarterQuestions
            title={title}
            questions={starterQuestions}
            onSelect={sendMessage}
          />
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
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this guide..."
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
