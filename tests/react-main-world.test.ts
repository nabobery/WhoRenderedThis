// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHANNEL } from '@/lib/bridge';

interface FiberNode {
  type?: unknown;
  return?: FiberNode | null;
  child?: FiberNode | null;
  sibling?: FiberNode | null;
  stateNode?: unknown;
}

describe('react main-world script', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    delete (window as Window & { __wrtMainWorldLoaded?: boolean }).__wrtMainWorldLoaded;
  });

  async function loadAndRunMainWorldScript() {
    vi.resetModules();
    const mod = await import('@/entrypoints/react-main-world');
    mod.default.main();
  }

  function dispatchProbeRequest(x: number, y: number) {
    const event = new MessageEvent('message', {
      data: {
        channel: CHANNEL,
        type: 'probe-request',
        x,
        y,
      },
    });
    Object.defineProperty(event, 'source', { value: window });
    window.dispatchEvent(event);
  }

  it('responds with component info and bounding rect for a probe request', async () => {
    const hoveredEl = document.createElement('button');
    document.body.appendChild(hoveredEl);

    const ownedDomNode = document.createElement('div');
    document.body.appendChild(ownedDomNode);
    vi.spyOn(ownedDomNode, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 20,
      width: 100,
      height: 80,
      bottom: 90,
      right: 120,
      x: 20,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);

    function TestComponent() {
      return null;
    }

    const hostFiber: FiberNode = {
      type: 'button',
      return: {
        type: TestComponent,
        child: {
          type: 'div',
          stateNode: ownedDomNode,
          child: null,
          sibling: null,
          return: null,
        },
        return: null,
      },
    };

    Object.defineProperty(hoveredEl, '__reactFiber$test', {
      value: hostFiber,
      configurable: true,
    });

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => hoveredEl),
    });
    const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => {});

    await loadAndRunMainWorldScript();
    dispatchProbeRequest(12, 24);

    const expectedTarget = window.location.origin === 'null' ? '*' : window.location.origin;
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: CHANNEL,
        type: 'probe-response',
        component: expect.objectContaining({ name: 'TestComponent' }),
        rect: {
          top: 10,
          left: 20,
          width: 100,
          height: 80,
        },
      }),
      expectedTarget,
    );
  });

  it('temporarily marks overlay hosts with probing attribute while probing', async () => {
    const host = document.createElement('who-rendered-this');
    document.body.appendChild(host);

    const hoveredEl = document.createElement('span');
    document.body.appendChild(hoveredEl);

    Object.defineProperty(hoveredEl, '__reactFiber$test', {
      value: null,
      configurable: true,
    });

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => {
        expect(host.getAttribute('data-wrt-probing')).toBe('1');
        return hoveredEl;
      }),
    });
    vi.spyOn(window, 'postMessage').mockImplementation(() => {});

    await loadAndRunMainWorldScript();
    dispatchProbeRequest(1, 2);

    expect(host.hasAttribute('data-wrt-probing')).toBe(false);
  });
});
