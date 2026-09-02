import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { styles } from "./styles";

interface Props {
  accept: string;
  label: string;
  onFile: (file: File) => void;
}

export default function FileDropZone({ accept, label, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      className="ocr-dropzone"
      style={{
        ...styles.dropZone,
        ...(isDragActive ? styles.dropZoneActive : {}),
      }}
    >
      <p style={styles.dropZoneText}>{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
    </div>
  );
}
