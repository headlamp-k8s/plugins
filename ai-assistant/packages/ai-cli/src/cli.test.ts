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

/**
 * End-to-end CLI tests.
 *
 * Every test uses HEADLAMP_AI_MOCK_ALL=1 which enables:
 *  - mock-testing-model provider (fixture responses, no API key)
 *  - MockApprovalManager (auto-approve, no dialog)
 *  - MockSkillManager  (built-in skills, no network)
 *  - MockToolManager   (canned Kubernetes data, no cluster)
 *
 * This exercises the full userSend → model → skills → response pipeline
 * without any external dependencies.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

function findTsxBin(): string {
  const starts = [path.resolve(__dirname, '..'), process.cwd()];
  for (const start of starts) {
    let dir = start;
    while (true) {
      const c = path.join(dir, 'node_modules', '.bin', 'tsx');
      if (fs.existsSync(c)) return c;
      const p = path.dirname(dir);
      if (p === dir) break;
      dir = p;
    }
  }
  return 'tsx';
}

const tsxBin = findTsxBin();
const cliPath = path.resolve(__dirname, 'cli.ts');

interface CLIResult {
  stdout: string;
  stderr: string;
  /** stdout + stderr interleaved-ish (just concatenated). */
  all: string;
  exitCode: number;
}

/**
 * Run the CLI with HEADLAMP_AI_MOCK_ALL=1 plus any extra env vars.
 * Runs asynchronously so Vitest's worker can continue processing RPC messages.
 */
function run(
  args: string[],
  extraEnv: Record<string, string> = {}
): Promise<CLIResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(tsxBin, [cliPath, ...args], {
      env: {
        ...process.env,
        HEADLAMP_AI_MOCK_ALL: '1',
        ...extraEnv,
      },
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`CLI process timed out after 20000ms: ${args.join(' ')}`));
    }, 20_000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
    });
    child.stderr.on('data', chunk => {
      stderr += chunk;
    });
    child.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', exitCode => {
      clearTimeout(timeout);
      stdout = stdout.trim();
      stderr = stderr.trim();
      resolve({ stdout, stderr, all: stdout + '\n' + stderr, exitCode: exitCode ?? 0 });
    });
  });
}

describe('CLI — HEADLAMP_AI_MOCK_ALL full offline suite', { timeout: 60_000 }, () => {

  // ── model: fixture responses ────────────────────────────────────────────

  it('responds to "Hello" with the greeting fixture', async () => {
    const { stdout, exitCode } = await run(['Hello']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Headlamp AI assistant');
  });

  it('answers "What is a Pod?" with the Pod fixture', async () => {
    const { stdout, exitCode } = await run(['What is a Pod?']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Pod');
    expect(stdout.toLowerCase()).toContain('kubernetes');
  });

  it('answers "What is a Deployment?" with the Deployment fixture', async () => {
    const { stdout } = await run(['What is a Deployment?']);
    expect(stdout).toContain('Deployment');
  });

  it('answers "What is a Service?" with the Service fixture', async () => {
    const { stdout } = await run(['What is a Service?']);
    expect(stdout).toContain('Service');
  });

  it('returns the fallback response for an unrecognised query', async () => {
    const { stdout } = await run(['Tell me about quantum physics']);
    expect(stdout).toContain('mock testing model');
  });

  // ── model: template variable substitution ──────────────────────────────

  it.each([
    ['What is a ConfigMap?', 'ConfigMap'],
    ['What is a StatefulSet?', 'StatefulSet'],
    ['What is a DaemonSet?', 'DaemonSet'],
    ['What is a Namespace?', 'Namespace'],
  ])('fixture template: "%s" → contains "%s"', async (query, expected) => {
    const { stdout, exitCode } = await run([query]);
    expect(exitCode).toBe(0);
    // The <<resource>> template produces a response containing the resource name
    expect(stdout).toContain(expected);
  });

  // ── skills: MockSkillManager is activated ──────────────────────────────

  it('logs mock skill set activation (skills path exercised)', async () => {
    const { stderr } = await run(['What is a Pod?']);
    expect(stderr).toContain('mock skill set');
  });

  it('skills activation runs getSkillsPromptForQuery for every query', async () => {
    // A second distinct query also triggers skills routing
    const { stderr } = await run(['Hello']);
    expect(stderr).toContain('mock skill set');
  });

  // ── approval: MockApprovalManager is activated ─────────────────────────

  it('logs auto-approval activation (approval path exercised)', async () => {
    const { stderr } = await run(['Hello']);
    expect(stderr).toContain('Auto-approving');
  });

  // ── provider selection ─────────────────────────────────────────────────

  it('forces mock-testing-model even without --provider flag', async () => {
    // MOCK_ALL overrides auto-detection; stdout must contain a fixture response
    const { stdout, exitCode } = await run(['What is a Pod?']);
    expect(exitCode).toBe(0);
    expect(stdout).not.toContain('Error:');
    expect(stdout.length).toBeGreaterThan(0);
  });

  it('explicit --provider mock-testing-model still works inside MOCK_ALL', async () => {
    const { stdout, exitCode } = await run(['--provider', 'mock-testing-model', 'Hello']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Headlamp AI assistant');
  });

  // ── config file ────────────────────────────────────────────────────────

  it('loads provider config from --config file', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'headlamp-ai-cli-test-'));
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ provider: 'mock-testing-model', config: {} }));
    try {
      const { stdout, exitCode } = await run(['--config', configPath, 'Hello']);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Headlamp AI assistant');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── multi-turn: output varies by query ────────────────────────────────

  it('different queries produce different responses (model is exercised per query)', async () => {
    const { stdout: pod } = await run(['What is a Pod?']);
    const { stdout: dep } = await run(['What is a Deployment?']);
    // Template substitution makes Pod and Deployment responses different
    expect(pod).not.toBe(dep);
  });

  // ── help text ─────────────────────────────────────────────────────────

  it('--help documents mock-testing-model provider', async () => {
    const { stdout, exitCode } = await run(['--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('mock-testing-model');
  });

  it('--help documents --mock-skills, --mock-tools, --auto-approve', async () => {
    const { stdout } = await run(['--help']);
    expect(stdout).toContain('--mock-skills');
    expect(stdout).toContain('--mock-tools');
    expect(stdout).toContain('--auto-approve');
    expect(stdout).toContain('HEADLAMP_AI_MOCK_ALL');
  });

  // ── individual env vars work without MOCK_ALL ─────────────────────────

  it('HEADLAMP_AI_MOCK_SKILLS=1 activates skills without MOCK_ALL', async () => {
    const { stderr } = await run(['What is a Pod?'], {
      HEADLAMP_AI_MOCK_ALL: '',
      HEADLAMP_AI_PROVIDER: 'mock-testing-model',
      HEADLAMP_AI_MOCK_SKILLS: '1',
    });
    expect(stderr).toContain('mock skill set');
  });

  it('HEADLAMP_AI_AUTO_APPROVE=1 activates auto-approve without MOCK_ALL', async () => {
    const { stderr } = await run(['Hello'], {
      HEADLAMP_AI_MOCK_ALL: '',
      HEADLAMP_AI_PROVIDER: 'mock-testing-model',
      HEADLAMP_AI_AUTO_APPROVE: '1',
    });
    expect(stderr).toContain('Auto-approving');
  });
});
