import { lazy, Suspense, useState } from "react";
import type { CSSProperties } from "react";
import RemoteErrorBoundary from "./RemoteErrorBoundary";

const AnalyticsWidget = lazy(() => import("analytics/Widget"));
const NotesWidget = lazy(() => import("notes/Widget"));

const PROD_BASE = "https://anish0714.github.io/devpulse-mfe";
const isProduction = process.env.NODE_ENV === "production";

const remotes = {
  analytics: {
    label: "Analytics",
    packageName: "analytics-remote",
    url: isProduction
      ? `${PROD_BASE}/remotes/analytics/remoteEntry.js`
      : "http://localhost:3001/remoteEntry.js",
    Component: AnalyticsWidget,
  },
  notes: {
    label: "Notes",
    packageName: "notes-remote",
    url: isProduction
      ? `${PROD_BASE}/remotes/notes/remoteEntry.js`
      : "http://localhost:3002/remoteEntry.js",
    Component: NotesWidget,
  },
} as const;

type RemoteKey = keyof typeof remotes;

export default function App() {
  const [active, setActive] = useState<RemoteKey>("analytics");
  const remote = remotes[active];
  const ActiveWidget = remote.Component;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>DevPulse</h1>
        <p style={styles.subtitle}>
          A micro-frontend showcase. This shell app is one webpack build; each
          panel below is a <strong>separately built, separately deployed</strong>{" "}
          React app, stitched together in the browser at runtime via Webpack
          Module Federation.
        </p>
      </header>

      <nav style={styles.tabs}>
        {(Object.keys(remotes) as RemoteKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            style={{
              ...styles.tab,
              ...(active === key ? styles.tabActive : {}),
            }}
          >
            {remotes[key].label}
          </button>
        ))}
      </nav>

      <p style={styles.sourceBadge}>
        Loading <strong>{remote.packageName}</strong> from{" "}
        <code style={styles.code}>{remote.url}</code>
      </p>

      <div style={styles.content}>
        <RemoteErrorBoundary remoteName={remote.packageName}>
          <Suspense fallback={<div style={styles.loading}>Loading {remote.label}…</div>}>
            <ActiveWidget />
          </Suspense>
        </RemoteErrorBoundary>
      </div>

      <footer style={styles.footer}>
        <a href="https://github.com/anish0714/devpulse-mfe" style={styles.link}>
          View source
        </a>
        {" · "}
        <a
          href="https://anish0714.github.io/portfolio-website/"
          style={styles.link}
        >
          Back to portfolio
        </a>
      </footer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#e6edf3",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    maxWidth: 640,
    textAlign: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: "0 0 12px 0",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#8b949e",
    margin: 0,
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    background: "#161b22",
    border: "1px solid #30363d",
    color: "#8b949e",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  tabActive: {
    border: "1px solid #58a6ff",
    color: "#58a6ff",
  },
  sourceBadge: {
    fontSize: 11,
    color: "#6e7681",
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    marginBottom: 24,
    textAlign: "center",
  },
  code: {
    color: "#8b949e",
  },
  content: {
    marginBottom: 32,
  },
  loading: {
    fontSize: 13,
    color: "#8b949e",
    padding: 20,
  },
  footer: {
    fontSize: 12,
    color: "#6e7681",
  },
  link: {
    color: "#58a6ff",
    textDecoration: "none",
  },
};
