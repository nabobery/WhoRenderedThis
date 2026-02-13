/**
 * Unlisted script that runs in the **main world** of the page.
 * It has direct access to the same JS context as the page itself,
 * so it can read React's internal `__reactFiber$` properties.
 *
 * Communication with the isolated-world content script happens
 * exclusively via `window.postMessage`.
 */
import { CHANNEL, isProbeRequest } from '@/lib/bridge';
import type { ComponentInfo, ProbeResponse } from '@/lib/bridge';
import {
  detectReactEnvironment,
  getSourceResolver,
  extractParentChain,
} from '@/lib/source-resolver';
import type { FiberNode } from '@/lib/source-resolver';

export default defineUnlistedScript(() => {
  // If this script is injected twice, avoid registering duplicate listeners.
  const globalWindow = window as unknown as { __wrtMainWorldLoaded?: boolean };
  if (globalWindow.__wrtMainWorldLoaded) return;
  globalWindow.__wrtMainWorldLoaded = true;

  // ── Fiber key prefixes across React versions ────────────────────────────
  const FIBER_PREFIXES = ['__reactFiber$', '__reactInternalInstance$'];
  const OVERLAY_HOST_TAG = 'who-rendered-this';
  const PROBING_ATTR = 'data-wrt-probing';

  function getStringProp(obj: object, key: string): string | null {
    const value = (obj as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  function getComponentName(type: unknown): string {
    if (typeof type === 'function') {
      const displayName = getStringProp(type as unknown as object, 'displayName');
      return displayName ?? type.name ?? 'Anonymous';
    }

    if (isRecord(type)) {
      const displayName = getStringProp(type, 'displayName');
      if (displayName) return displayName;

      // React.forwardRef
      const render = type.render;
      if (typeof render === 'function') return getComponentName(render);

      // React.memo
      const inner = type.type;
      if (inner) return getComponentName(inner);
    }

    return 'Anonymous';
  }

  /**
   * Given a DOM element, find the React Fiber node attached to it.
   */
  function getFiber(el: Element): FiberNode | null {
    const keys = Object.getOwnPropertyNames(el);
    for (const key of keys) {
      for (const prefix of FIBER_PREFIXES) {
        if (!key.startsWith(prefix)) continue;
        const value = (el as unknown as Record<string, unknown>)[key];
        if (typeof value === 'object' && value !== null) return value as FiberNode;
      }
    }
    return null;
  }

  /**
   * Walk up the Fiber `.return` chain to find the nearest user component
   * (i.e. a Function or Class component, not a HostComponent like "div").
   */
  function findNearestComponentFiber(fiber: FiberNode): FiberNode | null {
    let current: FiberNode | null | undefined = fiber;
    while (current) {
      // A user component has a function (or class) as its `type`,
      // whereas host components have a string type like "div" / "span".
      if (current.type && typeof current.type !== 'string' && typeof current.type !== 'symbol') {
        return current;
      }
      current = current.return;
    }
    return null;
  }

  function findFirstHostDomNode(fiber: FiberNode): Element | null {
    const start = fiber.child;
    if (!start) return null;

    const stack: FiberNode[] = [start];
    let visited = 0;

    // Guard against pathological trees.
    while (stack.length && visited < 10_000) {
      visited += 1;
      const node = stack.pop();
      if (!node) continue;

      if (typeof node.type === 'string' && node.stateNode instanceof Element) {
        return node.stateNode;
      }

      if (node.sibling) stack.push(node.sibling);
      if (node.child) stack.push(node.child);
    }

    return null;
  }

  /**
   * Extract human-readable component info from a Fiber node.
   * Uses version-aware strategy pattern to resolve source locations
   * across React 16-18 (_debugSource) and React 19+ (_debugStack).
   */
  function extractComponentInfo(fiber: FiberNode): ComponentInfo {
    const name = getComponentName(fiber.type);
    const env = detectReactEnvironment(fiber);
    const resolver = getSourceResolver(fiber);
    const source = resolver.resolve(fiber);
    const parentChain = extractParentChain(fiber, resolver);
    return {
      name,
      source,
      parentChain,
      reactVersionRange: env.versionRange,
      buildType: env.buildType,
    };
  }

  function withOverlayDisabled<T>(fn: () => T): T {
    const hosts = document.querySelectorAll<HTMLElement>(OVERLAY_HOST_TAG);
    if (!hosts.length) return fn();

    hosts.forEach((host) => host.setAttribute(PROBING_ATTR, '1'));
    try {
      return fn();
    } finally {
      hosts.forEach((host) => host.removeAttribute(PROBING_ATTR));
    }
  }

  // ── Listen for probe requests from the content script ───────────────────
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!isProbeRequest(event.data)) return;

    const { x, y } = event.data;
    const el = withOverlayDisabled(() => document.elementFromPoint(x, y));

    if (!el) {
      const resp: ProbeResponse = {
        channel: CHANNEL,
        type: 'probe-response',
        component: null,
        rect: null,
      };
      window.postMessage(resp, window.location.origin === 'null' ? '*' : window.location.origin);
      return;
    }

    const fiber = getFiber(el);
    const componentFiber = fiber ? findNearestComponentFiber(fiber) : null;

    let component: ComponentInfo | null = null;
    let rect: ProbeResponse['rect'] = null;

    if (componentFiber) {
      component = extractComponentInfo(componentFiber);

      // Find the nearest DOM node owned by this component for bounding rect.
      // The stateNode of a host-component fiber is the DOM element.
      let domNode = findFirstHostDomNode(componentFiber);

      // Fallback: use the originally hovered element
      if (!domNode) domNode = el;

      const domRect = domNode.getBoundingClientRect();
      rect = {
        top: domRect.top,
        left: domRect.left,
        width: domRect.width,
        height: domRect.height,
      };
    }

    const resp: ProbeResponse = {
      channel: CHANNEL,
      type: 'probe-response',
      component,
      rect,
    };
    window.postMessage(resp, window.location.origin === 'null' ? '*' : window.location.origin);
  });

  console.info('[WhoRenderedThis] Main-world script loaded');
});
