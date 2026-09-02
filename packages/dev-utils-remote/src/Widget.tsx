import { useState } from "react";
import { styles } from "./styles";
import JsonFormatter from "./tools/JsonFormatter";
import EncodeDecode from "./tools/EncodeDecode";
import UuidHash from "./tools/UuidHash";
import RegexTester from "./tools/RegexTester";
import "./hover.css";

const tools = {
  json: { label: "JSON", Component: JsonFormatter },
  encode: { label: "Base64 / URL", Component: EncodeDecode },
  uuidHash: { label: "UUID / Hash", Component: UuidHash },
  regex: { label: "Regex Tester", Component: RegexTester },
} as const;

type ToolKey = keyof typeof tools;

export default function Widget() {
  const [active, setActive] = useState<ToolKey>("json");
  const ActiveTool = tools[active].Component;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Dev Utils</h3>

      <nav style={styles.tabs}>
        {(Object.keys(tools) as ToolKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`du-tab${active === key ? " du-tab-active" : ""}`}
            style={{ ...styles.tab, ...(active === key ? styles.tabActive : {}) }}
          >
            {tools[key].label}
          </button>
        ))}
      </nav>

      <ActiveTool />

      <p style={styles.footer}>
        Rendered by <strong>dev-utils-remote</strong> · everything runs
        locally in your browser, nothing is uploaded
      </p>
    </div>
  );
}
