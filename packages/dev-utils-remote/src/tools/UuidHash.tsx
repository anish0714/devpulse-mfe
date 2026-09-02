import { useState } from "react";
import { styles } from "../styles";
import CopyButton from "../CopyButton";

const hashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type HashAlgorithm = (typeof hashAlgorithms)[number];

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function UuidHash() {
  const [uuidCount, setUuidCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);

  const [hashInput, setHashInput] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [hashOutput, setHashOutput] = useState("");
  const [isHashing, setIsHashing] = useState(false);

  const generateUuids = () => {
    const count = Math.min(Math.max(uuidCount, 1), 50);
    setUuids(Array.from({ length: count }, () => crypto.randomUUID()));
  };

  const computeHash = async () => {
    setIsHashing(true);
    try {
      const bytes = new TextEncoder().encode(hashInput);
      const digest = await crypto.subtle.digest(algorithm, bytes);
      setHashOutput(bufferToHex(digest));
    } finally {
      setIsHashing(false);
    }
  };

  return (
    <div>
      <label style={styles.label}>UUID Generator</label>
      <div style={styles.row}>
        <input
          type="number"
          min={1}
          max={50}
          value={uuidCount}
          onChange={(e) => setUuidCount(Number(e.target.value) || 1)}
          style={{ ...styles.input, width: 64 }}
        />
        <button
          type="button"
          onClick={generateUuids}
          className="du-primary-button"
          style={styles.primaryButton}
        >
          Generate
        </button>
        <CopyButton text={uuids.join("\n")} />
      </div>
      {uuids.length > 0 && (
        <textarea
          readOnly
          value={uuids.join("\n")}
          style={{ ...styles.textarea, minHeight: 80 }}
          spellCheck={false}
        />
      )}

      <div style={{ borderTop: "1px solid #21262d", margin: "18px 0" }} />

      <label style={styles.label}>Hash Generator</label>
      <textarea
        value={hashInput}
        onChange={(e) => setHashInput(e.target.value)}
        placeholder="Text to hash"
        style={styles.textarea}
        spellCheck={false}
      />
      <div style={styles.row}>
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)}
          style={styles.select}
        >
          {hashAlgorithms.map((alg) => (
            <option key={alg} value={alg}>
              {alg}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={computeHash}
          disabled={!hashInput || isHashing}
          className="du-primary-button"
          style={styles.primaryButton}
        >
          {isHashing ? "Hashing…" : "Compute hash"}
        </button>
        <CopyButton text={hashOutput} />
      </div>
      {hashOutput && (
        <textarea
          readOnly
          value={hashOutput}
          style={{ ...styles.textarea, minHeight: 60 }}
          spellCheck={false}
        />
      )}

      <p style={styles.hint}>
        UUIDs and hashes are generated with the browser's built-in
        <code> crypto</code> API. MD5 isn't offered since the Web Crypto API
        doesn't support it — SHA-1/256/384/512 only.
      </p>
    </div>
  );
}
