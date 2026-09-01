import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";

const STORAGE_KEY = "devpulse-notes-remote:notes";

function loadNotes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : ["Ship the shell demo", "Wire up the analytics remote"];
  } catch {
    return [];
  }
}

function saveNotes(notes: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // localStorage unavailable (private browsing, etc.) - fail silently
  }
}

export default function Widget() {
  const [notes, setNotes] = useState<string[]>(loadNotes);
  const [draft, setDraft] = useState("");

  const addNote = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    const next = [...notes, trimmed];
    setNotes(next);
    saveNotes(next);
    setDraft("");
  };

  const removeNote = (index: number) => {
    const next = notes.filter((_, i) => i !== index);
    setNotes(next);
    saveNotes(next);
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Notes</h3>

      <form onSubmit={addNote} style={styles.form}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note..."
          style={styles.input}
        />
        <button type="submit" style={styles.addButton}>
          Add
        </button>
      </form>

      <ul style={styles.list}>
        {notes.length === 0 && <li style={styles.empty}>No notes yet.</li>}
        {notes.map((note, i) => (
          <li key={`${note}-${i}`} style={styles.item}>
            <span>{note}</span>
            <button
              type="button"
              onClick={() => removeNote(i)}
              aria-label={`Remove note: ${note}`}
              style={styles.removeButton}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>

      <p style={styles.footer}>
        Rendered by <strong>notes-remote</strong> · state persisted
        independently in this remote's own localStorage
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 10,
    padding: 20,
    color: "#e6edf3",
    maxWidth: 420,
  },
  title: {
    margin: "0 0 16px 0",
    fontSize: 16,
    fontWeight: 700,
  },
  form: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 6,
    padding: "6px 10px",
    color: "#e6edf3",
    fontSize: 13,
    outline: "none",
  },
  addButton: {
    background: "#1f6feb",
    border: "none",
    borderRadius: 6,
    padding: "6px 14px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxHeight: 160,
    overflowY: "auto",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0d1117",
    border: "1px solid #21262d",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 13,
  },
  empty: {
    fontSize: 12,
    color: "#6e7681",
    padding: "6px 2px",
  },
  removeButton: {
    background: "transparent",
    border: "none",
    color: "#6e7681",
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
    padding: "0 4px",
  },
  footer: {
    marginTop: 16,
    fontSize: 11,
    color: "#6e7681",
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  },
};
