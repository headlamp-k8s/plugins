/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * End-to-end tests for the headlamp-ai CLI using the mock-testing-model provider.
 *
 * These tests run the compiled CLI binary and verify that it correctly:
 * - Recognizes the mock-testing-model provider
 * - Matches fixture prompts and returns canned responses
 * - Handles template variable substitution
 * - Loads config from a --config file
 * - Returns the fallback response for unmatched prompts
 */
describe('CLI e2e with mock-testing-model', () => {
  // Run src/cli.ts directly via tsx — no build step required.
  const tsxBin = path.resolve(__dirname, '..', 'node_modules', '.bin', 'tsx');
  const cliPath = path.resolve(__dirname, 'cli.ts');

  // Helper to run the CLI and capture stdout.
  function runCLI(args: string[], env?: Record<string, string>): string {
    const result = execFileSync(tsxBin, [cliPath, ...args], {
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      timeout: 15_000,
    });
    return result.trim();
  }

  it('responds to "Hello" with the greeting fixture', () => {
    const output = runCLI(['--provider', 'mock-testing-model', 'Hello']);
    expect(output).toContain('Headlamp AI assistant');
  });

  it('matches template variables (<<resource>>)', () => {
    const output = runCLI(['--provider', 'mock-testing-model', 'What is a Pod?']);
    expect(output).toContain('Pod');
    expect(output).toContain('Kubernetes resource');
  });

  it('matches a different template variable value', () => {
    const output = runCLI(['--provider', 'mock-testing-model', 'What is a Deployment?']);
    expect(output).toContain('Deployment');
    expect(output).toContain('Kubernetes resource');
  });

  it('returns fallback for unmatched prompts', () => {
    const output = runCLI(['--provider', 'mock-testing-model', 'Tell me about quantum physics']);
    expect(output).toContain('mock testing model');
  });

  it('loads provider from a config file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'headlamp-ai-test-'));
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        provider: 'mock-testing-model',
        config: {},
      })
    );

    try {
      const output = runCLI(['--config', configPath, 'Hello']);
      expect(output).toContain('Headlamp AI assistant');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('loads provider from environment variables', () => {
    const output = runCLI(['What is a Service?'], {
      HEADLAMP_AI_PROVIDER: 'mock-testing-model',
    });
    expect(output).toContain('Service');
    expect(output).toContain('Kubernetes resource');
  });

  it('shows help text that includes mock-testing-model', () => {
    const output = runCLI(['--help']);
    expect(output).toContain('mock-testing-model');
  });
});
