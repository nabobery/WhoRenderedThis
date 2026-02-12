/**
 * Message types exchanged between the content script (isolated world)
 * and the main-world injected script via window.postMessage.
 */

// ── Unique channel key so we don't collide with other postMessage traffic ──
export const CHANNEL = 'who-rendered-this';

// ── React environment type aliases ──────────────────────────────────────────
export type ReactBuildType = 'dev' | 'production' | 'unknown';
// legacy = React 16-18 (_debugSource), modern = React 19+ (_debugStack)
export type ReactVersionRange = 'legacy' | 'modern' | 'unknown';

// ── Request: content script → main world ────────────────────────────────────
export interface ProbeRequest {
  channel: typeof CHANNEL;
  type: 'probe-request';
  x: number;
  y: number;
}

// ── Response: main world → content script ───────────────────────────────────
export interface ComponentInfo {
  name: string;
  source: { fileName: string; lineNumber: number; columnNumber: number } | null;
  parentChain: string[];
  reactVersionRange: ReactVersionRange;
  buildType: ReactBuildType;
}

export interface ProbeResponse {
  channel: typeof CHANNEL;
  type: 'probe-response';
  component: ComponentInfo | null;
  rect: { top: number; left: number; width: number; height: number } | null;
}

// ── Discriminated union of every message on the channel ─────────────────────
export type BridgeMessage = ProbeRequest | ProbeResponse;

// ── Helpers ─────────────────────────────────────────────────────────────────
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isComponentInfo(value: unknown): value is ComponentInfo {
  if (!isRecord(value)) return false;
  if (typeof value.name !== 'string') return false;

  const source = value.source;
  if (source !== null) {
    if (!isRecord(source)) return false;
    if (
      typeof source.fileName !== 'string' ||
      !isFiniteNumber(source.lineNumber) ||
      !isFiniteNumber(source.columnNumber)
    )
      return false;
  }

  // Validate new fields when present (backward-compatible)
  if ('parentChain' in value && !isStringArray(value.parentChain)) return false;
  if ('reactVersionRange' in value) {
    const v = value.reactVersionRange;
    if (v !== 'legacy' && v !== 'modern' && v !== 'unknown') return false;
  }
  if ('buildType' in value) {
    const b = value.buildType;
    if (b !== 'dev' && b !== 'production' && b !== 'unknown') return false;
  }

  return true;
}

function isRect(value: unknown): value is ProbeResponse['rect'] {
  if (value === null) return true;
  if (!isRecord(value)) return false;

  return (
    isFiniteNumber(value.top) &&
    isFiniteNumber(value.left) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height)
  );
}

export function isProbeRequest(data: unknown): data is ProbeRequest {
  if (!isRecord(data)) return false;
  return (
    data.channel === CHANNEL &&
    data.type === 'probe-request' &&
    isFiniteNumber(data.x) &&
    isFiniteNumber(data.y)
  );
}

export function isProbeResponse(data: unknown): data is ProbeResponse {
  if (!isRecord(data)) return false;
  if (data.channel !== CHANNEL || data.type !== 'probe-response') return false;

  const component = data.component;
  const rect = data.rect;

  return (component === null || isComponentInfo(component)) && isRect(rect);
}
