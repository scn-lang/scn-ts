import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/browser.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true, // Cleans the dist folder once before building.
    splitting: false,
    shims: true,
    external: ['repograph'],
  },
  {
    entry: ['src/cli.ts'],
    format: ['cjs', 'esm'],
    sourcemap: true,
    splitting: false,
    shims: true,
    external: ['repograph'],
    banner: {
      js: '#!/usr/bin/env node',
    },
    // No .d.ts files for the CLI entry point.
  },
]);