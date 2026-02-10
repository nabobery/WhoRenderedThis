import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TextDecoder, TextEncoder } from 'node:util';
import { afterEach } from 'vitest';

afterEach(() => {
  if (typeof document !== 'undefined') {
    cleanup();
  }
});

if (!(new TextEncoder().encode('') instanceof Uint8Array)) {
  Object.defineProperty(globalThis, 'TextEncoder', {
    configurable: true,
    value: TextEncoder,
  });
  Object.defineProperty(globalThis, 'TextDecoder', {
    configurable: true,
    value: TextDecoder,
  });
}

if (typeof window !== 'undefined') {
  if (typeof navigator !== 'undefined' && !('clipboard' in navigator)) {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (_text: string) => undefined,
      },
    });
  }

  if (typeof document !== 'undefined' && typeof document.execCommand !== 'function') {
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: (_command: string) => true,
    });
  }

  if (typeof window.requestAnimationFrame !== 'function') {
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (cb: FrameRequestCallback) =>
        window.setTimeout(() => cb(performance.now()), 0) as unknown as number,
    });
  }

  if (typeof window.cancelAnimationFrame !== 'function') {
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: (id: number) => {
        window.clearTimeout(id);
      },
    });
  }
}
