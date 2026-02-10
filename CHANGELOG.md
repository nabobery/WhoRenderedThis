# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/nabobery/WhoRenderedThis/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nabobery/WhoRenderedThis/releases/tag/v0.1.0
