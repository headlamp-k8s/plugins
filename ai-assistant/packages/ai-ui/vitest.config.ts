import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    setupFiles: ['./src/testing/i18nTestSetup.ts'],
  },
});
