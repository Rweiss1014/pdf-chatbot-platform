export function buildSystemPrompt(knowledgeBase, title) {
  let prompt = `You are an AI assistant for "${title}". Answer questions based ONLY on the content provided below. If the information is not in the content, say so.\n\nWhen referencing information, cite the page using [Page X] or [Page X, Section Name] format.\n\n`;

  prompt += "=== DOCUMENT CONTENT ===\n\n";

  for (const page of knowledgeBase) {
    prompt += `--- Page ${page.page} ---\n${page.content}\n\n`;
  }

  prompt += "=== END OF CONTENT ===\n\nProvide helpful, accurate answers based only on this content. Always cite pages.";

  return prompt;
}
