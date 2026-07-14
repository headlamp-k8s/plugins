import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/vitest-setup.ts'],
    exclude: ['node_modules/**', 'dist/**', '**/*.e2e.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/vitest-setup.ts',
        // Pure interface / type-only files — no executable statements to cover
        'src/mcp/persistence/Storage.ts',
        'src/mcp/types.ts',
      ],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
