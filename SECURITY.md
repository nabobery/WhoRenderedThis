# Security Policy

## Privacy Statement

WhoRenderedThis is designed with privacy in mind:

- **No data collection**: The extension does not collect, store, or transmit any user data
- **No analytics**: No tracking or analytics of any kind
- **No network requests**: The extension operates entirely locally within your browser
- **Minimal permissions**: Only requests `activeTab` and `scripting` permissions, which are required for core functionality

## Permissions Explained

| Permission  | Why It's Needed                                               |
| ----------- | ------------------------------------------------------------- |
| `activeTab` | Access the current tab only when you click the extension icon |
| `scripting` | Inject the inspector script to detect React components        |

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to understand and address the issue.

## Security Best Practices

When using this extension:

- Only install from official sources (Edge Add-ons, Chrome Web Store)
- Keep the extension updated to the latest version
- Review the source code if you have concerns (it's open source!)
