# Privacy Policy

Effective date: 2026-03-03

WhoRenderedThis is a browser extension that helps developers identify which React component rendered a given UI element.

## Summary

- We do not collect, store, or transmit personal data.
- We do not make network requests.
- The extension runs locally and only activates when you click the extension icon.

## Data Collection

WhoRenderedThis does not collect any user data.

- No analytics
- No tracking
- No external logging
- No remote servers

## Data Sharing / Sale

We do not share, sell, or transfer data to third parties because we do not collect data in the first place.

## Permissions

WhoRenderedThis requests the following permissions:

- `activeTab`: to access the currently active tab only after you click the extension icon.
- `scripting`: to inject the inspector scripts needed to detect React components on the current page.

## How It Works (High Level)

When you click the extension icon, WhoRenderedThis injects scripts into the current page to:

- detect React Fiber data attached to DOM nodes, and
- display an overlay that shows the nearest React component for the element under your cursor.

All processing happens locally in your browser.

## Contact

For questions or concerns, please open an issue:

- https://github.com/nabobery/WhoRenderedThis/issues

## Changes

If this policy changes, it will be updated in this repository.
