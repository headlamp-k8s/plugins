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
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** Config shape for headlamp-ai.json. Compatible with the ai-assistant plugin. */
export interface CLIConfig {
  provider: string;
  config: Record<string, any>;
  mcp?: MCPSettings;
  systemPrompt?: string;
}

/** Returns the Headlamp app data directory for the current platform. */
export function getHeadlampDataDir(): string {
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

/** Saves a CLIConfig to headlamp-ai.json in the Headlamp data directory. */
export function saveHeadlampAIConfig(config: CLIConfig): string {
  const configPath = path.join(getHeadlampDataDir(), 'headlamp-ai.json');
  fs.mkdirSync(getHeadlampDataDir(), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
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
