import { beforeEach, describe, expect, it, vi } from 'vitest';

const browserMock = {
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
};

vi.mock('wxt/browser', () => ({
  browser: browserMock,
  default: browserMock,
}));

describe('background entrypoint', () => {
  let clickListener: ((tab: { id?: number }) => Promise<void> | void) | undefined;

  beforeEach(() => {
    vi.restoreAllMocks();
    clickListener = undefined;
    browserMock.scripting.executeScript.mockReset().mockResolvedValue(undefined);
    browserMock.action.onClicked.addListener.mockReset();
    browserMock.action.onClicked.addListener.mockImplementation(
      (listener: (tab: { id?: number }) => Promise<void> | void) => {
        clickListener = listener;
      },
    );
  });

  it('injects the inspector content script when action is clicked', async () => {
    const backgroundDefinition = (await import('@/entrypoints/background')).default;

    backgroundDefinition.main();
    await clickListener?.({ id: 42 });

    expect(browserMock.scripting.executeScript).toHaveBeenCalledTimes(1);
    expect(browserMock.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ['content-scripts/inspector.js'],
    });
  });

  it('logs an error when script injection fails', async () => {
    const backgroundDefinition = (await import('@/entrypoints/background')).default;
    const testError = new Error('inject failed');
    browserMock.scripting.executeScript.mockRejectedValue(testError);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    backgroundDefinition.main();
    await clickListener?.({ id: 7 });

    expect(errorSpy).toHaveBeenCalledWith('WhoRenderedThis: failed to inject inspector', testError);
  });
});
