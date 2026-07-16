import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const parentReact = fileURLToPath(new URL('../../node_modules/react/', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      react: parentReact,
    },
  },
  test: {
    coverage: {
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/testing/i18nTestSetup.ts',
        'src/testing/runAxe.ts',
      ],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        perFile: true,
        statements: 80,
      },
    },
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    setupFiles: ['./src/testing/i18nTestSetup.ts'],
  },
});
