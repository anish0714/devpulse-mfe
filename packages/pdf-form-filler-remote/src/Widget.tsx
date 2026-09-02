import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import pdfjsLib from "./pdfjs";
import FileDropZone from "./FileDropZone";
import { styles } from "./styles";
import { downloadBlob, stripExtension } from "./utils/download";
import { applyFieldValues, describeFields, initialValues } from "./formFields";
import type { FieldDescriptor, FieldValue } from "./formFields";
import "./hover.css";

const DISPLAY_WIDTH = 260;

export default function Widget() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [originalBytes, setOriginalBytes] = useState<ArrayBuffer | null>(null);
  const [fields, setFields] = useState<FieldDescriptor[] | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(buffer.slice(0));
      const descriptors = describeFields(pdfLibDoc);

      const bytesForPdfJs = new Uint8Array(buffer.slice(0));
      const doc = await pdfjsLib.getDocument({ data: bytesForPdfJs }).promise;

      setFileName(file.name);
      setOriginalBytes(buffer);
      setFields(descriptors);
      setValues(initialValues(descriptors));
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setPageIndex(0);
    } catch (err) {
      setError(err instanceof Error ? `Couldn't open PDF: ${err.message}` : "Couldn't open PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFileName(null);
    setOriginalBytes(null);
    setFields(null);
    setValues({});
    setPdfDoc(null);
    setPageCount(0);
    setError(null);
  };

  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;

    (async () => {
      const page = await pdfDoc.getPage(pageIndex + 1);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = DISPLAY_WIDTH / unscaled.width;
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

  const setValue = (name: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const save = async () => {
    if (!originalBytes) return;
    setError(null);
    setIsSaving(true);
    try {
      const doc = await PDFDocument.load(originalBytes);
      applyFieldValues(doc, values);
      const bytes = await doc.save();
      downloadBlob(
        new Blob([bytes.slice()], { type: "application/pdf" }),
        `${stripExtension(fileName ?? "form")}-filled.pdf`
      );
    } catch (err) {
      setError(err instanceof Error ? `Save failed: ${err.message}` : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const fillableFields = fields?.filter((f) => f.kind !== "unsupported") ?? [];

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>PDF Form Filler</h3>

      {!fields ? (
        <>
          <FileDropZone
            accept="application/pdf"
            label={isLoading ? "Loading…" : "Drop a PDF form here, or click to browse"}
            onFile={loadFile}
          />
          {error && <p style={styles.error}>{error}</p>}
          <p style={styles.hint}>
            Fills real, interactive PDF form fields (text, checkboxes, radio
            buttons, dropdowns) and saves a new PDF with your answers — all
            in your browser, nothing is uploaded.
          </p>
        </>
      ) : fillableFields.length === 0 ? (
        <>
          <p style={styles.error}>
            This PDF doesn't contain any fillable form fields.
          </p>
          <p style={styles.hint}>
            Not every form-looking PDF has real interactive fields — scanned
            or flattened documents just draw blank lines with no underlying
            data. Try the PDF Manipulation Tool instead: its Text tool lets
            you click anywhere on the page and type, which works on any PDF.
          </p>
          <button
            type="button"
            onClick={reset}
            className="pff-secondary-button"
            style={{ ...styles.secondaryButton, marginTop: 12 }}
          >
            Open a different PDF
          </button>
        </>
      ) : (
        <>
          <div style={styles.layout}>
            <div style={styles.previewColumn}>
              <div style={styles.previewNav}>
                <button
                  type="button"
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  disabled={pageIndex === 0}
                  className="pff-nav-button"
                  style={{ ...styles.navButton, ...(pageIndex === 0 ? styles.navButtonDisabled : {}) }}
                >
                  ← Prev
                </button>
                <span>
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
                  disabled={pageIndex === pageCount - 1}
                  className="pff-nav-button"
                  style={{
                    ...styles.navButton,
                    ...(pageIndex === pageCount - 1 ? styles.navButtonDisabled : {}),
                  }}
                >
                  Next →
                </button>
              </div>
              <div style={{ ...styles.canvasWrap, width: pageSize.width, height: pageSize.height }}>
                <canvas ref={canvasRef} />
              </div>
              <p style={styles.hint}>Preview only — fill in the fields to the right.</p>
            </div>

            <div style={styles.fieldsColumn}>
              {fields.map((field) => {
                if (field.kind === "unsupported") {
                  return (
                    <div key={field.name} style={styles.fieldGroup}>
                      <span style={styles.unsupportedField}>
                        {field.name} (unsupported field type — button/signature)
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={field.name} style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>{field.name}</label>

                    {field.kind === "text" &&
                      (field.multiline ? (
                        <textarea
                          value={values[field.name] as string}
                          onChange={(e) => setValue(field.name, e.target.value)}
                          maxLength={field.maxLength}
                          style={{ ...styles.textInput, minHeight: 70, resize: "vertical" }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[field.name] as string}
                          onChange={(e) => setValue(field.name, e.target.value)}
                          maxLength={field.maxLength}
                          style={styles.textInput}
                        />
                      ))}

                    {field.kind === "checkbox" && (
                      <div style={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={values[field.name] as boolean}
                          onChange={(e) => setValue(field.name, e.target.checked)}
                        />
                        <span style={{ fontSize: 13, color: "#8b949e" }}>
                          {values[field.name] ? "Checked" : "Unchecked"}
                        </span>
                      </div>
                    )}

                    {field.kind === "radio" &&
                      field.options.map((option) => (
                        <label key={option} style={styles.radioOption}>
                          <input
                            type="radio"
                            name={field.name}
                            checked={values[field.name] === option}
                            onChange={() => setValue(field.name, option)}
                          />
                          {option}
                        </label>
                      ))}

                    {field.kind === "dropdown" && (
                      <select
                        value={values[field.name] as string}
                        onChange={(e) => setValue(field.name, e.target.value)}
                        style={styles.select}
                      >
                        <option value="">—</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.kind === "optionlist" && (
                      <select
                        multiple
                        value={values[field.name] as string[]}
                        onChange={(e) =>
                          setValue(
                            field.name,
                            Array.from(e.target.selectedOptions, (o) => o.value)
                          )
                        }
                        style={{ ...styles.select, height: Math.min(120, field.options.length * 24 + 16) }}
                      >
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.actionsRow}>
            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="pff-primary-button"
              style={{ ...styles.primaryButton, ...(isSaving ? styles.primaryButtonDisabled : {}) }}
            >
              {isSaving ? "Saving…" : "Save & download filled PDF"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="pff-secondary-button"
              style={styles.secondaryButton}
            >
              Open a different PDF
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}
        </>
      )}

      <p style={styles.footer}>
        Rendered by <strong>pdf-form-filler-remote</strong> · form detection
        and filling both run locally in your browser, nothing is uploaded
      </p>
    </div>
  );
}
