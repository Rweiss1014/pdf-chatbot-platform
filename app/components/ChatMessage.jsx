"use client";

export default function ChatMessage({ message, onCitationClick }) {
  const renderContent = (text) => {
    const parts = text.split(/(\[Page\s+\d+(?:,\s*[^\]]+)?\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[Page\s+(\d+)(?:,\s*([^\]]+))?\]/);
      if (match) {
        const pageNum = parseInt(match[1]);
        const section = match[2]?.trim() || "";
        return (
          <button
            key={i}
            className="citation-link"
            onClick={() => onCitationClick(pageNum)}
            title={`Go to page ${pageNum}${section ? " - " + section : ""}`}
          >
            Page {pageNum}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="message-label">
        {message.role === "user" ? "You" : "Assistant"}
      </div>
      <div className="message-content">
        {message.role === "assistant"
          ? renderContent(message.content)
          : message.content}
      </div>
    </div>
  );
}
