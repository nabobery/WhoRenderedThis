// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHANNEL } from '@/lib/bridge';
import Overlay from '@/components/Overlay';
import type { ComponentInfo, ProbeResponse } from '@/lib/bridge';

describe('Overlay', () => {
  let messageHandler: ((event: MessageEvent) => void) | null = null;

  beforeEach(() => {
    vi.restoreAllMocks();
    messageHandler = null;
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      if (type === 'message') {
        messageHandler = listener as (event: MessageEvent) => void;
      }
    });
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  async function dispatchProbeResponse(
    component: ComponentInfo | null,
    rect: ProbeResponse['rect'],
  ) {
    for (let i = 0; i < 5 && !messageHandler; i += 1) {
      await Promise.resolve();
    }
    expect(messageHandler).not.toBeNull();

    await act(async () => {
      messageHandler?.({
        source: window,
        data: {
          channel: CHANNEL,
          type: 'probe-response',
          component,
          rect,
        },
      } as unknown as MessageEvent);
    });
  }

  it('renders fallback message before a probe response is received', () => {
    render(<Overlay onClose={vi.fn()} />);
    expect(screen.getByText(/No React component found/i)).toBeInTheDocument();
  });

  it('renders component details when a probe response arrives', async () => {
    render(<Overlay onClose={vi.fn()} />);

    await dispatchProbeResponse(
      {
        name: 'App',
        source: {
          fileName: 'src/App.tsx',
          lineNumber: 42,
          columnNumber: 7,
        },
      },
      { top: 10, left: 20, width: 300, height: 100 },
    );

    expect(screen.getByRole('button', { name: 'Pin' })).toBeInTheDocument();
    expect(screen.getByText('src/App.tsx:42')).toBeInTheDocument();
  });

  it('supports pin and unpin behavior', async () => {
    const user = userEvent.setup();
    render(<Overlay onClose={vi.fn()} />);

    await dispatchProbeResponse(
      {
        name: 'Button',
        source: null,
      },
      { top: 1, left: 2, width: 10, height: 20 },
    );

    await user.click(screen.getByRole('button', { name: 'Pin' }));
    expect(screen.getByRole('button', { name: 'Unpin' })).toBeInTheDocument();

    fireEvent.click(document.body);
    expect(screen.getByRole('button', { name: 'Pin' })).toBeInTheDocument();
  });

  it('pressing Escape unpins if pinned, otherwise closes overlay', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Overlay onClose={onClose} />);

    await dispatchProbeResponse(
      {
        name: 'Header',
        source: null,
      },
      { top: 0, left: 0, width: 100, height: 50 },
    );

    await user.click(screen.getByRole('button', { name: 'Pin' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Pin' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button triggers onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Overlay onClose={onClose} />);

    await dispatchProbeResponse(
      {
        name: 'Footer',
        source: null,
      },
      { top: 0, left: 0, width: 20, height: 10 },
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('copies component name and shows temporary copied feedback', async () => {
    vi.useFakeTimers();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    try {
      render(<Overlay onClose={vi.fn()} />);
      await dispatchProbeResponse(
        {
          name: 'Card',
          source: null,
        },
        { top: 0, left: 0, width: 10, height: 10 },
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Copy name' }));
        await Promise.resolve();
      });
      expect(writeTextSpy).toHaveBeenCalledWith('Card');
      expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.getByRole('button', { name: 'Copy name' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
