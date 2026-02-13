# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-14

### Added

- **React 19 source location support** — Full source file/line extraction for React 19+ dev builds using `_debugStack` parsing
- **Version detection badge** — UI displays "React 16-18", "React 19+", or "React (prod)" based on detected environment
- **Parent component chain with sources** — When pinned, shows up to 5 ancestor components with their source locations (e.g., "App (App.tsx:5) > Layout (Layout.tsx:12)")
- **ParentChainList component** — Dedicated component for rendering parent hierarchy as a scrollable list with file:line info
- **Enhanced copy** — Clipboard now includes source location and parent chain when pinned
- **Strategy pattern source resolver** — Extensible architecture via `lib/source-resolver.ts` for version-specific extraction

### Changed

- `ComponentInfo.parentChain` type changed from `string[]` to `ParentInfo[]` (includes source locations)
- New `ParentInfo` type in bridge.ts with `name` and `source` properties
- `extractParentChain()` now accepts a resolver parameter to extract source locations for each parent
- Test suite expanded with ParentChainList tests

### Technical

- New `lib/source-resolver.ts` module with:
  - `detectReactEnvironment()` — version detection via fiber property probing
  - `parseFirstFrameFromStack()` — Chrome/Firefox stack trace parser
  - `debugSourceResolver` — React 16-18 `_debugSource` reader
  - `componentStackResolver` — React 19+ `_debugStack` parser with `describeNativeComponentFrame` fallback
  - `extractParentChain()` — fiber tree traversal for ancestor components with source resolution
- New `components/ParentChainList.tsx` — renders parent chain with source locations
- WeakMap-based caching for source locations (per-component-type, GC-managed)
- Backward-compatible message bridge type guards with `ParentInfo` validation

## [0.1.0] - 2026-02-11

### Added

- Initial release
- Visual component inspector overlay
- React Fiber introspection for component detection
- Component name and source location display
- Pin/unpin selection with click or Escape key
- Copy component name to clipboard
- Shadow DOM isolation for CSS safety
- Support for React 16-19 (development and production builds)
- Works with Create React App, Next.js, Vite, and other React frameworks

### Technical

- Built with WXT (Vite-powered extension framework)
- Manifest V3 for Chrome/Edge
- TypeScript with strict mode
- ESLint + Prettier code formatting
- Vitest test suite with 20 passing tests
- Husky pre-commit hooks

[Unreleased]: https://github.com/nabobery/WhoRenderedThis/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/nabobery/WhoRenderedThis/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nabobery/WhoRenderedThis/releases/tag/v0.1.0
