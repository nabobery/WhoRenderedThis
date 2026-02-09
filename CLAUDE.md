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

- **`lib/bridge.ts`** — Message types (`ProbeRequest`, `ProbeResponse`) and type guards for communication between content script and main-world script via `window.postMessage`.

- **`components/Overlay.tsx`** — React component for the inspector UI. Shows component name, source location, highlight box, and pin/copy actions.

### Key Implementation Details

- **Fiber key discovery**: Scans element properties for keys starting with `__reactFiber$` or `__reactInternalInstance$`
- **Component detection**: Walks fiber chain looking for non-string `type` (function/class components vs host elements like "div")
- **CSS isolation**: Uses WXT's `createShadowRootUi` so overlay styles don't leak into the page
- **Performance**: Throttles hover probing via `requestAnimationFrame`
- **Toggle behavior**: Second injection removes the overlay (no persistent state)

## Manifest Configuration

Configured in `wxt.config.ts`:

- No popup — action click toggles inspector
- Permissions: `activeTab`, `scripting`
- `web_accessible_resources`: exposes `react-main-world.js` for main-world injection
