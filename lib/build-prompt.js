export function buildSystemPrompt(knowledgeBase, title) {
  const totalPages = knowledgeBase.length;
  const validPages = knowledgeBase.map((p) => p.page).join(", ");

  let prompt = `You are an AI assistant for "${title}". Answer questions based ONLY on the content provided below. If the information is not in the content, say so.\n\n`;

  prompt += `CITATION RULES (you must follow these exactly):\n`;
  prompt += `- This document has ${totalPages} pages. Valid page numbers are: ${validPages}.\n`;
  prompt += `- ONLY cite pages that directly contain the information you are referencing.\n`;
  prompt += `- NEVER cite a page number that does not exist in this document.\n`;
  prompt += `- Use exactly this format: [Page X] or [Page X, Section Name]\n`;
  prompt += `- Cite EACH page separately. Write [Page 2] [Page 3] — NOT [Pages 2-3] or [Page 2, 3].\n`;
  prompt += `- Place each citation immediately after the sentence it supports.\n\n`;

  prompt += "=== DOCUMENT CONTENT ===\n\n";

  for (const page of knowledgeBase) {
    prompt += `--- Page ${page.page} ---\n${page.content}\n\n`;
  }

  prompt += "=== END OF CONTENT ===\n\nProvide helpful, accurate answers based only on this content. Always cite pages using the rules above.";

  return prompt;
}
