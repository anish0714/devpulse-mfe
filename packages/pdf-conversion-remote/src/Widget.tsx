import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import FileDropZone from "./FileDropZone";
import { styles } from "./styles";
import { downloadBlob, stripExtension } from "./utils/download";
import "./hover.css";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
// Renders the document at a fixed pixel width before rasterizing, so
// html2canvas has a stable layout to measure regardless of viewport size.
const RENDER_WIDTH_PX = 794;

const operations = {
  imagesToPdf: {
    label: "Images → PDF",
    accept: "image/png,image/jpeg",
    multiple: true,
    dropLabel: "Drop JPG/PNG images here, or click to browse",
    hint: "Pages are ordered as listed below and sized to match each image.",
    buttonLabel: (count: number) => `Convert ${count || ""} to PDF`,
    minFiles: 1,
  },
  wordToPdf: {
    label: "Word → PDF",
    accept: ".docx",
    multiple: false,
    dropLabel: "Drop a .docx file here, or click to browse",
    hint: "Text and basic formatting carry over (headings, bold/italic, lists). Complex layouts may render approximately, since the document is rasterized in-browser. Only .docx is supported.",
    buttonLabel: () => "Convert to PDF",
    minFiles: 1,
  },
  mergePdfs: {
    label: "Merge PDFs",
    accept: "application/pdf",
    multiple: true,
    dropLabel: "Drop 2+ PDF files here, or click to browse",
    hint: "Files are merged in the order shown. Use ↑/↓ to reorder before merging.",
    buttonLabel: () => "Merge into one PDF",
    minFiles: 2,
  },
} as const;

type OperationKey = keyof typeof operations;

async function imagesToPdfBytes(files: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const image =
      file.type === "image/png"
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return pdfDoc.save();
}

async function mergePdfBytes(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  return mergedPdf.save();
}

async function wordToPdfBytes(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

  const container = document.createElement("div");
  container.innerHTML = html;
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "-99999px",
    width: `${RENDER_WIDTH_PX}px`,
    padding: "32px",
    background: "#ffffff",
    color: "#000000",
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: "14px",
    lineHeight: "1.5",
  } as CSSStyleDeclaration);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      windowWidth: RENDER_WIDTH_PX,
    });

    const pdf = new jsPDF("p", "pt", "a4");
    const imgWidth = A4_WIDTH_PT;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= A4_HEIGHT_PT;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= A4_HEIGHT_PT;
    }

    return new Uint8Array(pdf.output("arraybuffer") as ArrayBuffer);
  } finally {
    document.body.removeChild(container);
  }
}

export default function Widget() {
  const [operation, setOperation] = useState<OperationKey>("imagesToPdf");
  const [files, setFiles] = useState<File[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = operations[operation];

  const selectOperation = (key: OperationKey) => {
    setOperation(key);
    setFiles([]);
    setError(null);
  };

  const addFiles = (newFiles: File[]) => {
    setError(null);
    setFiles((prev) => (config.multiple ? [...prev, ...newFiles] : newFiles.slice(0, 1)));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const run = async () => {
    setError(null);
    setIsWorking(true);
    try {
      if (operation === "imagesToPdf") {
        const bytes = await imagesToPdfBytes(files);
        downloadBlob(new Blob([bytes.slice()], { type: "application/pdf" }), "images.pdf");
      } else if (operation === "mergePdfs") {
        const bytes = await mergePdfBytes(files);
        downloadBlob(new Blob([bytes.slice()], { type: "application/pdf" }), "merged.pdf");
      } else {
        const bytes = await wordToPdfBytes(files[0]);
        downloadBlob(
          new Blob([bytes.slice()], { type: "application/pdf" }),
          `${stripExtension(files[0].name)}.pdf`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? `Failed: ${err.message}` : "Operation failed.");
    } finally {
      setIsWorking(false);
    }
  };

  const canRun = files.length >= config.minFiles && !isWorking;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>PDF Conversion Tool</h3>

      <nav style={styles.tabs}>
        {(Object.keys(operations) as OperationKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => selectOperation(key)}
            className={`pc-tab${operation === key ? " pc-tab-active" : ""}`}
            style={{
              ...styles.tab,
              ...(operation === key ? styles.tabActive : {}),
            }}
          >
            {operations[key].label}
          </button>
        ))}
      </nav>

      <FileDropZone
        accept={config.accept}
        multiple={config.multiple}
        label={config.dropLabel}
        onFiles={addFiles}
      />

      {files.length > 0 && (
        <ul style={styles.fileList}>
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} style={styles.fileItem}>
              <span style={styles.fileName}>
                {config.multiple ? `${i + 1}. ` : ""}
                {file.name}
              </span>
              <span style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                {operation === "mergePdfs" && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${file.name} up`}
                      className="pc-remove-button"
                      style={styles.removeButton}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === files.length - 1}
                      aria-label={`Move ${file.name} down`}
                      className="pc-remove-button"
                      style={styles.removeButton}
                    >
                      ↓
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${file.name}`}
                  className="pc-remove-button"
                  style={styles.removeButton}
                >
                  &times;
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={run}
        disabled={!canRun}
        className="pc-primary-button"
        style={{
          ...styles.primaryButton,
          ...(canRun ? {} : styles.primaryButtonDisabled),
        }}
      >
        {isWorking ? "Working…" : config.buttonLabel(files.length)}
      </button>

      {error && <p style={styles.error}>{error}</p>}
      <p style={styles.hint}>{config.hint}</p>

      <p style={styles.footer}>
        Rendered by <strong>pdf-conversion-remote</strong> · all conversion
        runs locally in your browser, nothing is uploaded
      </p>
    </div>
  );
}
