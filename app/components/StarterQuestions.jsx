"use client";

export default function StarterQuestions({ title, questions, onSelect }) {
  if (!questions.length) return null;

  return (
    <div className="starter-questions">
      <div className="starter-header">
        <h3>{title || "Guide"} Assistant</h3>
        <p>Ask me anything about this guide. Here are some ideas:</p>
      </div>
      {questions.map((q, i) => (
        <button key={i} className="starter-chip" onClick={() => onSelect(q)}>
          {q}
        </button>
      ))}
    </div>
  );
}
