# Publishing Credentials Setup

This guide explains how to obtain and configure credentials for automated store publishing using `wxt submit`.

---

## Table of Contents

1. [Overview](#overview)
2. [Firefox Add-ons (AMO)](#firefox-add-ons-amo)
3. [Microsoft Edge Add-ons](#microsoft-edge-add-ons)
4. [Chrome Web Store](#chrome-web-store-future)
5. [GitHub Secrets Setup](#github-secrets-setup)
6. [Local Testing](#local-testing)
7. [Edge API Key Rotation](#edge-api-key-rotation)

---

## Overview

The extension uses [WXT Submit](https://wxt.dev/guide/essentials/publishing) to automate publishing to browser stores. Credentials are stored as GitHub secrets and used by the release workflow.

**Current store status:**

| Store            | Status        | Automated |
| ---------------- | ------------- | --------- |
| Firefox Add-ons  | ✅ Published  | ✅ Yes    |
| Edge Add-ons     | ✅ Published  | ✅ Yes    |
| Chrome Web Store | ❌ Not listed | ❌ No     |

---

## Firefox Add-ons (AMO)

### Extension Details

- **Extension ID:** `{1aa232e0-a767-46e0-87bf-506513f52eff}` (configured in `wxt.config.ts`)
- **Listing:** [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/whorenderedthis/)

### Getting Credentials

1. Go to [AMO API Keys](https://addons.mozilla.org/developers/addon/api/key/)

2. Sign in with your Firefox developer account

3. Click **Generate new credentials**

4. Copy the two values:
   - **JWT Issuer** → `FIREFOX_JWT_ISSUER`
   - **JWT Secret** → `FIREFOX_JWT_SECRET`

> **Note:** The Extension ID is already configured in `wxt.config.ts` under `browser_specific_settings.gecko.id`. This same ID should be used as `FIREFOX_EXTENSION_ID` secret.

### Required Secrets

```
FIREFOX_EXTENSION_ID={1aa232e0-a767-46e0-87bf-506513f52eff}
FIREFOX_JWT_ISSUER=user:12345678:123
FIREFOX_JWT_SECRET=your-secret-here
```

---

## Microsoft Edge Add-ons

### Extension Details

- **Product ID:** `gnppbipjiohpjdelkllmnbmakldfdeji`
- **Listing:** [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/whorenderedthis/gnppbipjiohpjdelkllmnbmakldfdeji)

### Getting Credentials

1. Go to [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)

2. Navigate to **Settings** → **Publish API**

3. Click **Create API credentials**

4. Copy the three values:
   - **Client ID** → `EDGE_CLIENT_ID`
   - **Client Secret / API Key** → `EDGE_API_KEY`
   - **Product ID** (from extension URL) → `EDGE_PRODUCT_ID`

> ⚠️ **IMPORTANT:** Edge API keys expire every **72 days** due to Microsoft's 2025 policy change. See [Edge API Key Rotation](#edge-api-key-rotation) for rotation process.

### Required Secrets

```
EDGE_PRODUCT_ID=gnppbipjiohpjdelkllmnbmakldfdeji
EDGE_CLIENT_ID=your-client-id-guid
EDGE_API_KEY=your-api-key
```

---

## Chrome Web Store (Future)

> Chrome Web Store automation is not yet configured because the extension is not listed there. Follow these steps when creating the Chrome listing.

### Prerequisites

1. Register at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) ($5 one-time fee)
2. Create the extension listing manually first
3. Note the Extension ID from the URL

### Getting OAuth Credentials

#### Step 1: Enable Chrome Web Store API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Library**
4. Search for "Chrome Web Store API"
5. Click **Enable**

#### Step 2: Create OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - App name: "WhoRenderedThis Publisher"
   - User support email: your email
   - Developer contact: your email
4. Skip scopes (we'll add via OAuth Playground)
5. Add yourself as a test user
6. Complete the wizard

#### Step 3: Create OAuth Client

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Name: "WXT Submit"
5. Add Authorized redirect URI: `https://developers.google.com/oauthplayground`
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

#### Step 4: Get Refresh Token

1. Go to [OAuth Playground](https://developers.google.com/oauthplayground/)

2. Click the gear icon (⚙️) in the top-right

3. Check **Use your own OAuth credentials**

4. Enter your Client ID and Client Secret

5. In the left panel, scroll to **Chrome Web Store API v1.1**

6. Select `https://www.googleapis.com/auth/chromewebstore`

7. Click **Authorize APIs**

8. Sign in and grant permissions

9. Click **Exchange authorization code for tokens**

10. Copy the **Refresh Token**

### Required Secrets (Future)

```
CHROME_EXTENSION_ID=your-extension-id
CHROME_CLIENT_ID=your-client-id.apps.googleusercontent.com
CHROME_CLIENT_SECRET=your-client-secret
CHROME_REFRESH_TOKEN=your-refresh-token
```

---

## GitHub Secrets Setup

### Adding Secrets

1. Go to your repository on GitHub

2. Navigate to **Settings** → **Secrets and variables** → **Actions**

3. Click **New repository secret** for each credential

### Required Secrets Checklist

| Secret                 | Store   | Required   |
| ---------------------- | ------- | ---------- |
| `FIREFOX_EXTENSION_ID` | Firefox | ✅ Yes     |
| `FIREFOX_JWT_ISSUER`   | Firefox | ✅ Yes     |
| `FIREFOX_JWT_SECRET`   | Firefox | ✅ Yes     |
| `EDGE_PRODUCT_ID`      | Edge    | ✅ Yes     |
| `EDGE_CLIENT_ID`       | Edge    | ✅ Yes     |
| `EDGE_API_KEY`         | Edge    | ✅ Yes     |
| `CHROME_EXTENSION_ID`  | Chrome  | ❌ Not yet |
| `CHROME_CLIENT_ID`     | Chrome  | ❌ Not yet |
| `CHROME_CLIENT_SECRET` | Chrome  | ❌ Not yet |
| `CHROME_REFRESH_TOKEN` | Chrome  | ❌ Not yet |

---

## Local Testing

You can test the submit command locally without actually publishing:

### Setup

```bash
# Copy the example env file
cp .env.submit.example .env.submit

# Edit with your credentials
nano .env.submit
```

### Dry Run

```bash
# Build the extension
pnpm zip && pnpm zip:firefox

# Test Firefox submission (dry run)
source .env.submit
pnpm wxt submit --dry-run \
  --firefox-zip .output/*-firefox.zip \
  --firefox-sources-zip .output/*-sources.zip

# Test Edge submission (dry run)
pnpm wxt submit --dry-run \
  --edge-zip .output/*-chrome.zip
```

### CI Dry Run

Use the "Submit Dry Run" workflow in GitHub Actions:

1. Go to **Actions** → **Submit Dry Run**
2. Click **Run workflow**
3. Select which stores to test
4. Check the logs for authentication success

---

## Edge API Key Rotation

> ⚠️ Edge API keys expire every **72 days**. This is a Microsoft policy change from 2025.

### Setting Up Reminders

Set a calendar reminder for **60 days** after creating each API key:

```
Subject: Rotate Edge Add-ons API Key
Body:
1. Go to Partner Center > Publish API
2. Create new credentials
3. Update EDGE_API_KEY in GitHub Secrets
4. Run dry-run workflow to verify
5. Delete old credentials
```

### Rotation Process

1. **Create new credentials:**
   - Go to [Partner Center Publish API](https://partner.microsoft.com/dashboard/microsoftedge/publishapi)
   - Click **Create API credentials**
   - Copy the new API Key

2. **Update GitHub secret:**
   - Go to repo **Settings** → **Secrets** → **Actions**
   - Click on `EDGE_API_KEY`
   - Update with new value

3. **Verify with dry-run:**
   - Go to **Actions** → **Submit Dry Run**
   - Run for Edge only
   - Confirm authentication succeeds

4. **Delete old credentials:**
   - Return to Partner Center
   - Delete the expired credentials

### Automation Ideas

For teams managing multiple extensions, consider:

- GitHub Action that checks key age and creates issues
- Slack/Discord webhook notification before expiry
- Terraform/Pulumi for credential management

---

## Troubleshooting

### Firefox: "Invalid JWT"

- Verify `FIREFOX_JWT_ISSUER` format: `user:XXXXXXXX:XXX`
- Regenerate credentials at [AMO API Keys](https://addons.mozilla.org/developers/addon/api/key/)
- Ensure the extension ID matches exactly

### Edge: "401 Unauthorized"

- API key may have expired (72-day limit)
- Regenerate at [Partner Center Publish API](https://partner.microsoft.com/dashboard/microsoftedge/publishapi)
- Verify `EDGE_PRODUCT_ID` matches your extension

### Chrome: "Invalid refresh token"

- Tokens can expire if not used for extended periods
- Re-run OAuth Playground flow to get fresh token
- Ensure the test user is still added to OAuth consent screen

### Dry Run Passes But Actual Submit Fails

- Check store-specific validation (screenshots, descriptions)
- Ensure version number is higher than published version
- Review store developer console for specific rejection reasons

---

## Resources

- [WXT Publishing Guide](https://wxt.dev/guide/essentials/publishing)
- [Firefox AMO API Documentation](https://mozilla.github.io/addons-server/topics/api/auth.html)
- [Edge Publish API Documentation](https://learn.microsoft.com/en-us/microsoft-edge/extensions/update/api/using-addons-api)
- [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api)
