"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function exportToCSV(data) {
  const rows = [
    ["SmartDoc Analytics Export"],
    ["Guide", data.title],
    ["Exported", new Date().toLocaleString()],
    [],
    ["Metric", "Value"],
    ["Link Opens", data.views],
    ["Chat Questions", data.totalQuestions],
    ["Quiz Attempts", data.quizAttempts],
    ["Quizzes Completed", data.quizCompleted],
    ["Avg Quiz Score", data.avgScore != null ? `${data.avgScore}%` : "N/A"],
    ["Pass Rate (4/5+)", data.passRate != null ? `${data.passRate}%` : "N/A"],
    [],
    ["Content Learners Ask About Most"],
    ["Page", "Question Count"],
    ...data.knowledgeGaps.map((g) => [`Page ${g.page}`, g.count]),
    [],
    ["Recent Learner Questions"],
    ["Date", "Question"],
    ...data.recentQuestions.map((q) => [
      new Date(q.date).toLocaleDateString(),
      q.question,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => {
        const str = String(cell ?? "");
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}_analytics.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsView({ guideId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/${guideId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guideId]);

  if (loading) {
    return (
      <div className="dashboard-main">
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="dashboard-main">
        <p>Could not load analytics.</p>
      </div>
    );
  }

  const maxCiteCount = data.knowledgeGaps.length > 0 ? data.knowledgeGaps[0].count : 1;
  const hasQuizData = data.quizCompleted > 0;

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <h1>Analytics: {data.title}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportToCSV(data)} className="btn btn-primary btn-small">
            Export to Excel
          </button>
          <button onClick={() => router.push("/dashboard")} className="btn btn-secondary btn-small">
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="analytics-stats">
        <div className="analytics-stat-card">
          <div className="stat-number">{data.views}</div>
          <div className="stat-label">Link Opens</div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-number">{data.totalQuestions}</div>
          <div className="stat-label">Chat Questions</div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-number">{data.quizAttempts}</div>
          <div className="stat-label">Quiz Attempts</div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-number">{data.quizCompleted}</div>
          <div className="stat-label">Quizzes Completed</div>
        </div>
      </div>

      {/* Quiz Performance */}
      <div className="analytics-section">
        <h2>Quiz Performance</h2>
        {hasQuizData ? (
          <div className="quiz-performance">
            <div className="quiz-perf-card">
              <div className="quiz-perf-ring" style={{
                "--pct": `${data.avgScore}%`,
                "--color": data.avgScore >= 80 ? "#22c55e" : data.avgScore >= 60 ? "#f59e0b" : "#ef4444"
              }}>
                <span className="quiz-perf-value">{data.avgScore}%</span>
              </div>
              <div className="quiz-perf-label">Avg Score</div>
            </div>
            <div className="quiz-perf-card">
              <div className="quiz-perf-ring" style={{
                "--pct": `${data.passRate}%`,
                "--color": data.passRate >= 70 ? "#22c55e" : data.passRate >= 50 ? "#f59e0b" : "#ef4444"
              }}>
                <span className="quiz-perf-value">{data.passRate}%</span>
              </div>
              <div className="quiz-perf-label">Pass Rate (4/5+)</div>
            </div>
          </div>
        ) : (
          <p className="analytics-empty">No completed quizzes yet. Scores will appear here once learners finish quizzes.</p>
        )}
      </div>

      {/* Knowledge Gaps */}
      {data.knowledgeGaps.length > 0 && (
        <div className="analytics-section">
          <h2>Content Learners Ask About Most</h2>
          <p className="analytics-subtitle">High activity may indicate areas where learners need more support.</p>
          <div className="analytics-bar-chart">
            {data.knowledgeGaps.map((cp) => (
              <div key={cp.page} className="bar-row">
                <span className="bar-label">Page {cp.page}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(cp.count / maxCiteCount) * 100}%` }}
                  />
                </div>
                <span className="bar-count">{cp.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Questions */}
      {data.recentQuestions.length > 0 && (
        <div className="analytics-section">
          <h2>Recent Learner Questions</h2>
          <p className="analytics-subtitle">A pulse check on what learners are asking.</p>
          <div className="analytics-questions-list">
            {data.recentQuestions.map((q, i) => (
              <div key={i} className="analytics-question-row">
                <span className="analytics-question-text">&ldquo;{q.question}&rdquo;</span>
                <span className="analytics-question-date">
                  {new Date(q.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totalQuestions === 0 && data.quizAttempts === 0 && (
        <div className="analytics-section">
          <div className="analytics-empty-state">
            <h3>No activity yet</h3>
            <p>Share your chatbot link to start collecting learner engagement data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
