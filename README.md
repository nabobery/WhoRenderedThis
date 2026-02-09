# WhoRenderedThis

A browser extension that maps React components to their visual positions in the rendered page. Hover over any element on a React app and instantly see which component rendered it.

## Features

- **Visual Component Inspector** — Hover over any UI element to see the React component that rendered it
- **Component Name + Source** — Shows `displayName`/`name` and best-effort `_debugSource` in dev builds
- **Pin Selection** — Click to lock the current selection; click again or press Escape to unpin
- **Copy to Clipboard** — One-click copy of the component name
- **Zero Config** — Works on any page using React (dev or production builds)
- **CSS Isolated** — Overlay UI is rendered inside a Shadow DOM so it never interferes with the page

## Tech Stack

- [WXT](https://wxt.dev/) — Vite-powered extension framework
- [React](https://react.dev/) — UI for the overlay panel
- Manifest V3 (Chromium)

## Development

```bash
pnpm install
pnpm run dev          # Chrome dev mode with HMR
pnpm run build        # Production build for Chrome
pnpm run zip          # Package for Chrome Web Store
```

## How It Works

1. Click the extension icon to activate the inspector on the current tab.
2. A **content script** is injected into the page (isolated world) that mounts a Shadow DOM overlay.
3. A **main-world script** is injected alongside it — this script can access React's internal `__reactFiber$` properties on DOM elements.
4. On hover, the content script asks the main-world script to resolve the element under the cursor to its nearest React component via Fiber tree traversal.
5. The overlay highlights the component's bounding box and displays its name.

## License

MIT
