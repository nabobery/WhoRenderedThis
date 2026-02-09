# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhoRenderedThis is a Plasmo-based Chrome extension that inspects React components. Hover over any UI element to see which React component rendered it, including the full component ancestry stack.

## Build Commands

```bash
pnpm dev      # Start dev server with hot reload (outputs to build/chrome-mv3-dev/)
pnpm build    # Production build (outputs to build/chrome-mv3-prod/)
pnpm package  # Create zip for store submission
```

Load the extension in Chrome via `chrome://extensions` → Load unpacked → select `build/chrome-mv3-dev/`.

## Architecture

### Core Data Flow

1. **Content Script** (`src/contents/inspector.tsx`) - Entry point, renders in Shadow DOM for style isolation
2. **useHoverInspect hook** - Manages hover/click events, builds component stack from React fiber tree
3. **React Fiber utilities** (`src/core/reactFiber.ts`) - Discovers fiber nodes via `__reactFiber$*` DOM properties
4. **Component extraction** (`src/core/componentNames.ts`) - Walks fiber `.return` chain to build ancestry stack
5. **UI Components** (`src/ui/`) - Overlay highlight and info panel

### Key Files

- `src/background.ts` - Handles `Cmd+Shift+I` keyboard shortcut via `chrome.commands`
- `src/popup.tsx` - Extension popup with enable/disable toggle
- `src/core/types.ts` - Shared types (`Selection`, `InspectorState`)

### State Management

Uses `@plasmohq/storage` for cross-context state sync:

```typescript
const [enabled] = useStorage("inspector-enabled", false)
```

## Code Style

- **Formatting**: `npx prettier --write <file>`
- **No semicolons**, double quotes, no trailing commas
- **Import order**: builtins → third-party → `@plasmo/*` → `@plasmohq/*` → `~*` → relative
- **Path alias**: `~*` maps to `./src/*`
- **CSS prefix**: Use `wrt-*` for inspector styles (Shadow DOM scoped)
- **Type imports**: Use `import type { Foo }` syntax

## Plasmo Conventions

Content scripts export:

- `config: PlasmoCSConfig` with `matches: ["<all_urls>"]`
- `getStyle: PlasmoGetStyle` for Shadow DOM CSS injection
- Use `data-text:` imports for CSS files

## Implementation Notes

- Inspector UI uses Shadow DOM - filter own elements via `data-plasmo-csui` attribute
- Throttle hover updates with `requestAnimationFrame`
- Z-index: overlay (999999), panel (1000001)
- Keyboard: `Escape` to unpin, `Cmd+Shift+I` to toggle
- No tests configured; build must pass before committing
