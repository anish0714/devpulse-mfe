export interface TextAnnotation {
  id: string;
  type: "text";
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

export interface RectAnnotation {
  id: string;
  type: "rect";
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  mode: "highlight" | "redact";
}

export type Annotation = TextAnnotation | RectAnnotation;

export type ToolMode = "none" | "text" | "highlight" | "redact";

let counter = 0;
export function nextId(): string {
  counter += 1;
  return `ann-${Date.now()}-${counter}`;
}
