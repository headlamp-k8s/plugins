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

import type { MCPSettings } from '@headlamp-k8s/ai-common/mcp/types';
import type { ProviderSettings } from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** Config shape for headlamp-ai.json. Compatible with the ai-assistant plugin. */
export interface CLIConfig {
  provider: string;
  config: ProviderSettings;
  mcp?: MCPSettings;
  systemPrompt?: string;
}

/** Returns the Headlamp app data directory for the current platform. */
export function getHeadlampDataDir(): string {
  if (process.env.HEADLAMP_DATA_DIR) return process.env.HEADLAMP_DATA_DIR;
  switch (process.platform) {
    case 'win32':
      return path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'Headlamp'
      );
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Headlamp');
    default:
      return path.join(
        process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
        'Headlamp'
      );
  }
}

/** Loads headlamp-ai.json from the Headlamp data directory. Returns null if missing. */
export function loadAppConfig(): CLIConfig | null {
  const configPath = path.join(getHeadlampDataDir(), 'headlamp-ai.json');
  try {
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as CLIConfig;
  } catch {
    return null;
  }
}

/** Loads mcp-tools-settings.json from the Headlamp data directory. Returns undefined if missing. */
export function loadAppMCPSettings(): MCPSettings | undefined {
  const settingsPath = path.join(getHeadlampDataDir(), 'mcp-tools-settings.json');
  try {
    if (!fs.existsSync(settingsPath)) return undefined;
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    if (data?.servers) return data as MCPSettings;
    if (data?.mcp?.servers) return data.mcp as MCPSettings;
    return undefined;
  } catch {
    return undefined;
  }
}

/** Loads a CLIConfig from an explicit JSON file path. */
export function loadConfigFile(configPath: string): CLIConfig {
  return JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf-8')) as CLIConfig;
}

/**
 * Atomically replaces a file where supported, with a rollback-safe Windows fallback.
 *
 * @param temporaryPath - Fully written sibling file to install.
 * @param destinationPath - Existing or new destination path.
 * @param fileSystem - File operations, injectable for platform-specific tests.
 * @returns No value after replacement succeeds.
 */
export function replaceFileSync(
  temporaryPath: string,
  destinationPath: string,
  fileSystem: Pick<typeof fs, 'existsSync' | 'renameSync' | 'rmSync'> = fs
): void {
  try {
    fileSystem.renameSync(temporaryPath, destinationPath);
    return;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (!fileSystem.existsSync(destinationPath) || (code !== 'EEXIST' && code !== 'EPERM')) {
      throw error;
    }
  }

  // Windows does not consistently allow rename-over-existing. Move the old
  // file aside, install the new one, and restore the old file if that fails.
  const backupPath = `${destinationPath}.${process.pid}.${randomUUID()}.bak`;
  fileSystem.renameSync(destinationPath, backupPath);
  try {
    fileSystem.renameSync(temporaryPath, destinationPath);
    fileSystem.rmSync(backupPath, { force: true });
  } catch (error) {
    if (fileSystem.existsSync(backupPath)) fileSystem.renameSync(backupPath, destinationPath);
    throw error;
  }
}

/**
 * Saves a CLIConfig to headlamp-ai.json in the Headlamp data directory.
 *
 * POSIX systems enforce owner-only file permissions. On Windows, Node's
 * standard file API cannot set ACLs, so confidentiality relies on the ACL of
 * the current user's AppData directory (or the caller-provided data directory).
 */
export function saveHeadlampAIConfig(config: CLIConfig): string {
  const dataDirectory = getHeadlampDataDir();
  const configPath = path.join(dataDirectory, 'headlamp-ai.json');
  fs.mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  const temporaryPath = `${configPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(config, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
      flag: 'wx',
    });
    replaceFileSync(temporaryPath, configPath);
    if (process.platform !== 'win32') fs.chmodSync(configPath, 0o600);
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    throw error;
  }
  return configPath;
}

/** Builds a CLIConfig from HEADLAMP_AI_* environment variables. Returns null if not set. */
export function configFromEnv(): CLIConfig | null {
  const provider = process.env.HEADLAMP_AI_PROVIDER;
  if (!provider) return null;
  return {
    provider,
    config: {
      apiKey: process.env.HEADLAMP_AI_API_KEY || '',
      model: process.env.HEADLAMP_AI_MODEL || '',
      baseUrl: process.env.HEADLAMP_AI_BASE_URL || '',
      endpoint: process.env.HEADLAMP_AI_ENDPOINT || '',
      deploymentName: process.env.HEADLAMP_AI_DEPLOYMENT_NAME || '',
    },
  };
}
