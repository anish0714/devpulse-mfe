import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { styles } from "../styles";

function findMatches(pattern: string, flags: string, text: string): RegExpExecArray[] {
  const uniqueFlags = Array.from(new Set(flags.split(""))).join("");
  const effectiveFlags = uniqueFlags.includes("g") ? uniqueFlags : `${uniqueFlags}g`;
  const regex = new RegExp(pattern, effectiveFlags);

  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match);
    if (match[0].length === 0) regex.lastIndex += 1;
    if (matches.length >= 500) break;
  }
  return matches;
}

function renderHighlighted(text: string, matches: RegExpExecArray[]): ReactNode[] {
  if (matches.length === 0) return [text];
  const nodes: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index > cursor) nodes.push(text.slice(cursor, m.index));
    nodes.push(
      <mark key={i} style={styles.highlightMark}>
        {m[0] || "​"}
      </mark>
    );
    cursor = m.index + m[0].length;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");

  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [] as RegExpExecArray[], error: null as string | null };
    try {
      return { matches: findMatches(pattern, flags, text), error: null };
    } catch (err) {
      return { matches: [], error: err instanceof Error ? err.message : "Invalid pattern." };
    }
  }, [pattern, flags, text]);

  return (
    <div>
      <label style={styles.label}>Pattern</label>
      <div style={styles.row}>
        <span style={{ color: "#6e7681", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
          /
        </span>
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="\d+"
          style={{ ...styles.input, flex: 1 }}
          spellCheck={false}
        />
        <span style={{ color: "#6e7681", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
          /
        </span>
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="gi"
          style={{ ...styles.input, width: 56 }}
          spellCheck={false}
        />
      </div>

      <label style={styles.label}>Test string</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={styles.textarea}
        spellCheck={false}
      />

      {error && <p style={styles.error}>{error}</p>}

      {!error && text && (
        <div style={{ ...styles.textarea, minHeight: "auto", whiteSpace: "pre-wrap" }}>
          {renderHighlighted(text, matches)}
        </div>
      )}

      {!error && pattern && (
        <p style={styles.hint}>
          {matches.length} match{matches.length === 1 ? "" : "es"}
        </p>
      )}

      {matches.length > 0 && (
        <ul style={styles.matchList}>
          {matches.map((m, i) => (
            <li key={i} style={styles.matchItem}>
              #{i + 1} at index {m.index}: "{m[0]}"
              {m.length > 1 && ` — groups: [${m.slice(1).map((g) => `"${g ?? ""}"`).join(", ")}]`}
            </li>
          ))}
        </ul>
      )}

      <p style={styles.hint}>Uses your browser's native RegExp engine — nothing leaves the page.</p>
    </div>
  );
}
