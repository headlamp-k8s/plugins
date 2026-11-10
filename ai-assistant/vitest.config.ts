import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: './node_modules/@kinvolk/headlamp-plugin/config/vite.config.mjs',
        test: {
          name: 'plugin',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['**/packages/**', '**/node_modules/**'],
        },
      },
      'packages/ai-common/vitest.config.ts',
      'packages/ai-ui/vitest.config.ts',
      {
        test: {
          name: 'ai-cli',
          root: './packages/ai-cli',
          include: ['src/**/*.test.ts'],
          testTimeout: 30_000,
          globals: true,
          passWithNoTests: true,
        },
      },
    ],
  },
});
