import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// WXT resolves a dev-server port during startup; in some sandboxed environments
// random-port selection can fail, so we pin a deterministic port for tests.
const plugins = await WxtVitest({
  dev: {
    server: {
      port: 3123,
    },
  },
});

export default defineConfig({
  plugins,
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
    },
  },
});
