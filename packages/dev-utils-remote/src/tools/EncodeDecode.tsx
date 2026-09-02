import { useMemo, useState } from "react";
import { styles } from "../styles";
import CopyButton from "../CopyButton";
import { base64ToUtf8, utf8ToBase64 } from "../utils/base64";

const modes = {
  base64Encode: { label: "Base64 Encode" },
  base64Decode: { label: "Base64 Decode" },
  urlEncode: { label: "URL Encode" },
  urlDecode: { label: "URL Decode" },
} as const;

type ModeKey = keyof typeof modes;

function run(mode: ModeKey, input: string): { output: string; error: string | null } {
  if (!input) return { output: "", error: null };
  try {
    switch (mode) {
      case "base64Encode":
        return { output: utf8ToBase64(input), error: null };
      case "base64Decode":
        return { output: base64ToUtf8(input), error: null };
      case "urlEncode":
        return { output: encodeURIComponent(input), error: null };
      case "urlDecode":
        return { output: decodeURIComponent(input), error: null };
    }
  } catch (err) {
    return { output: "", error: err instanceof Error ? err.message : "Couldn't process input." };
  }
}

export default function EncodeDecode() {
  const [mode, setMode] = useState<ModeKey>("base64Encode");
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => run(mode, input), [mode, input]);

  return (
    <div>
      <nav style={styles.tabs}>
        {(Object.keys(modes) as ModeKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`du-tab${mode === key ? " du-tab-active" : ""}`}
            style={{ ...styles.tab, ...(mode === key ? styles.tabActive : {}) }}
          >
            {modes[key].label}
          </button>
        ))}
      </nav>

      <label style={styles.label}>Input</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={styles.textarea}
        spellCheck={false}
      />

      <div style={{ ...styles.field, marginTop: 14 }}>
        <label style={styles.label}>Output</label>
        <textarea readOnly value={output} style={styles.textarea} spellCheck={false} />
      </div>

      <div style={styles.row}>
        <CopyButton text={output} />
        <button
          type="button"
          onClick={() => setInput(output)}
          disabled={!output}
          className="du-secondary-button"
          style={styles.secondaryButton}
        >
          Use output as input
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      <p style={styles.hint}>Runs locally via the browser's built-in encoders — nothing is sent anywhere.</p>
    </div>
  );
}
