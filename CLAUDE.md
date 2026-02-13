# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhoRenderedThis is a Chromium browser extension that maps React components to their visual positions. Users hover over any UI element on a React app to see which component rendered it. Built with WXT (Vite-powered extension framework) + React 19.

## Commands

```bash
pnpm dev            # Chrome dev mode with HMR
pnpm dev:firefox    # Firefox dev mode
pnpm build          # Production build for Chrome
pnpm build:firefox
pnpm zip            # Package for Chrome Web Store
pnpm compile        # TypeScript type-check (no emit)
pnpm lint           # Run ESLint
pnpm lint:fix       # Run ESLint with auto-fix
pnpm format         # Format all files with Prettier
pnpm format:check   # Check formatting without writing
pnpm check          # Run all checks (compile + lint + format)
```

Pre-commit hooks automatically run `lint-staged` (ESLint + Prettier) on staged files.

## Architecture

The extension uses a three-part architecture to bridge the isolation boundary between extension scripts and page context:

```
Background Service Worker
         │
         ▼ (scripting.executeScript on action click)
Content Script (isolated world)
         │
         ├── Mounts Shadow DOM overlay (React UI)
         │
         └── injectScript() ──▶ Main World Script
                                     │
                                     ▼
                              React Fiber access
                              (__reactFiber$)
```

### Entrypoints (`entrypoints/`)

- **`background.ts`** — MV3 service worker. Listens for extension icon clicks and injects the content script into the active tab.

- **`inspector.content.tsx`** — Runtime content script (injected on-demand). Toggles the inspector: if already mounted, removes it; otherwise injects the main-world script and mounts a Shadow DOM overlay.

- **`react-main-world.ts`** — Unlisted script running in the page's main world (same JS context as the page). Performs React Fiber introspection: finds `__reactFiber$` keys on DOM elements, walks the fiber `.return` chain to find user components, and extracts component name/source info.

### Shared Code

- **`lib/bridge.ts`** — Message types (`ProbeRequest`, `ProbeResponse`), type aliases (`ReactVersionRange`, `ReactBuildType`, `ParentInfo`), and type guards for communication between content script and main-world script via `window.postMessage`.

- **`lib/source-resolver.ts`** — Version-aware source location extraction using strategy pattern:
  - `detectReactEnvironment()` — Probes fiber properties to detect React 16-18 vs 19+
  - `debugSourceResolver` — Reads `fiber._debugSource` (React 16-18)
  - `componentStackResolver` — Parses `fiber._debugStack` Error object (React 19+)
  - `parseFirstFrameFromStack()` — Chrome/Firefox stack trace parser
  - `extractParentChain()` — Walks fiber `.return` chain for ancestor components, extracting names and source locations

- **`components/Overlay.tsx`** — React component for the inspector UI. Shows component name, source location, version badge, parent chain with sources (when pinned), highlight box, and pin/copy actions.

- **`components/ParentChainList.tsx`** — Renders the parent component hierarchy as a scrollable list with component names and source locations (file:line). Gracefully handles missing sources in production builds.

### Key Implementation Details

- **Fiber key discovery**: Scans element properties for keys starting with `__reactFiber$` or `__reactInternalInstance$`
- **Component detection**: Walks fiber chain looking for non-string `type` (function/class components vs host elements like "div")
- **Version-aware source resolution**: Uses strategy pattern — `_debugSource` for React 16-18, `_debugStack` parsing for React 19+ (same technique as React DevTools)
- **Caching**: Module-level caching for environment/resolver; `WeakMap` for per-component-type source locations
- **CSS isolation**: Uses WXT's `createShadowRootUi` so overlay styles don't leak into the page
- **Performance**: Throttles hover probing via `requestAnimationFrame`
- **Toggle behavior**: Second injection removes the overlay (no persistent state)

## Manifest Configuration

Configured in `wxt.config.ts`:

- No popup — action click toggles inspector
- Permissions: `activeTab`, `scripting`
- `web_accessible_resources`: exposes `react-main-world.js` for main-world injection
