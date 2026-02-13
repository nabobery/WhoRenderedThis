# AGENTS.md

This file provides guidance for agentic coding agents working in the WhoRenderedThis repository.

## Project Overview

A Chromium browser extension that maps React components to their visual positions. Users hover over UI elements to see which React component rendered them. Built with WXT (Vite-powered extension framework) + React 19.

## Build / Lint / Test Commands

```bash
# Development (with HMR)
pnpm dev                   # Chrome
pnpm dev:firefox           # Firefox

# Production builds
pnpm build                 # Chrome
pnpm build:firefox         # Firefox

# Type checking
pnpm compile               # TypeScript check only (no emit)

# Linting
pnpm lint                  # Check for lint errors
pnpm lint:fix              # Fix auto-fixable lint issues

# Formatting
pnpm format                # Format all files with Prettier
pnpm format:check          # Check formatting without writing

# Combined checks
pnpm check                 # Run compile + lint + format:check

# Packaging
pnpm zip                   # Chrome Web Store package
pnpm zip:firefox           # Firefox package

# Testing
pnpm test                  # Run tests in watch mode (Vitest)
pnpm test:run              # Run tests once
pnpm test:coverage         # Run tests with coverage report

# Post-install setup
pnpm postinstall           # WXT preparation
pnpm prepare               # Husky git hooks setup
```

## Project Structure

```
entrypoints/               # Extension entry points
├── background.ts         # MV3 service worker
├── inspector.content.tsx # Content script (isolated world)
└── react-main-world.ts   # Main-world script (Fiber access)

components/               # React components
├── Overlay.tsx          # Inspector UI overlay (shows component name, source location, version badge, parent chain with sources when pinned)
├── Overlay.css          # Overlay styles (Shadow DOM)
├── ParentChainList.tsx  # Renders parent component hierarchy with names and source locations
├── ParentChainList.css  # Parent chain list styles
└── inspector-host.css   # Shadow host reset

lib/                     # Shared utilities
├── bridge.ts           # Message types (`ComponentInfo`, `ProbeRequest`, `ProbeResponse`), type aliases (`ReactVersionRange`, `ReactBuildType`, `ParentInfo`), and type guards
└── source-resolver.ts  # Version-aware source location extraction using strategy pattern:
                        #   - detectReactEnvironment() — Probes fiber properties to detect React 16-18 vs 19+
                        #   - debugSourceResolver — Reads fiber._debugSource (React 16-18)
                        #   - componentStackResolver — Parses fiber._debugStack Error object (React 19+)
                        #   - parseFirstFrameFromStack() — Chrome/Firefox stack trace parser
                        #   - extractParentChain() — Walks fiber .return chain for ancestor components, extracting names and source locations

tests/                   # Test suite (Vitest)
├── background.test.ts
├── inspector.content.test.ts
├── react-main-world.test.ts
├── source-resolver.test.ts
├── bridge.test.ts
├── Overlay.test.tsx
└── ParentChainList.test.tsx

public/                  # Static assets
```

## Code Style Guidelines

### Imports

- **Path aliases:** Use `@/` for project root imports:
  ```typescript
  import Overlay from '@/components/Overlay';
  import { CHANNEL } from '@/lib/bridge';
  ```
- **Type imports:** Use explicit `import type` for types:
  ```typescript
  import type { ComponentInfo, ProbeResponse } from '@/lib/bridge';
  ```
- **External imports:** Group external imports first, then internal.
- **React imports:** Import hooks individually:
  ```typescript
  import { useState, useEffect, useCallback } from 'react';
  ```

### Formatting

- **Semicolons:** Always use semicolons.
- **Quotes:** Use single quotes for strings.
- **Indentation:** 2 spaces.
- **Trailing commas:** Use trailing commas in multi-line objects/arrays.
- **Line width:** Keep lines under 100 characters where reasonable.

### Naming Conventions

- **Components:** PascalCase (`Overlay.tsx`, `ProbeResponse`)
- **Interfaces/Types:** PascalCase (`ComponentInfo`, `ProbeRequest`)
- **Functions/Variables:** camelCase (`sendProbe`, `isPinned`)
- **Constants:** UPPER_SNAKE_CASE (`CHANNEL`, `FIBER_PREFIXES`)
- **Type guards:** Prefix with `is` (`isProbeRequest`, `isProbeResponse`)
- **CSS classes:** Use `wrt-` prefix with kebab-case (`wrt-panel`, `wrt-highlight`)
- **File naming:** Match component name exactly (e.g., `Overlay.tsx` for `Overlay` component)

### Types

- **Strict mode:** TypeScript runs with `strict: true`.
- **No `any`:** Avoid `any`; use `unknown` with type guards when necessary.
- **Discriminated unions:** Use for message types with `type` field.
- **Return types:** Explicitly type exported function returns.
- **Props interfaces:** Define as `ComponentNameProps`.

### Error Handling

- **Try/catch:** Wrap async operations and log errors:
  ```typescript
  try {
    await browser.scripting.executeScript({...});
  } catch (err) {
    console.error('WhoRenderedThis: failed to inject inspector', err);
  }
  ```
- **Type guards:** Use for runtime validation of messages:
  ```typescript
  export function isProbeRequest(data: unknown): data is ProbeRequest {...}
  ```
- **Graceful degradation:** Handle null/undefined values explicitly.

### Comments & Organization

- **Section headers:** Use `// ── Section Name ──` for major sections.
- **JSDoc:** Add JSDoc to functions and complex types explaining purpose.
- **File headers:** Brief description of the file's role in the architecture.
- **Inline comments:** Explain "why" not "what" for non-obvious code.

### React Patterns

- **Functional components:** Use function declarations with default export.
- **Hooks:** Use `useCallback` for event handlers passed to children.
- **Refs:** Use `useRef` for mutable values that don't trigger re-renders.
- **Cleanup:** Always return cleanup functions from `useEffect`.
- **Shadow DOM:** CSS is fully isolated via Shadow DOM; use `createShadowRootUi`.

### CSS Guidelines

- **Naming:** BEM-like with `wrt-` prefix to avoid collisions.
- **Shadow DOM:** All overlay styles rendered inside Shadow DOM.
- **Z-index:** Use `2147483647` for maximum stacking context.
- **Units:** Use `px` for fixed sizes, avoid `rem`/`em` in Shadow DOM.

## WXT Framework Patterns

- **Entry points:** Use `defineContentScript`, `defineBackground`, `defineUnlistedScript`.
- **Global API:** `browser` object is auto-imported by WXT.
- **Auto-imports:** WXT provides auto-imports for common utilities.
- **Path aliases:** `@/` maps to project root via WXT config.

## Browser Extension Patterns

- **MV3:** Manifest V3 service worker for background.
- **Content scripts:** Runtime registration for on-demand injection.
- **Main world:** Inject scripts for page context access (`injectScript()`).
- **Communication:** Use `window.postMessage` between isolated/main worlds.
- **Permissions:** `activeTab`, `scripting` required.
