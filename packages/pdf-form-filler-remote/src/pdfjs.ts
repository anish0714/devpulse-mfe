import * as pdfjsLib from "pdfjs-dist";

// webpack 5 recognizes this `new URL(..., import.meta.url)` pattern and emits
// the worker as its own asset, giving pdf.js a same-origin worker script
// instead of relying on a CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default pdfjsLib;
