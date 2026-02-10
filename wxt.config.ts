import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  hooks: {
    'build:manifestGenerated': (_, manifest) => {
      // Remove empty content_scripts array - Edge Add-ons store rejects it
      if (Array.isArray(manifest.content_scripts) && manifest.content_scripts.length === 0) {
        delete manifest.content_scripts;
      }
    },
  },
  manifest: {
    name: 'WhoRenderedThis',
    description: 'Hover over any element on a React app to see which component rendered it.',
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    // No popup — action click toggles the inspector
    action: {},
    permissions: ['activeTab', 'scripting'],
    web_accessible_resources: [
      {
        resources: ['react-main-world.js'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
