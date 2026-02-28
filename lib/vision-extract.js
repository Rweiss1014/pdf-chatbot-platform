import OpenAI from "openai";

export async function extractPdfContent(pdfBuffer, apiKey) {
  const client = new OpenAI({ apiKey });

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableFontFace: true,
    useSystemFonts: false,
  }).promise;
  const numPages = doc.numPages;
  const pages = [];
  const hasOffscreenCanvas = typeof OffscreenCanvas !== "undefined";

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);

    // Always try text extraction first — it's fast and works on Vercel
    const textContent = await page.getTextContent();
    const textItems = textContent.items;

    // Build structured text preserving some layout
    let text = "";
    let lastY = null;
    for (const item of textItems) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        text += "\n";
      }
      text += item.str;
      lastY = item.transform[5];
    }
    text = text.trim();

    // If we got meaningful text, use it directly
    if (text.length > 50) {
      pages.push({ page: i, content: text });
      continue;
    }

    // For image-heavy pages, try Vision API with OffscreenCanvas
    if (hasOffscreenCanvas) {
      try {
        const viewport = page.getViewport({ scale: 2 });
        const canvas = new OffscreenCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext("2d");

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
                  text: "Extract ALL text from this page image. Include headings, body text, bullet points, captions, and any other readable content. Preserve the structure and formatting. If there are diagrams or images, describe them briefly.",
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
        continue;
      } catch (err) {
        console.error(`Vision extraction failed for page ${i}:`, err.message);
      }
    }

    // Last resort: use whatever text we got, or a placeholder
    if (text.length > 0) {
      pages.push({ page: i, content: text });
    } else {
      pages.push({
        page: i,
        content: `[Page ${i} contains images or graphics that could not be extracted as text.]`,
      });
    }
  }

  return pages;
}
