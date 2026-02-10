# Contributing to WhoRenderedThis

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- A Chromium-based browser (Chrome, Edge, Brave)

### Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start development mode:
   ```bash
   pnpm dev
   ```
4. Load the extension in your browser:
   - Go to `chrome://extensions` or `edge://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3` directory

## Development Workflow

### Available Commands

```bash
pnpm dev            # Chrome dev mode with HMR
pnpm dev:firefox    # Firefox dev mode
pnpm build          # Production build for Chrome
pnpm zip            # Package for distribution
pnpm compile        # TypeScript type-check
pnpm lint           # Run ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Format with Prettier
pnpm format:check   # Check formatting
pnpm check          # Run all checks (compile + lint + format)
pnpm test           # Run tests in watch mode
pnpm test:run       # Run tests once
```

### Before Submitting

1. Run all checks:
   ```bash
   pnpm check
   pnpm test:run
   ```
2. Test the extension manually on a React website (e.g., react.dev)
3. Ensure your changes don't break existing functionality

## Code Style

- TypeScript for all source files
- ESLint + Prettier for formatting (auto-enforced via pre-commit hooks)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure all checks pass (`pnpm check && pnpm test:run`)
4. Push your branch and open a Pull Request
5. Fill out the PR template completely
6. Wait for review and address any feedback

## Architecture Overview

See [docs/architecture.md](docs/architecture.md) for details on how the extension works:

- **Background Script**: Service worker that handles extension icon clicks
- **Content Script**: Injects into pages, mounts Shadow DOM overlay
- **Main World Script**: Accesses React Fiber internals for component detection

## Reporting Issues

- Check existing issues before creating a new one
- Use the bug report template for bugs
- Use the feature request template for enhancements
- Include browser version, extension version, and steps to reproduce

## Questions?

Open a GitHub Discussion or issue if you have questions about contributing.
