import { getDocumentProxy, extractText } from "unpdf";

export async function extractPdfContent(pdfBuffer, apiKey) {
  const pdf = await getDocumentProxy(new Uint8Array(pdfBuffer));
  const { totalPages, text: perPageText } = await extractText(pdf, {
    mergePages: false,
  });

  const pages = [];

  for (let i = 0; i < totalPages; i++) {
    const text = (perPageText[i] || "").trim();

    if (text.length > 0) {
      pages.push({ page: i + 1, content: text });
    } else {
      pages.push({
        page: i + 1,
        content: `[Page ${i + 1} contains images or graphics that could not be extracted as text.]`,
      });
    }
  }

  return pages;
}
