import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const e2eDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: e2eDir,
  outputDir: path.join(e2eDir, 'test-results'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.HEADLAMP_URL || 'http://127.0.0.1:4466',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
