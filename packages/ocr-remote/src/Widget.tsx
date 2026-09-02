import { useMemo, useState } from "react";
import { createWorker } from "tesseract.js";
import pdfjsLib from "./pdfjs";
import FileDropZone from "./FileDropZone";
import CopyButton from "./CopyButton";
import { styles } from "./styles";
import { downloadBlob, stripExtension } from "./utils/download";
import "./hover.css";

type FileKind = "image" | "pdf";

export default function Widget() {
  const [file, setFile] = useState<File | null>(null);
  const [fileKind, setFileKind] = useState<FileKind | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState<number | null>(null);

  const [pageTexts, setPageTexts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadFile = async (selected: File) => {
    setError(null);
    setPageTexts([]);
    setPageCount(null);
    setCurrentPage(null);

    const kind: FileKind = selected.type === "application/pdf" ? "pdf" : "image";
    setFile(selected);
    setFileKind(kind);

    if (kind === "image") {
      setPreviewUrl(URL.createObjectURL(selected));
      return;
    }

    setPreviewUrl(null);
    try {
      const bytes = new Uint8Array(await selected.arrayBuffer());
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      setPageCount(doc.numPages);
    } catch (err) {
      setError(err instanceof Error ? `Couldn't open PDF: ${err.message}` : "Couldn't open PDF.");
    }
  };

  const reset = () => {
    setFile(null);
    setFileKind(null);
    setPreviewUrl(null);
    setPageCount(null);
    setPageTexts([]);
    setError(null);
  };

  const runOcr = async () => {
    if (!file || !fileKind) return;
    setError(null);
    setIsProcessing(true);
    setPageTexts([]);
    setStatus("Starting up…");
    setProgress(0);

    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        setStatus(m.status);
        setProgress(m.progress ?? 0);
      },
    });

    try {
      if (fileKind === "image") {
        const { data } = await worker.recognize(file);
        setPageTexts([data.text]);
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
        const texts: string[] = [];

        for (let i = 0; i < doc.numPages; i++) {
          setCurrentPage(i + 1);
          const page = await doc.getPage(i + 1);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;

          const { data } = await worker.recognize(canvas);
          texts.push(data.text);
        }
        setPageTexts(texts);
      }
    } catch (err) {
      setError(err instanceof Error ? `OCR failed: ${err.message}` : "OCR failed.");
    } finally {
      await worker.terminate();
      setIsProcessing(false);
      setCurrentPage(null);
    }
  };

  const combinedText = useMemo(() => {
    if (fileKind === "image") return pageTexts[0] ?? "";
    return pageTexts.map((text, i) => `--- Page ${i + 1} ---\n${text}`).join("\n\n");
  }, [fileKind, pageTexts]);

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>OCR</h3>

      {!file ? (
        <FileDropZone
          accept="image/png,image/jpeg,application/pdf"
          label="Drop an image or PDF here, or click to browse"
          onFile={loadFile}
        />
      ) : (
        <div style={styles.preview}>
          {previewUrl && <img src={previewUrl} alt="" style={styles.previewImage} />}
          <span style={styles.previewInfo}>
            {file.name}
            {pageCount !== null && ` · ${pageCount} page${pageCount === 1 ? "" : "s"}`}
          </span>
        </div>
      )}

      {file && (
        <div style={styles.row}>
          <button
            type="button"
            onClick={runOcr}
            disabled={isProcessing}
            className="ocr-primary-button"
            style={{ ...styles.primaryButton, ...(isProcessing ? styles.primaryButtonDisabled : {}) }}
          >
            {isProcessing ? "Running OCR…" : "Run OCR"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={isProcessing}
            className="ocr-secondary-button"
            style={styles.secondaryButton}
          >
            Open a different file
          </button>
        </div>
      )}

      {isProcessing && (
        <div style={styles.progressWrap}>
          <p style={styles.progressLabel}>
            {currentPage !== null && pageCount ? `Page ${currentPage} of ${pageCount} — ` : ""}
            {status} ({Math.round(progress * 100)}%)
          </p>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {pageTexts.length > 0 && (
        <>
          <textarea readOnly value={combinedText} style={styles.textarea} spellCheck={false} />
          <div style={styles.row}>
            <CopyButton text={combinedText} />
            <button
              type="button"
              onClick={() =>
                downloadBlob(
                  new Blob([combinedText], { type: "text/plain" }),
                  `${stripExtension(file?.name ?? "ocr-result")}.txt`
                )
              }
              className="ocr-secondary-button"
              style={styles.secondaryButton}
            >
              Download .txt
            </button>
          </div>
        </>
      )}

      <p style={styles.hint}>
        English text only for now. The first run downloads the OCR engine
        and language data (a few MB) from a CDN; after that it's cached by
        your browser. No image, PDF, or extracted text is ever uploaded —
        recognition runs locally via WebAssembly.
      </p>

      <p style={styles.footer}>
        Rendered by <strong>ocr-remote</strong> · text recognition runs
        locally in your browser via WebAssembly
      </p>
    </div>
  );
}
