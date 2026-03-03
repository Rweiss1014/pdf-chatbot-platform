import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  try {
    const { guideId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const { data: guide } = await supabase
      .from("guides")
      .select("id, title, views")
      .eq("id", guideId)
      .eq("user_id", user.id)
      .single();

    if (!guide) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get all chat logs for this guide (need assistant_message for quiz score parsing)
    const service = createServiceClient();
    const { data: logs } = await service
      .from("chat_logs")
      .select("user_message, assistant_message, citations, mode, created_at")
      .eq("guide_id", guideId)
      .order("created_at", { ascending: false });

    const allLogs = logs || [];

    // --- Engagement Overview ---
    const totalQuestions = allLogs.filter((l) => l.mode === "chat").length;
    const quizAttempts = countQuizAttempts(allLogs);

    // --- Quiz Performance ---
    const quizScores = parseQuizScores(allLogs);
    const avgScore = quizScores.length > 0
      ? Math.round((quizScores.reduce((a, b) => a + b, 0) / quizScores.length) * 100)
      : null;
    const passRate = quizScores.length > 0
      ? Math.round((quizScores.filter((s) => s >= 0.8).length / quizScores.length) * 100)
      : null;

    // --- Knowledge Gaps: pages learners ask about most ---
    const pageCounts = {};
    for (const log of allLogs) {
      const citations = log.citations || [];
      for (const c of citations) {
        if (c.page) pageCounts[c.page] = (pageCounts[c.page] || 0) + 1;
      }
    }
    const knowledgeGaps = Object.entries(pageCounts)
      .map(([page, count]) => ({ page: parseInt(page), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // --- Recent questions (chat mode only, last 5) ---
    const recentQuestions = allLogs
      .filter((l) => l.mode === "chat" && l.user_message !== "Start the quiz")
      .slice(0, 5)
      .map((l) => ({
        question: l.user_message,
        date: l.created_at,
      }));

    return NextResponse.json({
      title: guide.title,
      views: guide.views || 0,
      totalQuestions,
      quizAttempts,
      quizCompleted: quizScores.length,
      avgScore,
      passRate,
      knowledgeGaps,
      recentQuestions,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Count quiz attempts by looking for "Start the quiz" messages
function countQuizAttempts(logs) {
  return logs.filter(
    (l) => l.mode === "quiz" && l.user_message.toLowerCase().includes("start the quiz")
  ).length;
}

// Parse final quiz scores from assistant messages like "Score: 4/5", "3/5", "3 out of 5"
function parseQuizScores(logs) {
  const scores = [];
  const quizLogs = logs.filter((l) => l.mode === "quiz");

  for (const log of quizLogs) {
    const text = log.assistant_message || "";
    // Match patterns: "4/5", "Score: 3/5", "score of 4/5", "3 out of 5"
    const slashMatch = text.match(/(\d)\s*\/\s*5/);
    const outOfMatch = text.match(/(\d)\s+out\s+of\s+5/i);
    const match = slashMatch || outOfMatch;
    if (match) {
      const score = parseInt(match[1]);
      // Only count final scores (messages that contain summary-like language)
      const isFinal = /final|total|overall|complete|finished|results/i.test(text);
      if (isFinal && score >= 0 && score <= 5) {
        scores.push(score / 5);
      }
    }
  }
  return scores;
}
