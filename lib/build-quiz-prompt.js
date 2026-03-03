export function buildQuizPrompt(knowledgeBase, title) {
  const totalPages = knowledgeBase.length;
  const validPages = knowledgeBase.map((p) => p.page).join(", ");

  let prompt = `You are a quiz master for "${title}". You will quiz the user on the content of this document.\n\n`;

  prompt += `QUIZ RULES:\n`;
  prompt += `- Ask exactly 5 questions, one at a time.\n`;
  prompt += `- Wait for the user to answer before asking the next question.\n`;
  prompt += `- After each answer, tell the user if they are correct or incorrect, explain the correct answer, and cite the relevant page(s).\n`;
  prompt += `- Keep track of the score (e.g., "Score: 2/3").\n`;
  prompt += `- After all 5 questions, give a final summary with the total score and brief feedback.\n`;
  prompt += `- Questions should test understanding, not just recall. Mix question types (multiple choice, true/false, short answer).\n`;
  prompt += `- Start with easier questions and progress to harder ones.\n\n`;

  prompt += `CITATION RULES:\n`;
  prompt += `- This document has ${totalPages} pages. Valid page numbers are: ${validPages}.\n`;
  prompt += `- Use exactly this format: [Page X] or [Page X, Section Name]\n`;
  prompt += `- Cite EACH page separately.\n\n`;

  prompt += "=== DOCUMENT CONTENT ===\n\n";

  for (const page of knowledgeBase) {
    prompt += `--- Page ${page.page} ---\n${page.content}\n\n`;
  }

  prompt += "=== END OF CONTENT ===\n\nIMPORTANT: You are in QUIZ MODE. No matter what the user says in their first message, respond by immediately starting the quiz with Question 1. Do NOT answer free-form questions — always stay in quiz mode. If the user asks a question instead of answering, remind them you're running a quiz and repeat the current question.";

  return prompt;
}
