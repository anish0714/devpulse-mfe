import { useState } from "react";
import { styles } from "./styles";
import { copyToClipboard } from "./utils/clipboard";

interface Props {
  text: string;
  disabled?: boolean;
}

export default function CopyButton({ text, disabled }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !text}
      className="du-secondary-button"
      style={styles.secondaryButton}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
