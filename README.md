# DevPulse — Micro-Frontend Showcase

A small demo of a real micro-frontend architecture: a **shell** (host) app that composes **independently built** React apps at runtime, using Webpack 5's [Module Federation](https://webpack.js.org/concepts/module-federation/).

**Live:** https://anish0714.github.io/devpulse-mfe/

## Why this exists

Module Federation lets separate teams ship separate apps — each with its own build, its own deploy, its own release cadence — and have them compose into one product in the browser, with no shared build step and no iframe. This repo is a minimal, working example of that: the shell has no compile-time dependency on the remotes' source code. It only knows a URL and an exposed module name; everything else is resolved at runtime.

## Structure

This is an npm-workspaces monorepo — one repo for convenience, but each package still builds independently and is wired together only via runtime URLs, the same way it would work across separate repos:

```
packages/
  shell/                     the host app: nav, remote loading, error boundaries
  pdf-conversion-remote/     exposes ./Widget, an ilovepdf-style toolset (images → PDF,
                             Word → PDF, merge PDFs) — client-side, files never leave
                             the browser
  pdf-manipulation-remote/   exposes ./Widget, an in-browser PDF editor: add text,
                             highlight or redact content, delete pages, and save a
                             new edited PDF
```

Each package:
- has its own `webpack.config.js` and `ModuleFederationPlugin` config
- builds to its own `dist/`, independent of the others
- also has a standalone `App.tsx` entry, so visiting a remote's own deployed URL directly still renders something meaningful, not a blank page

## How the deploy is wired

Deployed as one GitHub Pages site (`/devpulse-mfe/`) assembled from three independent builds:

```
site/                            <- packages/shell/dist
site/remotes/pdf-conversion/     <- packages/pdf-conversion-remote/dist
site/remotes/pdf-manipulation/   <- packages/pdf-manipulation-remote/dist
```

The shell's production config points at those exact URLs:

```js
pdfConversion: `pdfConversion@https://anish0714.github.io/devpulse-mfe/remotes/pdf-conversion/remoteEntry.js`
pdfManipulation: `pdfManipulation@https://anish0714.github.io/devpulse-mfe/remotes/pdf-manipulation/remoteEntry.js`
```

In local development each package runs on its own port (shell `:3000`, pdf-conversion `:3003`, pdf-manipulation `:3004`) and the shell points at `localhost` instead — same mechanism, different URLs.

## CI/CD

Two separate GitHub Actions workflows, matching the "independently built" story:

- **[ci.yml](.github/workflows/ci.yml)** runs on every pull request targeting `main`. It lints (type-checks) and builds each package in its own matrix job — `shell`, `pdf-conversion-remote`, `pdf-manipulation-remote` — so one remote's failure doesn't hide another's, and each package's status shows up as its own check on the PR.
- **[deploy.yml](.github/workflows/deploy.yml)** runs only on push to `main` (or manual dispatch): it lints and builds everything, assembles the combined site, and deploys to GitHub Pages.

Changes land via a feature branch and a pull request; once `ci.yml` is green, the PR is merged into `main`, which triggers `deploy.yml`.

## Running locally

```bash
npm install
npm run dev   # starts shell + both remotes together
```

Or run a single package: `npm run start --workspace=packages/pdf-manipulation-remote`.

## Tech

React 19, TypeScript, Webpack 5 (`ModuleFederationPlugin`), npm workspaces, GitHub Actions, GitHub Pages. `pdf-manipulation-remote` additionally uses `pdfjs-dist` (rendering pages for editing) and `pdf-lib` (writing the edited PDF).
