import { useState } from "react";
import type { CSSProperties } from "react";

const mockMetricsByRange = {
  "7d": [
    { label: "Page Views", value: 128, max: 200 },
    { label: "Signups", value: 42, max: 60 },
    { label: "Conversion", value: 18, max: 60 },
  ],
  "30d": [
    { label: "Page Views", value: 174, max: 200 },
    { label: "Signups", value: 55, max: 60 },
    { label: "Conversion", value: 24, max: 60 },
  ],
};

export default function Widget() {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const mockMetrics = mockMetricsByRange[range];

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Analytics</h3>
        <div style={styles.tabs}>
          {(["7d", "30d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              style={{ ...styles.tab, ...(range === r ? styles.tabActive : {}) }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.bars}>
        {mockMetrics.map((m) => (
          <div key={m.label} style={styles.barRow}>
            <span style={styles.barLabel}>{m.label}</span>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${(m.value / m.max) * 100}%`,
                }}
              />
            </div>
            <span style={styles.barValue}>{m.value}</span>
          </div>
        ))}
      </div>

      <p style={styles.footer}>
        Rendered by <strong>analytics-remote</strong> · loaded at runtime via
        Module Federation
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
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
  },
  tabs: {
    display: "flex",
    gap: 6,
  },
  tab: {
    background: "transparent",
    border: "1px solid #30363d",
    color: "#8b949e",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  tabActive: {
    border: "1px solid #58a6ff",
    color: "#58a6ff",
  },
  bars: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  barRow: {
    display: "grid",
    gridTemplateColumns: "88px 1fr 32px",
    alignItems: "center",
    gap: 10,
  },
  barLabel: {
    fontSize: 12,
    color: "#8b949e",
  },
  barTrack: {
    background: "#0d1117",
    borderRadius: 4,
    height: 8,
    overflow: "hidden",
  },
  barFill: {
    background: "#58a6ff",
    height: "100%",
    borderRadius: 4,
  },
  barValue: {
    fontSize: 12,
    color: "#e6edf3",
    textAlign: "right",
  },
  footer: {
    marginTop: 16,
    fontSize: 11,
    color: "#6e7681",
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  },
};
