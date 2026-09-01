import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { styles } from "./styles";

interface Props {
  accept: string;
  multiple?: boolean;
  label: string;
  onFiles: (files: File[]) => void;
}

export default function FileDropZone({ accept, multiple, label, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
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
      onDrop={handleDrop}
      className="pc-dropzone"
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
        multiple={multiple}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
    </div>
  );
}
