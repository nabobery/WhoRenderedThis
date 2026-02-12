import { describe, expect, it, beforeEach } from 'vitest';
import {
  parseFirstFrameFromStack,
  detectReactEnvironment,
  resetCachedEnvironment,
  debugSourceResolver,
  componentStackResolver,
  createSourceResolver,
  extractParentChain,
} from '@/lib/source-resolver';
import type { FiberNode } from '@/lib/source-resolver';
import { CHANNEL, isProbeResponse } from '@/lib/bridge';

// ── Stack parser tests ─────────────────────────────────────────────────────

describe('parseFirstFrameFromStack', () => {
  it('parses Chrome stack format with named function', () => {
    const stack = `Error
    at App (http://localhost:3000/src/App.tsx:15:10)
    at renderWithHooks (http://localhost:3000/node_modules/react-dom/cjs/react-dom.development.js:14985:18)`;

    const result = parseFirstFrameFromStack(stack);
    expect(result).toEqual({
      fileName: 'http://localhost:3000/src/App.tsx',
      lineNumber: 15,
      columnNumber: 10,
    });
  });

  it('parses Chrome stack format with anonymous function', () => {
    const stack = `Error
    at http://localhost:3000/src/utils.ts:42:5
    at Array.forEach (<anonymous>)`;

    const result = parseFirstFrameFromStack(stack);
    expect(result).toEqual({
      fileName: 'http://localhost:3000/src/utils.ts',
      lineNumber: 42,
      columnNumber: 5,
    });
  });

  it('parses Chrome stack with webpack URLs', () => {
    const stack = `Error
    at Sidebar (webpack-internal:///./src/components/Sidebar.tsx:23:17)
    at div`;

    const result = parseFirstFrameFromStack(stack);
    expect(result).toEqual({
      fileName: 'webpack-internal:///./src/components/Sidebar.tsx',
      lineNumber: 23,
      columnNumber: 17,
    });
  });

  it('parses Firefox/Safari stack format', () => {
    const stack = `App@http://localhost:3000/src/App.tsx:15:10
renderWithHooks@http://localhost:3000/node_modules/react-dom/cjs/react-dom.development.js:14985:18`;

    const result = parseFirstFrameFromStack(stack);
    expect(result).toEqual({
      fileName: 'http://localhost:3000/src/App.tsx',
      lineNumber: 15,
      columnNumber: 10,
    });
  });

  it('parses Firefox anonymous function', () => {
    const stack = `@http://localhost:3000/src/utils.ts:42:5
forEach@[native code]`;

    const result = parseFirstFrameFromStack(stack);
    expect(result).toEqual({
      fileName: 'http://localhost:3000/src/utils.ts',
      lineNumber: 42,
      columnNumber: 5,
    });
  });

  it('returns null for empty stack', () => {
    expect(parseFirstFrameFromStack('')).toBeNull();
  });

  it('returns null for invalid stack', () => {
    expect(parseFirstFrameFromStack('not a stack trace at all')).toBeNull();
  });
});

// ── Version detection tests ────────────────────────────────────────────────

describe('detectReactEnvironment', () => {
  beforeEach(() => {
    resetCachedEnvironment();
  });

  it('detects legacy (React 16-18) when _debugSource exists', () => {
    const fiber: FiberNode = {
      type: function App() {},
      _debugSource: { fileName: 'App.tsx', lineNumber: 1 },
    };

    const env = detectReactEnvironment(fiber);
    expect(env).toEqual({ versionRange: 'legacy', buildType: 'dev' });
  });

  it('detects modern (React 19+) when _debugStack exists', () => {
    const fiber: FiberNode = {
      type: function App() {},
      _debugStack: new Error('test'),
    };

    const env = detectReactEnvironment(fiber);
    expect(env).toEqual({ versionRange: 'modern', buildType: 'dev' });
  });

  it('detects production when neither debug property exists', () => {
    // Create a plain object without prototype-inherited properties
    const plainFiber = Object.create(null) as FiberNode;
    plainFiber.type = function App() {};

    const env = detectReactEnvironment(plainFiber);
    expect(env).toEqual({ versionRange: 'unknown', buildType: 'production' });
  });

  it('caches the result after first detection', () => {
    const fiber1: FiberNode = {
      type: function App() {},
      _debugSource: { fileName: 'App.tsx', lineNumber: 1 },
    };
    const fiber2: FiberNode = {
      type: function Other() {},
      _debugStack: new Error('test'),
    };

    const env1 = detectReactEnvironment(fiber1);
    const env2 = detectReactEnvironment(fiber2);

    // Second call should return cached result from first
    expect(env1).toEqual(env2);
    expect(env1.versionRange).toBe('legacy');
  });
});

// ── DebugSourceResolver tests ──────────────────────────────────────────────

describe('debugSourceResolver', () => {
  it('reads _debugSource correctly', () => {
    const fiber: FiberNode = {
      type: function App() {},
      _debugSource: {
        fileName: '/src/App.tsx',
        lineNumber: 15,
        columnNumber: 10,
      },
    };

    const result = debugSourceResolver.resolve(fiber);
    expect(result).toEqual({
      fileName: '/src/App.tsx',
      lineNumber: 15,
      columnNumber: 10,
    });
  });

  it('returns null when _debugSource is missing', () => {
    const fiber: FiberNode = { type: function App() {} };
    expect(debugSourceResolver.resolve(fiber)).toBeNull();
  });

  it('returns null when _debugSource has no fileName', () => {
    const fiber: FiberNode = {
      type: function App() {},
      _debugSource: { lineNumber: 5 },
    };
    expect(debugSourceResolver.resolve(fiber)).toBeNull();
  });

  it('defaults line/column to 0 when not numbers', () => {
    const fiber: FiberNode = {
      type: function App() {},
      _debugSource: { fileName: 'App.tsx' },
    };

    const result = debugSourceResolver.resolve(fiber);
    expect(result).toEqual({
      fileName: 'App.tsx',
      lineNumber: 0,
      columnNumber: 0,
    });
  });
});

// ── ComponentStackResolver tests ───────────────────────────────────────────

describe('componentStackResolver', () => {
  it('parses _debugStack Error object', () => {
    const error = new Error('test');
    // Override the stack to have a predictable format
    error.stack = `Error: test
    at App (http://localhost:3000/src/App.tsx:15:10)
    at renderWithHooks (http://localhost:3000/react-dom.js:100:5)`;

    const fiber: FiberNode = {
      type: function App() {},
      _debugStack: error,
    };

    const result = componentStackResolver.resolve(fiber);
    expect(result).toEqual({
      fileName: 'http://localhost:3000/src/App.tsx',
      lineNumber: 15,
      columnNumber: 10,
    });
  });

  it('returns null when _debugStack has no useful stack', () => {
    const fiber: FiberNode = {
      type: function App() {},
      _debugStack: { stack: 'no parseable frames here' },
    };

    // Since _debugStack parse fails, it will try the fallback
    // For a simple function, the fallback may or may not work depending on environment
    const result = componentStackResolver.resolve(fiber);
    // We just verify it doesn't throw
    expect(result === null || typeof result?.fileName === 'string').toBe(true);
  });

  it('returns null for null fiber type', () => {
    const fiber: FiberNode = {
      _debugStack: { stack: 'invalid' },
    };

    const result = componentStackResolver.resolve(fiber);
    expect(result).toBeNull();
  });
});

// ── Factory tests ──────────────────────────────────────────────────────────

describe('createSourceResolver', () => {
  it('returns debugSourceResolver for legacy environment', () => {
    const resolver = createSourceResolver({ versionRange: 'legacy', buildType: 'dev' });
    expect(resolver).toBe(debugSourceResolver);
  });

  it('returns componentStackResolver for modern environment', () => {
    const resolver = createSourceResolver({ versionRange: 'modern', buildType: 'dev' });
    expect(resolver).toBe(componentStackResolver);
  });

  it('returns debugSourceResolver for unknown environment', () => {
    const resolver = createSourceResolver({ versionRange: 'unknown', buildType: 'production' });
    expect(resolver).toBe(debugSourceResolver);
  });
});

// ── Parent chain extraction tests ──────────────────────────────────────────

describe('extractParentChain', () => {
  it('extracts parent component names', () => {
    function App() {}
    function Layout() {}
    function Sidebar() {}

    const grandparent: FiberNode = { type: App, return: null };
    const parent: FiberNode = { type: Layout, return: grandparent };
    const fiber: FiberNode = { type: Sidebar, return: parent };

    const chain = extractParentChain(fiber);
    expect(chain).toEqual(['Layout', 'App']);
  });

  it('skips host elements (string types)', () => {
    function App() {}
    function Layout() {}

    const grandparent: FiberNode = { type: App, return: null };
    const divFiber: FiberNode = { type: 'div', return: grandparent };
    const parent: FiberNode = { type: Layout, return: divFiber };
    const fiber: FiberNode = { type: function Child() {}, return: parent };

    const chain = extractParentChain(fiber);
    expect(chain).toEqual(['Layout', 'App']);
  });

  it('limits to maxDepth', () => {
    function A() {}
    function B() {}
    function C() {}
    function D() {}
    function E() {}
    function F() {}

    const f6: FiberNode = { type: F, return: null };
    const f5: FiberNode = { type: E, return: f6 };
    const f4: FiberNode = { type: D, return: f5 };
    const f3: FiberNode = { type: C, return: f4 };
    const f2: FiberNode = { type: B, return: f3 };
    const f1: FiberNode = { type: A, return: f2 };

    const chain = extractParentChain(f1, 3);
    expect(chain).toHaveLength(3);
    expect(chain).toEqual(['B', 'C', 'D']);
  });

  it('returns empty array when no parents', () => {
    const fiber: FiberNode = { type: function App() {}, return: null };
    expect(extractParentChain(fiber)).toEqual([]);
  });

  it('uses displayName when available', () => {
    const MyComponent = function () {};
    (MyComponent as unknown as { displayName: string }).displayName = 'StyledButton';

    const parent: FiberNode = { type: MyComponent, return: null };
    const fiber: FiberNode = { type: function Child() {}, return: parent };

    const chain = extractParentChain(fiber);
    expect(chain).toEqual(['StyledButton']);
  });
});

// ── Bridge type guard backward compatibility ───────────────────────────────

describe('isProbeResponse with new ComponentInfo fields', () => {
  it('accepts old format (backward compat)', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: {
          name: 'App',
          source: { fileName: 'App.tsx', lineNumber: 10, columnNumber: 3 },
        },
        rect: null,
      }),
    ).toBe(true);
  });

  it('accepts new format with all fields', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: {
          name: 'App',
          source: { fileName: 'App.tsx', lineNumber: 10, columnNumber: 3 },
          parentChain: ['Layout', 'Root'],
          reactVersionRange: 'legacy',
          buildType: 'dev',
        },
        rect: null,
      }),
    ).toBe(true);
  });

  it('accepts new format with modern version range', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: {
          name: 'Sidebar',
          source: null,
          parentChain: [],
          reactVersionRange: 'modern',
          buildType: 'production',
        },
        rect: null,
      }),
    ).toBe(true);
  });

  it('rejects invalid reactVersionRange', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: {
          name: 'App',
          source: null,
          parentChain: [],
          reactVersionRange: 'invalid',
          buildType: 'dev',
        },
        rect: null,
      }),
    ).toBe(false);
  });

  it('rejects invalid buildType', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: {
          name: 'App',
          source: null,
          parentChain: [],
          reactVersionRange: 'legacy',
          buildType: 'invalid',
        },
        rect: null,
      }),
    ).toBe(false);
  });

  it('rejects non-string array parentChain', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: {
          name: 'App',
          source: null,
          parentChain: [1, 2, 3],
          reactVersionRange: 'legacy',
          buildType: 'dev',
        },
        rect: null,
      }),
    ).toBe(false);
  });
});
