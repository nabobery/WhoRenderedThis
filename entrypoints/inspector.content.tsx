/**
 * Runtime content script — injected on-demand by the background service worker
 * when the user clicks the extension icon.
 *
 * It does two things:
 * 1. Injects the main-world script (react-main-world.js) so it can access
 *    React Fiber internals on the page.
 * 2. Mounts a Shadow-DOM-isolated React overlay that shows component info
 *    as the user hovers.
 *
 * If the overlay is already mounted, a second injection tears it down (toggle).
 */
import { createRoot, type Root } from 'react-dom/client';
import Overlay from '@/components/Overlay';
import '@/components/inspector-host.css';

// The WXT shadow root host is a custom element with this tag name
const HOST_TAG = 'who-rendered-this';
const MAIN_WORLD_SCRIPT_ID = 'wrt-react-main-world';

type InspectorHostElement = HTMLElement & {
  __wrtCleanup?: () => void;
};

export default defineContentScript({
  matches: ['<all_urls>'],
  registration: 'runtime',
  cssInjectionMode: 'ui',

  async main(ctx) {
    // ── Toggle off if already active ────────────────────────────────────
    const existing = document.querySelector(HOST_TAG) as InspectorHostElement | null;
    if (existing) {
      if (typeof existing.__wrtCleanup === 'function') {
        existing.__wrtCleanup();
      } else {
        existing.remove();
      }
      return;
    }

    // ── Inject main-world script (idempotent) ───────────────────────────
    if (!document.getElementById(MAIN_WORLD_SCRIPT_ID)) {
      await injectScript('/react-main-world.js', {
        keepInDom: true,
        modifyScript(script) {
          script.id = MAIN_WORLD_SCRIPT_ID;
        },
      });
    }

    // ── Mount shadow-root UI ────────────────────────────────────────────
    const ui = await createShadowRootUi<Root>(ctx, {
      name: HOST_TAG,
      position: 'overlay',
      anchor: 'body',
      onMount(container, _shadowRoot, shadowHost) {
        const host = shadowHost as InspectorHostElement;
        host.__wrtCleanup = () => ui.remove();

        const root = createRoot(container);
        root.render(
          <Overlay
            onClose={() => {
              ui.remove();
            }}
          />,
        );
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
