"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export default function PdfViewer({ pdfUrl, currentPage, onPageChange, highlightPulse }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [showPulse, setShowPulse] = useState(false);
  const renderingRef = useRef(false);

  useEffect(() => {
    if (!pdfUrl) return;
    pdfjsLib.getDocument({
      url: pdfUrl,
      standardFontDataUrl: "https://unpkg.com/pdfjs-dist@5.4.624/standard_fonts/",
    }).promise.then((doc) => {
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
    });
  }, [pdfUrl]);

  // Trigger pulse animation when highlightPulse changes
  useEffect(() => {
    if (highlightPulse) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [highlightPulse]);

  const renderPage = useCallback(
    async (pageNum) => {
      if (!pdfDoc || renderingRef.current) return;
      renderingRef.current = true;

      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (!canvas || !container) {
        renderingRef.current = false;
        return;
      }

      const containerWidth = container.clientWidth - 32;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport,
      }).promise;

      renderingRef.current = false;
    },
    [pdfDoc]
  );

  useEffect(() => {
    renderPage(currentPage);
  }, [currentPage, pdfDoc, renderPage]);

  return (
    <div className="pdf-viewer" ref={containerRef}>
      <div className="pdf-toolbar">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
      <div className="pdf-canvas-wrapper">
        <div className={`pdf-canvas-container ${showPulse ? "pdf-pulse" : ""}`}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
