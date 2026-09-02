import { lazy, Suspense, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import RemoteErrorBoundary from "./RemoteErrorBoundary";
import Introduction from "./Introduction";
import "./hover.css";

const PdfConversionWidget = lazy(() => import("pdfConversion/Widget"));
const PdfManipulationWidget = lazy(() => import("pdfManipulation/Widget"));
const DevUtilsWidget = lazy(() => import("devUtils/Widget"));
const PdfFormFillerWidget = lazy(() => import("pdfFormFiller/Widget"));

const PROD_BASE = "https://anish0714.github.io/devpulse-mfe";
const isProduction = process.env.NODE_ENV === "production";

interface IntroSection {
  key: "introduction";
  kind: "intro";
  label: string;
}

interface RemoteSection {
  key: "pdfConversion" | "pdfManipulation" | "devUtils" | "pdfFormFiller";
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
  {
    key: "devUtils",
    kind: "remote",
    label: "Dev Utils",
    description: "JSON formatting, Base64/URL encode-decode, UUID/hash generation, and a regex tester.",
    packageName: "dev-utils-remote",
    url: isProduction
      ? `${PROD_BASE}/remotes/dev-utils/remoteEntry.js`
      : "http://localhost:3005/remoteEntry.js",
    Component: DevUtilsWidget,
  },
  {
    key: "pdfFormFiller",
    kind: "remote",
    label: "PDF Form Filler",
    description: "Detects real, interactive form fields in a PDF and lets you fill them in and save.",
    packageName: "pdf-form-filler-remote",
    url: isProduction
      ? `${PROD_BASE}/remotes/pdf-form-filler/remoteEntry.js`
      : "http://localhost:3006/remoteEntry.js",
    Component: PdfFormFillerWidget,
  },
];

type SectionKey = Section["key"];

export default function App() {
  const [active, setActive] = useState<SectionKey>("introduction");
  const current = sections.find((s) => s.key === active) ?? sections[0];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>DevPulse</h1>
          <p style={styles.subtitle}>
            A toolbox of browser-based tools, each one a separately built,
            separately deployed micro-frontend.
          </p>
        </div>
        <a
          href="https://anish0714.github.io/portfolio-website/"
          className="dp-portfolio-link"
          style={styles.portfolioLink}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
          Portfolio
        </a>
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
              <RemoteErrorBoundary remoteName={current.packageName}>
                <Suspense fallback={<div style={styles.loading}>Loading {current.label}…</div>}>
                  <current.Component />
                </Suspense>
              </RemoteErrorBoundary>
            </>
          )}
        </main>
      </div>
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
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "28px 32px 20px",
    borderBottom: "1px solid #21262d",
  },
  portfolioLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "#58a6ff",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 20,
    padding: "6px 14px",
    textDecoration: "none",
    whiteSpace: "nowrap",
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
  loading: {
    fontSize: 13,
    color: "#8b949e",
    padding: 20,
  },
};
