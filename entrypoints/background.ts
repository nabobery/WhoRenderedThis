/**
 * Background service worker (MV3).
 *
 * Clicking the extension action icon toggles the inspector overlay
 * on the active tab by injecting/executing the runtime content script.
 */
export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    try {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-scripts/inspector.js'],
      });
    } catch (err) {
      console.error('WhoRenderedThis: failed to inject inspector', err);
    }
  });
});
