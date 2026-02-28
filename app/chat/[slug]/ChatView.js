"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import ChatPanel from "@/app/components/ChatPanel";

const PdfViewer = dynamic(() => import("@/app/components/PdfViewer"), {
  ssr: false,
  loading: () => <div style={{ padding: 20, color: "#888" }}>Loading PDF...</div>,
});

export default function ChatView({ guide, pdfUrl }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [messages, setMessages] = useState([]);

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

  return (
    <div className="app">
      <div className="pdf-pane">
        <PdfViewer
          pdfUrl={pdfUrl}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
      <div className="chat-pane">
        <ChatPanel
          slug={guide.slug}
          title={guide.title}
          messages={messages}
          setMessages={setMessages}
          onCitationClick={(pageNumber) => setCurrentPage(pageNumber)}
        />
      </div>
    </div>
  );
}
