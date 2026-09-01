import type { CSSProperties } from "react";

interface ToolSummary {
  key: string;
  label: string;
  description: string;
}

interface Props {
  tools: ToolSummary[];
  onOpenTool: (key: string) => void;
}

export default function Introduction({ tools, onOpenTool }: Props) {
  return (
    <div style={styles.wrap}>
      <h2 style={styles.heading}>Welcome to DevPulse</h2>
      <p style={styles.lead}>
        This isn't just an architecture demo — it's a small toolbox of real,
        usable tools. Pick one from the left to get started: each tool runs
        entirely in your browser, so your files never leave your machine.
      </p>

      <p style={styles.paragraph}>
        Under the hood, every tool in the sidebar is its own{" "}
        <strong>independently built and independently deployed</strong> React
        app, loaded into this shell at runtime via Webpack Module
        Federation — not bundled together at build time. That's what lets a
        tool ship on its own schedule without touching the rest of the app.
      </p>

      <h3 style={styles.subheading}>Available tools</h3>
      <div style={styles.cards}>
        {tools.map((tool) => (
          <button
            key={tool.key}
            type="button"
            onClick={() => onOpenTool(tool.key)}
            className="dp-tool-card"
            style={styles.card}
          >
            <span style={styles.cardTitle}>{tool.label}</span>
            <span style={styles.cardDescription}>{tool.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    maxWidth: 640,
  },
  heading: {
    fontSize: 26,
    fontWeight: 800,
    margin: "0 0 16px 0",
  },
  lead: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#e6edf3",
    margin: "0 0 16px 0",
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#8b949e",
    margin: "0 0 32px 0",
  },
  subheading: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#8b949e",
    margin: "0 0 12px 0",
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    textAlign: "left",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 10,
    padding: "14px 16px",
    cursor: "pointer",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#58a6ff",
  },
  cardDescription: {
    fontSize: 13,
    color: "#8b949e",
    lineHeight: 1.5,
  },
};
