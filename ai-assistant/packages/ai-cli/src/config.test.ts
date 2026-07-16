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

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configFromEnv,
  getHeadlampDataDir,
  loadAppConfig,
  loadAppMCPSettings,
  loadConfigFile,
  replaceFileSync,
  saveHeadlampAIConfig,
} from './config.js';

describe('getHeadlampDataDir', () => {
  it('returns a non-empty string', () => {
    expect(typeof getHeadlampDataDir()).toBe('string');
    expect(getHeadlampDataDir().length).toBeGreaterThan(0);
  });

  it('respects HEADLAMP_DATA_DIR env override', () => {
    const prev = process.env.HEADLAMP_DATA_DIR;
    process.env.HEADLAMP_DATA_DIR = '/tmp/test-headlamp';
    try {
      expect(getHeadlampDataDir()).toBe('/tmp/test-headlamp');
    } finally {
      if (prev === undefined) delete process.env.HEADLAMP_DATA_DIR;
      else process.env.HEADLAMP_DATA_DIR = prev;
    }
  });
});

describe('loadAppConfig', () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'headlamp-ai-test-'));
    prevDataDir = process.env.HEADLAMP_DATA_DIR;
    process.env.HEADLAMP_DATA_DIR = tmpDir;
  });

  afterEach(() => {
    if (prevDataDir === undefined) delete process.env.HEADLAMP_DATA_DIR;
    else process.env.HEADLAMP_DATA_DIR = prevDataDir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null when the config file does not exist', () => {
    expect(loadAppConfig()).toBeNull();
  });

  it('saves config atomically with owner-only permissions', () => {
    const config = { provider: 'openai', config: { apiKey: 'secret' } };
    const configPath = saveHeadlampAIConfig(config);

    expect(JSON.parse(fs.readFileSync(configPath, 'utf-8'))).toEqual(config);
    if (process.platform !== 'win32') {
      expect(fs.statSync(configPath).mode & 0o777).toBe(0o600);
      fs.chmodSync(configPath, 0o644);
      saveHeadlampAIConfig(config);
      expect(fs.statSync(configPath).mode & 0o777).toBe(0o600);
    }
    expect(fs.readdirSync(tmpDir).filter(name => name.endsWith('.tmp'))).toEqual([]);
  });

  it('uses the rollback-safe fallback when rename-over-existing is unavailable', () => {
    const temporaryPath = path.join(tmpDir, 'headlamp-ai.json.tmp');
    const configPath = path.join(tmpDir, 'headlamp-ai.json');
    const renameSync = vi
      .fn()
      .mockImplementationOnce(() => {
        const error = new Error('destination exists') as NodeJS.ErrnoException;
        error.code = 'EPERM';
        throw error;
      })
      .mockImplementation(() => {});
    const existsSync = vi.fn((candidate: fs.PathLike) => candidate === configPath);
    const rmSync = vi.fn();

    replaceFileSync(temporaryPath, configPath, { existsSync, renameSync, rmSync });

    expect(renameSync).toHaveBeenCalledTimes(3);
    expect(renameSync.mock.calls[1][0]).toBe(configPath);
    expect(renameSync.mock.calls[2]).toEqual([temporaryPath, configPath]);
    expect(rmSync).toHaveBeenCalledWith(expect.stringContaining('.bak'), { force: true });
  });
});

describe('loadAppMCPSettings', () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'headlamp-ai-test-'));
    prevDataDir = process.env.HEADLAMP_DATA_DIR;
    process.env.HEADLAMP_DATA_DIR = tmpDir;
  });

  afterEach(() => {
    if (prevDataDir === undefined) delete process.env.HEADLAMP_DATA_DIR;
    else process.env.HEADLAMP_DATA_DIR = prevDataDir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns undefined when the settings file does not exist', () => {
    expect(loadAppMCPSettings()).toBeUndefined();
  });
});

describe('loadConfigFile', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `headlamp-ai-test-${Date.now()}.json`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('reads and parses a JSON config file', () => {
    const cfg = { provider: 'openai', config: { apiKey: 'test-key' } };
    fs.writeFileSync(tmpFile, JSON.stringify(cfg));
    expect(loadConfigFile(tmpFile)).toEqual(cfg);
  });
});

describe('configFromEnv', () => {
  const saved: Record<string, string | undefined> = {};
  const ENV_KEYS = [
    'HEADLAMP_AI_PROVIDER',
    'HEADLAMP_AI_API_KEY',
    'HEADLAMP_AI_MODEL',
    'HEADLAMP_AI_BASE_URL',
    'HEADLAMP_AI_ENDPOINT',
    'HEADLAMP_AI_DEPLOYMENT_NAME',
  ];

  beforeEach(() => {
    ENV_KEYS.forEach(k => {
      saved[k] = process.env[k];
      delete process.env[k];
    });
  });

  afterEach(() => {
    ENV_KEYS.forEach(k => {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });

  it('returns null when HEADLAMP_AI_PROVIDER is not set', () => {
    expect(configFromEnv()).toBeNull();
  });

  it('returns a CLIConfig when HEADLAMP_AI_PROVIDER is set', () => {
    process.env.HEADLAMP_AI_PROVIDER = 'ollama';
    process.env.HEADLAMP_AI_MODEL = 'llama3';
    const cfg = configFromEnv();
    expect(cfg?.provider).toBe('ollama');
    expect(cfg?.config.model).toBe('llama3');
  });
});
