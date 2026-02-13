/**
 * React version-aware source location extraction.
 *
 * Extracted into a standalone module so every function can be
 * directly unit-tested (unlike code inside a defineUnlistedScript closure).
 */
import type { ParentInfo, ReactBuildType, ReactVersionRange } from '@/lib/bridge';

// ── Public interfaces ──────────────────────────────────────────────────────

export interface SourceLocation {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface SourceResolver {
  resolve(fiber: FiberNode): SourceLocation | null;
}

export interface ReactEnvironment {
  versionRange: ReactVersionRange;
  buildType: ReactBuildType;
}

// ── Fiber node shape (minimal) ─────────────────────────────────────────────

export interface FiberNode {
  type?: unknown;
  return?: FiberNode | null;
  child?: FiberNode | null;
  sibling?: FiberNode | null;
  stateNode?: unknown;
  _debugSource?: {
    fileName?: unknown;
    lineNumber?: unknown;
    columnNumber?: unknown;
  };
  _debugStack?: unknown;
  _debugOwner?: FiberNode | null;
  _debugInfo?: unknown;
  _debugTask?: unknown;
}

// ── React version detection ────────────────────────────────────────────────

let cachedEnv: ReactEnvironment | null = null;

export function detectReactEnvironment(fiber: FiberNode): ReactEnvironment {
  if (cachedEnv) return cachedEnv;

  if ('_debugSource' in fiber) {
    cachedEnv = { versionRange: 'legacy', buildType: 'dev' };
  } else if ('_debugStack' in fiber) {
    cachedEnv = { versionRange: 'modern', buildType: 'dev' };
  } else {
    cachedEnv = { versionRange: 'unknown', buildType: 'production' };
  }

  return cachedEnv;
}

/** Reset cached environment — used only by tests. */
export function resetCachedEnvironment(): void {
  cachedEnv = null;
}

// ── Stack trace parser ─────────────────────────────────────────────────────

// Chrome/V8:  "    at ComponentName (http://localhost:3000/src/App.tsx:15:10)"
//             "    at http://localhost:3000/src/App.tsx:15:10"
const CHROME_FRAME_RE = /^ *at (?:(.+) \((?:(.+):(\d+):(\d+))\)|(.+):(\d+):(\d+))$/;

// Firefox/Safari: "ComponentName@http://localhost:3000/src/App.tsx:15:10"
const FIREFOX_FRAME_RE = /^([^@]*)@(.+):(\d+):(\d+)$/;

export function parseFirstFrameFromStack(stack: string): SourceLocation | null {
  const lines = stack.split('\n');
  const isChrome = /^\s*at /m.test(stack);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isChrome) {
      const m = CHROME_FRAME_RE.exec(line);
      if (m) {
        // Named function match: groups 1-4. Anonymous/bare URL: groups 5-7.
        const fileName = m[2] ?? m[5];
        const lineNumber = m[3] ?? m[6];
        const columnNumber = m[4] ?? m[7];
        if (fileName && lineNumber && columnNumber) {
          return {
            fileName,
            lineNumber: parseInt(lineNumber, 10),
            columnNumber: parseInt(columnNumber, 10),
          };
        }
      }
    } else {
      const m = FIREFOX_FRAME_RE.exec(trimmed);
      if (m) {
        const fileName = m[2];
        const lineNumber = m[3];
        const columnNumber = m[4];
        if (fileName && lineNumber && columnNumber) {
          return {
            fileName,
            lineNumber: parseInt(lineNumber, 10),
            columnNumber: parseInt(columnNumber, 10),
          };
        }
      }
    }
  }

  return null;
}

// ── DebugSourceResolver (React 16-18) ──────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const debugSourceResolver: SourceResolver = {
  resolve(fiber: FiberNode): SourceLocation | null {
    const ds = fiber._debugSource;
    if (!ds || !isRecord(ds)) return null;
    if (typeof ds.fileName !== 'string') return null;

    return {
      fileName: ds.fileName,
      lineNumber: typeof ds.lineNumber === 'number' ? ds.lineNumber : 0,
      columnNumber: typeof ds.columnNumber === 'number' ? ds.columnNumber : 0,
    };
  },
};

// ── ComponentStackResolver (React 19+) ─────────────────────────────────────

const sourceCache = new WeakMap<object, SourceLocation | null>();

function getStringProp(obj: object, key: string): string | null {
  const value = (obj as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

function unwrapComponentType(type: unknown): ((...args: unknown[]) => unknown) | null {
  if (typeof type === 'function') return type as (...args: unknown[]) => unknown;

  if (isRecord(type)) {
    // React.forwardRef — unwrap .render
    if (typeof type.render === 'function') return type.render as (...args: unknown[]) => unknown;
    // React.memo — unwrap .type
    if (type.type) return unwrapComponentType(type.type);
  }

  return null;
}

function describeNativeComponentFrame(fn: (...args: unknown[]) => unknown): SourceLocation | null {
  // Generate a "control" stack (from this frame) and a "sample" stack
  // (from calling the component). The difference isolates the component frame.
  const control = new Error();
  let sample: Error | null = null;

  try {
    // Detect if it's a class component by checking prototype.isReactComponent
    const proto = fn.prototype;
    if (proto && typeof proto.isReactComponent === 'object') {
      // Class component — use Reflect.construct to avoid calling the constructor directly
      try {
        Reflect.construct(fn, []);
      } catch (e) {
        sample = e instanceof Error ? e : null;
      }
      if (!sample) {
        try {
          Reflect.construct(fn, [{}]);
        } catch (e) {
          sample = e instanceof Error ? e : null;
        }
      }
    } else {
      // Function component
      try {
        const result = fn({});
        // Handle async components that return a promise
        if (result && typeof (result as { then?: unknown }).then === 'function') {
          // We got the error we need from the control frame
        }
      } catch (e) {
        sample = e instanceof Error ? e : null;
      }

      // If the function didn't throw, create a sample by wrapping it
      if (!sample) {
        const fakeError = new Error();
        // Try to get the stack from the function call site
        sample = fakeError;
      }
    }
  } catch {
    return null;
  }

  if (!sample?.stack || !control.stack) return null;

  // Compare stacks: find the first frame in sample that doesn't appear in control
  const controlLines = control.stack.split('\n');
  const sampleLines = sample.stack.split('\n');

  // Walk from the bottom (shared frames) to find the divergence point
  let ci = controlLines.length - 1;
  let si = sampleLines.length - 1;

  while (ci >= 0 && si >= 0 && controlLines[ci] === sampleLines[si]) {
    ci--;
    si--;
  }

  // The first divergent frame in the sample stack is the component frame
  if (si >= 0) {
    const componentFrame = sampleLines[si];
    if (componentFrame) {
      return parseFirstFrameFromStack(componentFrame);
    }
  }

  return null;
}

export const componentStackResolver: SourceResolver = {
  resolve(fiber: FiberNode): SourceLocation | null {
    // Phase 1: Try _debugStack (Error object with .stack)
    const debugStack = fiber._debugStack;
    if (debugStack && isRecord(debugStack) && typeof debugStack.stack === 'string') {
      const loc = parseFirstFrameFromStack(debugStack.stack);
      if (loc) return loc;
    }

    // Phase 2: Fallback — call the component to generate a stack trace
    const type = fiber.type;
    if (!type) return null;

    const typeKey = typeof type === 'object' || typeof type === 'function' ? type : null;
    if (!typeKey) return null;

    // Check cache
    if (sourceCache.has(typeKey)) return sourceCache.get(typeKey) ?? null;

    const fn = unwrapComponentType(type);
    if (!fn) {
      sourceCache.set(typeKey, null);
      return null;
    }

    const loc = describeNativeComponentFrame(fn);
    sourceCache.set(typeKey, loc);
    return loc;
  },
};

// ── Factory ────────────────────────────────────────────────────────────────

let cachedResolver: SourceResolver | null = null;

export function createSourceResolver(env: ReactEnvironment): SourceResolver {
  if (env.versionRange === 'modern') return componentStackResolver;
  // For legacy and unknown, try _debugSource first (gracefully returns null on production)
  return debugSourceResolver;
}

export function getSourceResolver(fiber: FiberNode): SourceResolver {
  if (cachedResolver) return cachedResolver;
  const env = detectReactEnvironment(fiber);
  cachedResolver = createSourceResolver(env);
  return cachedResolver;
}

/** Reset cached resolver — used only by tests. */
export function resetCachedResolver(): void {
  cachedResolver = null;
}

// ── Parent chain extraction ────────────────────────────────────────────────

function getComponentName(type: unknown): string {
  if (typeof type === 'function') {
    const displayName = getStringProp(type as unknown as object, 'displayName');
    return displayName ?? type.name ?? 'Anonymous';
  }

  if (isRecord(type)) {
    const displayName = getStringProp(type, 'displayName');
    if (displayName) return displayName;

    const render = type.render;
    if (typeof render === 'function') return getComponentName(render);

    const inner = type.type;
    if (inner) return getComponentName(inner);
  }

  return 'Anonymous';
}

export function extractParentChain(
  fiber: FiberNode,
  resolver: SourceResolver,
  maxDepth = 5,
): ParentInfo[] {
  const chain: ParentInfo[] = [];
  let current = fiber.return ?? null;

  while (current && chain.length < maxDepth) {
    if (current.type && typeof current.type !== 'string' && typeof current.type !== 'symbol') {
      chain.push({
        name: getComponentName(current.type),
        source: resolver.resolve(current),
      });
    }
    current = current.return ?? null;
  }

  return chain;
}
