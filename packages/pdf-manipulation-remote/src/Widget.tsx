import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import pdfjsLib from "./pdfjs";
import FileDropZone from "./FileDropZone";
import { styles } from "./styles";
import { downloadBlob, stripExtension } from "./utils/download";
import { hexToRgbUnit } from "./utils/color";
import { nextId } from "./annotations";
import type { Annotation, ToolMode } from "./annotations";
import "./hover.css";

const DISPLAY_WIDTH = 400;

interface DragRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function Widget() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [originalBytes, setOriginalBytes] = useState<ArrayBuffer | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const pageScalesRef = useRef<Record<number, number>>({});

  const [deletedPages, setDeletedPages] = useState<Set<number>>(new Set());
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<ToolMode>("none");
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState("#000000");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragRect, setDragRect] = useState<DragRect | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytesForPdfJs = new Uint8Array(buffer.slice(0));
      const doc = await pdfjsLib.getDocument({ data: bytesForPdfJs }).promise;

      setFileName(file.name);
      setOriginalBytes(buffer);
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setPageIndex(0);
      setDeletedPages(new Set());
      setAnnotations([]);
      pageScalesRef.current = {};
    } catch (err) {
      setError(
        err instanceof Error ? `Couldn't open PDF: ${err.message}` : "Couldn't open PDF."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;

    (async () => {
      const page = await pdfDoc.getPage(pageIndex + 1);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = DISPLAY_WIDTH / unscaled.width;
      pageScalesRef.current[pageIndex] = scale;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (!cancelled) setPageSize({ width: viewport.width, height: viewport.height });
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageIndex]);

  const goToPage = (target: number) => {
    let idx = target;
    while (idx >= 0 && idx < pageCount && deletedPages.has(idx)) {
      idx += target > pageIndex ? 1 : -1;
    }
    if (idx >= 0 && idx < pageCount && !deletedPages.has(idx)) {
      setEditingId(null);
      setPageIndex(idx);
    }
  };

  const remainingPages = pageCount - deletedPages.size;

  const deleteCurrentPage = () => {
    if (remainingPages <= 1) return;
    const next = new Set(deletedPages);
    next.add(pageIndex);
    setDeletedPages(next);
    setAnnotations((prev) => prev.filter((a) => a.pageIndex !== pageIndex));

    let target = pageIndex + 1;
    while (target < pageCount && next.has(target)) target += 1;
    if (target >= pageCount) {
      target = pageIndex - 1;
      while (target >= 0 && next.has(target)) target -= 1;
    }
    setEditingId(null);
    if (target >= 0) setPageIndex(target);
  };

  const undo = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const getRelativeCoords = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleOverlayMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (tool === "none") return;
    const { x, y } = getRelativeCoords(e);

    if (tool === "text") {
      const id = nextId();
      setAnnotations((prev) => [
        ...prev,
        { id, type: "text", pageIndex, x, y, text: "", fontSize, color },
      ]);
      setEditingId(id);
      setTool("none");
      return;
    }

    dragStart.current = { x, y };
    setDragRect({ x, y, width: 0, height: 0 });
  };

  const handleOverlayMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const { x, y } = getRelativeCoords(e);
    const start = dragStart.current;
    setDragRect({
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y),
    });
  };

  const handleOverlayMouseUp = () => {
    if (!dragStart.current || !dragRect) {
      dragStart.current = null;
      return;
    }
    if (dragRect.width > 4 && dragRect.height > 4 && (tool === "highlight" || tool === "redact")) {
      setAnnotations((prev) => [
        ...prev,
        {
          id: nextId(),
          type: "rect",
          pageIndex,
          x: dragRect.x,
          y: dragRect.y,
          width: dragRect.width,
          height: dragRect.height,
          mode: tool,
        },
      ]);
    }
    dragStart.current = null;
    setDragRect(null);
    setTool("none");
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateText = (id: string, text: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id && a.type === "text" ? { ...a, text } : a))
    );
  };

  const commitTextEdit = (id: string) => {
    setAnnotations((prev) =>
      prev.filter((a) => !(a.id === id && a.type === "text" && a.text.trim() === ""))
    );
    setEditingId(null);
  };

  const save = async () => {
    if (!originalBytes) return;
    setError(null);
    setIsSaving(true);
    try {
      const pdfLibDoc = await PDFDocument.load(originalBytes);
      const pages = pdfLibDoc.getPages();
      const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);

      for (const ann of annotations) {
        const page = pages[ann.pageIndex];
        if (!page) continue;
        const scale = pageScalesRef.current[ann.pageIndex] ?? 1;
        const pageHeightPt = page.getHeight();

        if (ann.type === "text") {
          if (!ann.text.trim()) continue;
          const fontSizePt = ann.fontSize / scale;
          const xPt = ann.x / scale;
          const yPt = pageHeightPt - ann.y / scale - fontSizePt;
          const { r, g, b } = hexToRgbUnit(ann.color);
          page.drawText(ann.text, {
            x: xPt,
            y: yPt,
            size: fontSizePt,
            font,
            color: rgb(r, g, b),
            lineHeight: fontSizePt * 1.2,
          });
        } else {
          const wPt = ann.width / scale;
          const hPt = ann.height / scale;
          const xPt = ann.x / scale;
          const yPt = pageHeightPt - ann.y / scale - hPt;
          if (ann.mode === "redact") {
            page.drawRectangle({ x: xPt, y: yPt, width: wPt, height: hPt, color: rgb(0, 0, 0) });
          } else {
            page.drawRectangle({
              x: xPt,
              y: yPt,
              width: wPt,
              height: hPt,
              color: rgb(1, 0.92, 0.2),
              opacity: 0.4,
            });
          }
        }
      }

      const indicesToDelete = Array.from(deletedPages).sort((a, b) => b - a);
      for (const idx of indicesToDelete) pdfLibDoc.removePage(idx);

      const bytes = await pdfLibDoc.save();
      downloadBlob(
        new Blob([bytes.slice()], { type: "application/pdf" }),
        `${stripExtension(fileName ?? "document")}-edited.pdf`
      );
    } catch (err) {
      setError(err instanceof Error ? `Save failed: ${err.message}` : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>PDF Manipulation Tool</h3>

      {!pdfDoc ? (
        <>
          <FileDropZone
            accept="application/pdf"
            label={isLoading ? "Loading…" : "Drop a PDF here, or click to browse"}
            onFile={loadFile}
          />
          {error && <p style={styles.error}>{error}</p>}
          <p style={styles.hint}>
            Add text, highlight, or redact content, remove pages, then save a
            new PDF — all in your browser, nothing is uploaded.
          </p>
        </>
      ) : (
        <>
          <div style={styles.toolbar}>
            <button
              type="button"
              onClick={() => setTool(tool === "text" ? "none" : "text")}
              className={`pm-tool-button${tool === "text" ? " pm-tool-button-active" : ""}`}
              style={{ ...styles.toolButton, ...(tool === "text" ? styles.toolButtonActive : {}) }}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setTool(tool === "highlight" ? "none" : "highlight")}
              className={`pm-tool-button${tool === "highlight" ? " pm-tool-button-active" : ""}`}
              style={{
                ...styles.toolButton,
                ...(tool === "highlight" ? styles.toolButtonActive : {}),
              }}
            >
              Highlight
            </button>
            <button
              type="button"
              onClick={() => setTool(tool === "redact" ? "none" : "redact")}
              className={`pm-tool-button${tool === "redact" ? " pm-tool-button-active" : ""}`}
              style={{ ...styles.toolButton, ...(tool === "redact" ? styles.toolButtonActive : {}) }}
            >
              Redact
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={annotations.length === 0}
              className="pm-tool-button"
              style={styles.toolButton}
            >
              Undo
            </button>
            <button
              type="button"
              onClick={deleteCurrentPage}
              disabled={remainingPages <= 1}
              className="pm-tool-button pm-tool-button-danger"
              style={{ ...styles.toolButton, ...styles.toolButtonDanger }}
            >
              Delete page
            </button>
          </div>

          <div style={styles.toolbar}>
            <label style={{ fontSize: 12, color: "#8b949e", display: "flex", alignItems: "center", gap: 4 }}>
              Size
              <input
                type="number"
                min={8}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value) || 16)}
                style={{ width: 48 }}
              />
            </label>
            <label style={{ fontSize: 12, color: "#8b949e", display: "flex", alignItems: "center", gap: 4 }}>
              Color
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>
          </div>

          <div style={styles.pageNav}>
            <button
              type="button"
              onClick={() => goToPage(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="pm-nav-button"
              style={{ ...styles.navButton, ...(pageIndex === 0 ? styles.navButtonDisabled : {}) }}
            >
              ← Prev
            </button>
            <span>
              Page {pageIndex + 1} of {pageCount}
              {deletedPages.size > 0 ? ` (${remainingPages} kept)` : ""}
            </span>
            <button
              type="button"
              onClick={() => goToPage(pageIndex + 1)}
              disabled={pageIndex === pageCount - 1}
              className="pm-nav-button"
              style={{
                ...styles.navButton,
                ...(pageIndex === pageCount - 1 ? styles.navButtonDisabled : {}),
              }}
            >
              Next →
            </button>
          </div>

          <div
            style={{ ...styles.canvasWrap, width: pageSize.width, height: pageSize.height }}
          >
            <canvas ref={canvasRef} />
            <div
              style={{
                ...styles.overlay,
                cursor: tool === "none" ? "default" : "crosshair",
              }}
              onMouseDown={handleOverlayMouseDown}
              onMouseMove={handleOverlayMouseMove}
              onMouseUp={handleOverlayMouseUp}
            >
              {pageAnnotations.map((ann) =>
                ann.type === "text" ? (
                  <div key={ann.id} style={{ position: "absolute", left: ann.x, top: ann.y }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      {editingId === ann.id ? (
                        <textarea
                          autoFocus
                          wrap="off"
                          rows={Math.max(1, ann.text.split("\n").length)}
                          value={ann.text}
                          onChange={(e) => updateText(ann.id, e.target.value)}
                          onBlur={() => commitTextEdit(ann.id)}
                          style={{
                            ...styles.textAnnotation,
                            ...styles.textAnnotationEditing,
                            position: "static",
                            fontSize: ann.fontSize,
                            color: ann.color,
                            minWidth: 100,
                          }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => setEditingId(ann.id)}
                          style={{
                            ...styles.textAnnotation,
                            position: "static",
                            fontSize: ann.fontSize,
                            color: ann.color,
                          }}
                        >
                          {ann.text}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAnnotation(ann.id)}
                        aria-label="Remove annotation"
                        className="pm-annotation-remove"
                        style={styles.annotationRemove}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={ann.id} style={{ position: "absolute", left: ann.x, top: ann.y }}>
                    <div style={{ position: "relative", width: ann.width, height: ann.height }}>
                      <div
                        style={{
                          ...styles.rectAnnotation,
                          left: 0,
                          top: 0,
                          width: ann.width,
                          height: ann.height,
                          background:
                            ann.mode === "redact" ? "#000" : "rgba(255, 235, 51, 0.4)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeAnnotation(ann.id)}
                        aria-label="Remove annotation"
                        className="pm-annotation-remove"
                        style={styles.annotationRemove}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                )
              )}

              {dragRect && (
                <div
                  style={{
                    position: "absolute",
                    left: dragRect.x,
                    top: dragRect.y,
                    width: dragRect.width,
                    height: dragRect.height,
                    border: "1px dashed #1f6feb",
                    background:
                      tool === "redact" ? "rgba(0,0,0,0.3)" : "rgba(255, 235, 51, 0.3)",
                  }}
                />
              )}
            </div>
          </div>

          <div style={styles.actionsRow}>
            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="pm-primary-button"
              style={{ ...styles.primaryButton, ...(isSaving ? styles.primaryButtonDisabled : {}) }}
            >
              {isSaving ? "Saving…" : "Save & download PDF"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPdfDoc(null);
                setOriginalBytes(null);
                setFileName(null);
                setAnnotations([]);
              }}
              className="pm-tool-button"
              style={styles.toolButton}
            >
              Open a different PDF
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}
          <p style={styles.hint}>
            Select Text/Highlight/Redact, then click (or click-drag) on the
            page. Double-click text to edit it. Redact draws an opaque box
            over the content visually — the underlying text isn't removed
            from the file, so don't rely on it to erase sensitive data that
            must be unrecoverable.
          </p>
        </>
      )}

      <p style={styles.footer}>
        Rendered by <strong>pdf-manipulation-remote</strong> · editing and
        export both run locally in your browser, nothing is uploaded
      </p>
    </div>
  );
}
