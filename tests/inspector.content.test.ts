// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('wxt/utils/inject-script', () => ({
  injectScript: vi.fn(),
}));

vi.mock('wxt/utils/content-script-ui/shadow-root', () => ({
  createShadowRootUi: vi.fn(),
}));

import contentScriptDefinition from '@/entrypoints/inspector.content';
import { injectScript } from 'wxt/utils/inject-script';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';

describe('inspector content script', () => {
  type ContentScriptCtx = NonNullable<Parameters<typeof contentScriptDefinition.main>[0]>;
  type InjectScriptResult = Awaited<ReturnType<typeof injectScript>>;
  type ShadowRootUiResult = Awaited<ReturnType<typeof createShadowRootUi>>;

  const injectScriptMock = vi.mocked(injectScript);
  const createShadowRootUiMock = vi.mocked(createShadowRootUi);

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('calls host cleanup function when already mounted', async () => {
    const ctx = {} as ContentScriptCtx;
    const cleanup = vi.fn();
    const existing = document.createElement('who-rendered-this') as HTMLElement & {
      __wrtCleanup?: () => void;
    };
    existing.__wrtCleanup = cleanup;
    document.body.appendChild(existing);

    await contentScriptDefinition.main(ctx);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(injectScriptMock).not.toHaveBeenCalled();
    expect(createShadowRootUiMock).not.toHaveBeenCalled();
  });

  it('removes existing host when cleanup function is missing', async () => {
    const ctx = {} as ContentScriptCtx;
    const existing = document.createElement('who-rendered-this');
    document.body.appendChild(existing);

    await contentScriptDefinition.main(ctx);

    expect(document.querySelector('who-rendered-this')).toBeNull();
  });

  it('injects main-world script and mounts shadow UI on first run', async () => {
    const ctx = {} as ContentScriptCtx;
    const ui = {
      mount: vi.fn(),
      remove: vi.fn(),
    } as unknown as ShadowRootUiResult;

    injectScriptMock.mockResolvedValue({} as InjectScriptResult);
    createShadowRootUiMock.mockResolvedValue(ui);

    await contentScriptDefinition.main(ctx);

    expect(injectScriptMock).toHaveBeenCalledTimes(1);
    expect(injectScriptMock).toHaveBeenCalledWith(
      '/react-main-world.js',
      expect.objectContaining({
        keepInDom: true,
        modifyScript: expect.any(Function),
      }),
    );

    const [, injectOptions] = injectScriptMock.mock.calls[0];
    expect(injectOptions).toBeDefined();
    const script = document.createElement('script');
    injectOptions?.modifyScript?.(script);
    expect(script.id).toBe('wrt-react-main-world');

    expect(createShadowRootUiMock).toHaveBeenCalledTimes(1);
    expect(createShadowRootUiMock).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        name: 'who-rendered-this',
        position: 'overlay',
        anchor: 'body',
      }),
    );
    expect(ui.mount).toHaveBeenCalledTimes(1);
  });
});
