# DevPulse — Micro-Frontend Showcase

A small demo of a real micro-frontend architecture: a **shell** (host) app that composes two **independently built** React apps at runtime, using Webpack 5's [Module Federation](https://webpack.js.org/concepts/module-federation/).

**Live:** https://anish0714.github.io/devpulse-mfe/

## Why this exists

Module Federation lets separate teams ship separate apps — each with its own build, its own deploy, its own release cadence — and have them compose into one product in the browser, with no shared build step and no iframe. This repo is a minimal, working example of that: the shell has no compile-time dependency on the remotes' source code. It only knows a URL and an exposed module name; everything else is resolved at runtime.

## Structure

This is an npm-workspaces monorepo — one repo for convenience, but each package still builds independently and is wired together only via runtime URLs, the same way it would work across separate repos:

```
packages/
  shell/               the host app: nav, routing between remotes, error boundaries
  analytics-remote/    remote #1 — exposes ./Widget, an analytics panel with local UI state
  notes-remote/        remote #2 — exposes ./Widget, a notes list with its own localStorage
```

Each package:
- has its own `webpack.config.js` and `ModuleFederationPlugin` config
- builds to its own `dist/`, independent of the others
- also has a standalone `App.tsx` entry, so visiting a remote's own deployed URL directly still renders something meaningful, not a blank page

## How the deploy is wired

Deployed as one GitHub Pages site (`/devpulse-mfe/`) assembled from three independent builds:

```
site/                          <- packages/shell/dist
site/remotes/analytics/        <- packages/analytics-remote/dist
site/remotes/notes/            <- packages/notes-remote/dist
```

The shell's production config points at those exact URLs:

```js
analytics: `analytics@https://anish0714.github.io/devpulse-mfe/remotes/analytics/remoteEntry.js`
notes: `notes@https://anish0714.github.io/devpulse-mfe/remotes/notes/remoteEntry.js`
```

In local development each package runs on its own port (shell `:3000`, analytics `:3001`, notes `:3002`) and the shell points at `localhost` instead — same mechanism, different URLs.

## CI/CD

Two separate GitHub Actions workflows, matching the "independently built" story:

- **[ci.yml](.github/workflows/ci.yml)** runs on every pull request and every push to a non-`main` branch. It lints (type-checks) and builds each package in its own matrix job — `shell`, `analytics-remote`, `notes-remote` — so one remote's failure doesn't hide another's, and each package's status shows up as its own check on the PR.
- **[deploy.yml](.github/workflows/deploy.yml)** runs only on push to `main` (or manual dispatch): it lints and builds everything, assembles the combined site, and deploys to GitHub Pages.

Changes land via a feature branch and a pull request; once `ci.yml` is green, the PR is merged into `main`, which triggers `deploy.yml`.

## Running locally

```bash
npm install
npm run dev   # starts shell + both remotes together
```

Or run a single package: `npm run start --workspace=packages/analytics-remote`.

## Tech

React 19, TypeScript, Webpack 5 (`ModuleFederationPlugin`), npm workspaces, GitHub Actions, GitHub Pages.
