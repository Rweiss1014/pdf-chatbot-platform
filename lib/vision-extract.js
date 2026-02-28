import OpenAI from "openai";

export async function extractPdfContent(pdfBuffer, apiKey) {
  const client = new OpenAI({ apiKey });

  // Use pdfjs-dist to convert PDF pages to images
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const numPages = doc.numPages;
  const pages = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });

    // Create a simple canvas using OffscreenCanvas (available in Node 20+)
    let canvas, ctx;
    if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(viewport.width, viewport.height);
      ctx = canvas.getContext("2d");
    } else {
      // Fallback: try to extract text directly
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item) => item.str).join(" ");
      if (text.trim().length > 20) {
        pages.push({ page: i, content: text.trim() });
        continue;
      }
      // If no text, we'll send a placeholder
      pages.push({
        page: i,
        content: `[Page ${i} - Image content. Unable to extract text server-side. Please describe what's on this page.]`,
      });
      continue;
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await canvas.convertToBlob({ type: "image/png" });
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL text from this page image. Include headings, body text, bullet points, captions, and any other readable content. Preserve the structure and formatting. If there are diagrams or images, describe them briefly.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    pages.push({
      page: i,
      content: response.choices[0].message.content,
    });
  }

  return pages;
}
