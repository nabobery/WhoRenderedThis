import { describe, expect, it } from 'vitest';
import { CHANNEL, isProbeRequest, isProbeResponse } from '@/lib/bridge';

describe('isProbeRequest', () => {
  it('accepts a valid probe request', () => {
    expect(
      isProbeRequest({
        channel: CHANNEL,
        type: 'probe-request',
        x: 120,
        y: 240,
      }),
    ).toBe(true);
  });

  it('rejects invalid numeric values', () => {
    expect(
      isProbeRequest({
        channel: CHANNEL,
        type: 'probe-request',
        x: Number.NaN,
        y: 240,
      }),
    ).toBe(false);

    expect(
      isProbeRequest({
        channel: CHANNEL,
        type: 'probe-request',
        x: Infinity,
        y: 240,
      }),
    ).toBe(false);
  });

  it('rejects wrong channel or type', () => {
    expect(
      isProbeRequest({
        channel: 'wrong-channel',
        type: 'probe-request',
        x: 1,
        y: 2,
      }),
    ).toBe(false);

    expect(
      isProbeRequest({
        channel: CHANNEL,
        type: 'probe-response',
        x: 1,
        y: 2,
      }),
    ).toBe(false);
  });
});

describe('isProbeResponse', () => {
  it('accepts a valid response with component and rect', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: {
          name: 'App',
          source: {
            fileName: 'App.tsx',
            lineNumber: 10,
            columnNumber: 3,
          },
        },
        rect: { top: 1, left: 2, width: 100, height: 50 },
      }),
    ).toBe(true);
  });

  it('accepts null component and null rect', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: null,
        rect: null,
      }),
    ).toBe(true);
  });

  it('rejects invalid component source shape', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: {
          name: 'App',
          source: {
            fileName: 'App.tsx',
            lineNumber: '10',
            columnNumber: 3,
          },
        },
        rect: null,
      }),
    ).toBe(false);
  });

  it('rejects invalid rect values', () => {
    expect(
      isProbeResponse({
        channel: CHANNEL,
        type: 'probe-response',
        component: null,
        rect: { top: 0, left: 0, width: Number.NaN, height: 5 },
      }),
    ).toBe(false);
  });
});
