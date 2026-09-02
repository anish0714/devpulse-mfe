# DevPulse — Micro-Frontend Toolbox

A toolbox of real, browser-based tools (PDF conversion, PDF editing, developer utilities) built as **independently developed, independently deployed** micro-frontends, composed at runtime into one app by a shell host using Webpack 5's [Module Federation](https://webpack.js.org/concepts/module-federation/).

**Live:** https://anish0714.github.io/devpulse-mfe/

## What it is

DevPulse is two things at once:

1. **A working set of tools** — convert images/Word docs to PDF, merge PDFs, edit PDFs (add text, highlight, redact, delete pages), fill in real interactive PDF forms, and everyday developer utilities (JSON, Base64/URL, UUID/hash, regex) — entirely client-side. No file or text you touch here is ever uploaded anywhere.
2. **A demonstration of production-grade micro-frontend architecture** — each tool is its own React app with its own build, its own deploy, and its own CI check, loaded into a shared shell at runtime rather than bundled together at build time.

## Highlights

- **Real utility, not a toy demo** — the tools genuinely convert and edit PDFs, verified against real files, not just UI mockups.
- **Privacy by construction** — every tool runs 100% in the browser (`pdf-lib`, `pdfjs-dist`, `mammoth`, `jsPDF`, or nothing but Web Platform APIs), so there's no backend to trust and nothing ever leaves the user's machine.
- **True runtime composition** — the shell has zero compile-time dependency on any tool's source; it only knows a URL and an exposed module name. A tool can be rebuilt and redeployed on its own schedule without touching the shell or any other tool.
- **Per-package CI** — each package lints and builds as its own GitHub Actions check, so a failure in one tool doesn't block or hide failures in another.
- **Trunk-based workflow** — every change ships through a feature branch and PR, merged only once CI is green.

## Tools

### PDF Conversion Tool (`pdf-conversion-remote`)
An ilovepdf-style converter:
- **Images → PDF** — combine one or more JPG/PNG images into a single PDF.
- **Word → PDF** — converts `.docx` files (via `mammoth` → `html2canvas` → `jsPDF`); text and basic formatting carry over.
- **Merge PDFs** — combine multiple PDFs into one, with drag-free reordering before merging.

### PDF Manipulation Tool (`pdf-manipulation-remote`)
An in-browser PDF editor built on `pdfjs-dist` (rendering) and `pdf-lib` (export):
- Add freeform **text** anywhere on a page.
- **Highlight** or **redact** (visually black out) regions by click-drag.
- **Delete pages** from the document.
- **Save & download** a genuinely new, edited PDF — verified by round-tripping saved files back through a PDF parser, not just eyeballed.

### PDF Form Filler (`pdf-form-filler-remote`)
Detects real, interactive AcroForm fields in a PDF (text, checkboxes, radio groups, dropdowns, multi-selects) via `pdf-lib`'s form API and renders a clean, labeled form next to a read-only page preview (rendered with `pdfjs-dist`):
- Text, multiline text, checkboxes, radio groups, dropdowns, and multi-select lists all render as their correct native control, pre-filled with the field's existing value.
- **Save & download** writes your answers back into the actual PDF form fields (not just a rasterized overlay) — verified by re-parsing the saved file and confirming every field's value round-trips exactly.
- If a PDF has no real form fields (a scanned or flattened "form" is just lines and boxes, not data), it says so plainly and points to the PDF Manipulation Tool's Text tool instead, rather than pretending to support something it can't.

### Dev Utils (`dev-utils-remote`)
Everyday developer tools with **zero runtime dependencies** — everything runs on Web Platform APIs alone (`crypto.randomUUID`, `crypto.subtle.digest`, native `RegExp`, `TextEncoder`/`TextDecoder`):
- **JSON** — format, minify, and live-validate JSON.
- **Base64 / URL** — encode/decode either, with correct UTF-8 handling (round-trips non-ASCII text exactly).
- **UUID / Hash** — generate one or many UUIDs, or hash text with SHA-1/256/384/512.
- **Regex Tester** — live match highlighting, capture groups, and per-match index in the source string.

## UI

The shell opens on an **Introduction** page that frames the project as a toolbox to use, not just an architecture demo, with cards linking straight into each tool. Every tool lives in a left-hand sidebar; selecting one renders that remote's own widget in the right-hand content pane. The shell itself renders no tool-specific UI — only navigation, the Introduction, and the loading/error states around whichever remote is active.

## Architecture

This is an npm-workspaces monorepo — one repo for convenience, but each package still builds independently and is wired together only via runtime URLs, the same way it would work across separate repos:

```
packages/
  shell/                     the host app: left-hand sidebar nav, remote loading,
                             error boundaries, and the Introduction landing page
  pdf-conversion-remote/     exposes ./Widget — images → PDF, Word → PDF, merge PDFs
  pdf-manipulation-remote/   exposes ./Widget — add text, highlight/redact, delete
                             pages, save an edited PDF
  dev-utils-remote/          exposes ./Widget — JSON, Base64/URL, UUID/hash, regex
                             tester (zero runtime dependencies)
  pdf-form-filler-remote/    exposes ./Widget — detects real AcroForm fields in a
                             PDF and lets you fill them in and save
```

Each package:
- has its own `webpack.config.js` and `ModuleFederationPlugin` config
- builds to its own `dist/`, independent of the others
- also has a standalone `App.tsx` entry, so visiting a remote's own deployed URL directly still renders something meaningful, not a blank page

### How the deploy is wired

Deployed as one GitHub Pages site (`/devpulse-mfe/`) assembled from five independent builds:

```
site/                            <- packages/shell/dist
site/remotes/pdf-conversion/     <- packages/pdf-conversion-remote/dist
site/remotes/pdf-manipulation/   <- packages/pdf-manipulation-remote/dist
site/remotes/dev-utils/          <- packages/dev-utils-remote/dist
site/remotes/pdf-form-filler/    <- packages/pdf-form-filler-remote/dist
```

The shell's production config points at those exact URLs:

```js
pdfConversion: `pdfConversion@https://anish0714.github.io/devpulse-mfe/remotes/pdf-conversion/remoteEntry.js`
pdfManipulation: `pdfManipulation@https://anish0714.github.io/devpulse-mfe/remotes/pdf-manipulation/remoteEntry.js`
devUtils: `devUtils@https://anish0714.github.io/devpulse-mfe/remotes/dev-utils/remoteEntry.js`
pdfFormFiller: `pdfFormFiller@https://anish0714.github.io/devpulse-mfe/remotes/pdf-form-filler/remoteEntry.js`
```

In local development each package runs on its own port (shell `:3000`, pdf-conversion `:3003`, pdf-manipulation `:3004`, dev-utils `:3005`, pdf-form-filler `:3006`) and the shell points at `localhost` instead — same mechanism, different URLs.

### CI/CD

Two separate GitHub Actions workflows, matching the "independently built" story:

- **[ci.yml](.github/workflows/ci.yml)** runs on every pull request targeting `main`. It lints (type-checks) and builds each package in its own matrix job — `shell`, `pdf-conversion-remote`, `pdf-manipulation-remote`, `dev-utils-remote`, `pdf-form-filler-remote` — so one remote's failure doesn't hide another's, and each package's status shows up as its own check on the PR.
- **[deploy.yml](.github/workflows/deploy.yml)** runs only on push to `main` (or manual dispatch): it lints and builds everything, assembles the combined site, and deploys to GitHub Pages.

Changes land via a feature branch and a pull request; once `ci.yml` is green, the PR is merged into `main`, which triggers `deploy.yml`.

## Running locally

```bash
npm install
npm run dev   # starts shell + all remotes together
```

Or run a single package: `npm run start --workspace=packages/pdf-form-filler-remote`.

## Tech stack

- **React 19** + **TypeScript**, **Webpack 5** (`ModuleFederationPlugin`) for runtime composition, **npm workspaces** for the monorepo
- **`pdf-lib`** — creating, merging, and editing PDFs
- **`pdfjs-dist`** — rendering PDF pages to canvas for the manipulation editor
- **`mammoth`**, **`html2canvas`**, **`jsPDF`** — Word → PDF conversion
- **Web Platform APIs only** (`crypto`, `RegExp`, `TextEncoder`/`TextDecoder`) — `dev-utils-remote` ships with zero runtime dependencies
- **GitHub Actions** (per-package CI, deploy-on-merge) + **GitHub Pages** hosting

## What this project demonstrates

Micro-frontend architecture with genuine runtime composition (not a monorepo pretending to be one); independent build/deploy pipelines per package; browser-only file processing with zero backend; and a standard trunk-based git workflow (feature branch → PR → CI → merge) enforced in practice across every change in this repo's history.
