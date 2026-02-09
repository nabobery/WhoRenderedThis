# AGENTS.md - WhoRenderedThis

Agentic coding guidelines for the WhoRenderedThis browser extension project.

## Project Overview

A Plasmo-based browser extension for inspecting React components. Built with React, TypeScript, and Tailwind CSS.

## Build Commands

```bash
# Development
pnpm dev                    # Start dev server with hot reload

# Production
pnpm build                  # Build production bundle
pnpm package                # Package extension for distribution (creates zip)
```

Build outputs to `build/chrome-mv3-dev/` (dev) or `build/chrome-mv3-prod/` (prod).

## Code Style

### Formatting (Prettier)

- **Print width**: 80
- **Tab width**: 2 (spaces)
- **Semicolons**: Never
- **Quotes**: Double
- **Trailing commas**: None
- **Bracket same line**: true
- Run: `npx prettier --write <file>`

### Import Order (enforced by Prettier)

1. Node.js built-ins
2. Third-party modules (plasmo, react)
3. `@plasmo/*` packages
4. `@plasmohq/*` packages
5. `~*` project imports (mapped to `./src/*`)
6. Relative imports (`./`, `../`)

### TypeScript

- Strict mode enabled (via Plasmo base config)
- Use `type` keyword for type imports: `import type { Foo } from "bar"`
- No `any` types - use proper types or `unknown`
- Interface naming: PascalCase (e.g., `ComponentInfo`)
- Type naming: PascalCase with `*Props` suffix for component props

### Naming Conventions

- **Components**: PascalCase (e.g., `InspectorPanel`)
- **Hooks**: camelCase with `use` prefix (e.g., `useHoverInspect`)
- **Utils**: camelCase (e.g., `getComponentName`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: PascalCase for components, camelCase for utilities
- **Types/Interfaces**: PascalCase with descriptive names
- **CSS classes**: Use `wrt-*` prefix for inspector styles (scoped)

### Project Structure

```
src/
  contents/          # Content scripts (CSUI)
    inspector.tsx    # Main inspector overlay
  core/              # Core logic
    componentNames.ts    # Component name extraction
    reactFiber.ts        # React fiber utilities
    hostBounds.ts        # DOM bounds calculation
    types.ts             # Shared types
    index.ts             # Barrel exports
  hooks/             # React hooks
    useHoverInspect.ts   # Main inspection hook
    index.ts
  ui/                # UI components
    InspectorPanel.tsx
    Overlay.tsx
    CopyButton.tsx
    index.ts
  styles/
    inspector.css    # Scoped CSUI styles
    style.css        # Popup styles
  popup.tsx          # Extension popup
  background.ts      # Background script
```

### Path Aliases

- `~*` maps to `./src/*` (configured in tsconfig.json)
- Examples: `import { useHoverInspect } from "~hooks"`, `import type { Selection } from "~core"`

### CSS Patterns

- Use Tailwind CSS for popup UI
- Use scoped CSS files for CSUI (content script UI) with `wrt-*` prefix
- CSS custom properties in `:host` for Shadow DOM isolation
- Support dark mode via `prefers-color-scheme`

### Error Handling

- Use try/catch for async operations
- Log errors to console with context: `console.error("Failed to copy:", err)`
- Never suppress errors silently

### Plasmo Conventions

**Content Scripts:**

- Export `config: PlasmoCSConfig` with `matches: ["<all_urls>"]`
- Export `getStyle: PlasmoGetStyle` for Shadow DOM styles
- Use `data-text:` imports for CSS: `import cssText from "data-text:../styles/inspector.css"`

**Storage:**

- Use `@plasmohq/storage/hook` for synced state: `useStorage("key", defaultValue)`

### React Patterns

- Functional components with hooks
- Props interfaces named `*Props` (e.g., `InspectorPanelProps`)
- Callbacks wrapped in `useCallback` when passed to children
- Effects properly cleaned up in return functions
- Use `type="button"` on all buttons to prevent form submission

### Key Implementation Notes

- Inspector uses Shadow DOM for style isolation
- Filters out own UI via `composedPath()` and `data-plasmo-csui` attribute
- Uses `requestAnimationFrame` for throttling hover updates
- Keyboard shortcuts: `Escape` to unpin, `Cmd+Shift+I` to toggle
- Z-index scale: overlay (999999), panel (1000001)

### Git

- No tests currently configured
- Build must pass before committing
- Use pnpm (not npm/yarn)
