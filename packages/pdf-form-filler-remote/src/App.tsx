import Widget from "./Widget";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1117",
        padding: 24,
      }}
    >
      <div>
        <p
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 12,
            color: "#8b949e",
            marginBottom: 12,
            maxWidth: 480,
          }}
        >
          You're viewing the pdf-form-filler-remote micro-frontend
          standalone, at its own deployed URL. It normally renders inside
          the{" "}
          <a
            href="https://anish0714.github.io/devpulse-mfe/"
            style={{ color: "#58a6ff" }}
          >
            DevPulse shell
          </a>
          .
        </p>
        <Widget />
      </div>
    </div>
  );
}
