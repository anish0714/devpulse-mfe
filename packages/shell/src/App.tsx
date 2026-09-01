import { lazy, Suspense, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import RemoteErrorBoundary from "./RemoteErrorBoundary";
import Introduction from "./Introduction";
import "./hover.css";

const PdfConversionWidget = lazy(() => import("pdfConversion/Widget"));
const PdfManipulationWidget = lazy(() => import("pdfManipulation/Widget"));

const PROD_BASE = "https://anish0714.github.io/devpulse-mfe";
const isProduction = process.env.NODE_ENV === "production";

interface IntroSection {
  key: "introduction";
  kind: "intro";
  label: string;
}

interface RemoteSection {
  key: "pdfConversion" | "pdfManipulation";
  kind: "remote";
  label: string;
  description: string;
  packageName: string;
  url: string;
  Component: ComponentType;
}

type Section = IntroSection | RemoteSection;

const sections: Section[] = [
  { key: "introduction", kind: "intro", label: "Introduction" },
  {
    key: "pdfConversion",
    kind: "remote",
    label: "PDF Conversion Tool",
    description: "Images → PDF, Word → PDF, and merging PDFs — all client-side.",
    packageName: "pdf-conversion-remote",
    url: isProduction
      ? `${PROD_BASE}/remotes/pdf-conversion/remoteEntry.js`
      : "http://localhost:3003/remoteEntry.js",
    Component: PdfConversionWidget,
  },
  {
    key: "pdfManipulation",
    kind: "remote",
    label: "PDF Manipulation Tool",
    description: "Add text, highlight or redact content, delete pages, and save an edited PDF.",
    packageName: "pdf-manipulation-remote",
    url: isProduction
      ? `${PROD_BASE}/remotes/pdf-manipulation/remoteEntry.js`
      : "http://localhost:3004/remoteEntry.js",
    Component: PdfManipulationWidget,
  },
];

type SectionKey = Section["key"];

export default function App() {
  const [active, setActive] = useState<SectionKey>("introduction");
  const current = sections.find((s) => s.key === active) ?? sections[0];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>DevPulse</h1>
        <p style={styles.subtitle}>
          A toolbox of browser-based tools, each one a separately built,
          separately deployed micro-frontend.
        </p>
      </header>

      <div style={styles.body}>
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActive(section.key)}
                className={`dp-nav-item${active === section.key ? " dp-nav-item-active" : ""}`}
                style={{
                  ...styles.navItem,
                  ...(active === section.key ? styles.navItemActive : {}),
                }}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <main style={styles.content}>
          {current.kind === "intro" ? (
            <Introduction
              tools={sections
                .filter((s): s is RemoteSection => s.kind === "remote")
                .map((s) => ({ key: s.key, label: s.label, description: s.description }))}
              onOpenTool={(key) => setActive(key as SectionKey)}
            />
          ) : (
            <>
              <div style={styles.sourceBadge}>
                <span style={styles.sourceBadgeDot} />
                Loading <strong>{current.packageName}</strong> from{" "}
                <code style={styles.code}>{current.url}</code>
              </div>
              <RemoteErrorBoundary remoteName={current.packageName}>
                <Suspense fallback={<div style={styles.loading}>Loading {current.label}…</div>}>
                  <current.Component />
                </Suspense>
              </RemoteErrorBoundary>
            </>
          )}
        </main>
      </div>

      <footer style={styles.footer}>
        <a
          href="https://github.com/anish0714/devpulse-mfe"
          className="dp-footer-link"
          style={styles.link}
        >
          View source
        </a>
        {" · "}
        <a
          href="https://anish0714.github.io/portfolio-website/"
          className="dp-footer-link"
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
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "28px 32px 20px",
    borderBottom: "1px solid #21262d",
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#8b949e",
    margin: 0,
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    borderRight: "1px solid #21262d",
    padding: "20px 12px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  navItem: {
    textAlign: "left",
    background: "transparent",
    border: "none",
    borderLeft: "3px solid transparent",
    borderRadius: 6,
    padding: "10px 14px 10px 11px",
    fontSize: 14,
    fontWeight: 600,
    color: "#8b949e",
    cursor: "pointer",
  },
  navItemActive: {
    background: "rgba(88, 166, 255, 0.12)",
    borderLeft: "3px solid #58a6ff",
    color: "#58a6ff",
  },
  content: {
    flex: 1,
    padding: "32px 40px",
  },
  sourceBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "#8b949e",
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 20,
    padding: "5px 12px",
    marginBottom: 20,
  },
  sourceBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3fb950",
    flexShrink: 0,
  },
  code: {
    color: "#8b949e",
  },
  loading: {
    fontSize: 13,
    color: "#8b949e",
    padding: 20,
  },
  footer: {
    fontSize: 12,
    color: "#6e7681",
    textAlign: "center",
    padding: "16px 24px",
    borderTop: "1px solid #21262d",
  },
  link: {
    color: "#58a6ff",
    textDecoration: "none",
  },
};
