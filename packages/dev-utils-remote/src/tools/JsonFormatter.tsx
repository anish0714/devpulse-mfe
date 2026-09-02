import { useMemo, useState } from "react";
import { styles } from "../styles";
import CopyButton from "../CopyButton";

export default function JsonFormatter() {
  const [input, setInput] = useState("");

  const validity = useMemo(() => {
    if (!input.trim()) return { valid: null as boolean | null, message: "" };
    try {
      JSON.parse(input);
      return { valid: true, message: "Valid JSON" };
    } catch (err) {
      return { valid: false, message: err instanceof Error ? err.message : "Invalid JSON" };
    }
  }, [input]);

  const format = (indent: number | null) => {
    try {
      const parsed = JSON.parse(input);
      setInput(indent === null ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent));
    } catch {
      // validity message above already surfaces the parse error
    }
  };

  return (
    <div>
      <label style={styles.label}>JSON</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='{"hello": "world"}'
        style={{
          ...styles.textarea,
          minHeight: 220,
          ...(validity.valid === false ? styles.textareaError : {}),
        }}
        spellCheck={false}
      />

      <div style={styles.row}>
        <button
          type="button"
          onClick={() => format(2)}
          className="du-primary-button"
          style={styles.primaryButton}
        >
          Format
        </button>
        <button
          type="button"
          onClick={() => format(null)}
          className="du-secondary-button"
          style={styles.secondaryButton}
        >
          Minify
        </button>
        <CopyButton text={input} />
      </div>

      {validity.valid === true && <p style={styles.success}>{validity.message}</p>}
      {validity.valid === false && <p style={styles.error}>{validity.message}</p>}
      <p style={styles.hint}>Formats, minifies, and validates JSON entirely in your browser.</p>
    </div>
  );
}
