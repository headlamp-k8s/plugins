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
 * Auto-detection of AI providers (GitHub Copilot, Azure OpenAI, Ollama).
 *
 * All CLI-based detection uses an injectable {@link CommandRunner} function
 * so that platform-specific command execution (e.g. Headlamp's Electron
 * `pluginRunCommand`) can be wired in by the host application.
 */

import { StoredProviderConfig } from '../managers/ProviderConfigManager';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Result of running a CLI command. */
export interface CommandRunResult {
  /** Standard output captured from the command. */
  stdout: string;
  /** Process exit code returned by the command. */
  exitCode: number;
}

/**
 * Function that executes a CLI command and returns the result.
 * The host application provides an implementation that maps to the
 * platform's command execution API (e.g. Electron's `pluginRunCommand`).
 */
export type CommandRunner = (command: string, args: string[]) => Promise<CommandRunResult>;

/** A provider discovered by the auto-detection system. */
export interface DetectedProvider {
  /** Provider ID matching a {@link ModelProvider} entry (e.g. 'copilot', 'azure', 'local'). */
  providerId: string;
  /** Human-readable source label (e.g. 'GitHub CLI', 'Azure CLI', 'Ollama'). */
  source: string;
  /** Provider configuration to save (may contain sentinel values for CLI-refreshed tokens). */
  config: Record<string, any>;
  /** User-visible label for the detected provider. */
  displayName: string;
}

/** Model entry returned by the Copilot model catalog. */
export interface CopilotModelEntry {
  /** Unique model identifier from the Copilot catalog. */
  id: string;
  /** Human-readable model name. */
  name: string;
  /** Version string reported by the catalog. */
  version: string;
  /** Optional capability metadata for filtering model types. */
  capabilities?: {
    /** Model capability type, such as `chat`. */
    type?: string;
  };
}

// ---------------------------------------------------------------------------
// Sentinels — stored in config instead of real tokens so they can be
// refreshed from CLI at model-creation time.
// ---------------------------------------------------------------------------

/** Sentinel value stored in config.apiKey for GitHub Copilot CLI-based auth. */
export const GH_CLI_AUTH_SENTINEL = '__GH_CLI_AUTH__';

/** Sentinel value stored in config.apiKey for Azure CLI-based auth. */
export const AZ_CLI_AUTH_SENTINEL = '__AZ_CLI_AUTH__';

// ---------------------------------------------------------------------------
// CLI command execution
// ---------------------------------------------------------------------------

/** Commands allowed by the auto-detection system. */
const ALLOWED_COMMANDS = new Set(['gh', 'az']);

/** Maximum time (ms) to wait for a CLI command to complete. */
const COMMAND_TIMEOUT_MS = 15_000;

/**
 * Runs a CLI command through the injected {@link CommandRunner}, enforcing
 * an allowlist of permitted executables and a timeout.
 */
async function runDetectCommand(
  command: string,
  args: string[],
  commandRunner: CommandRunner
): Promise<CommandRunResult> {
  if (!ALLOWED_COMMANDS.has(command)) {
    console.warn(`[ai-assistant auto-detect] command "${command}" not in allowlist — skipping`);
    return { stdout: '', exitCode: -1 };
  }

  try {
    const result = await Promise.race([
      commandRunner(command, args),
      new Promise<CommandRunResult>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`Command "${command}" timed out`)), COMMAND_TIMEOUT_MS)
      ),
    ]);
    return result;
  } catch (e) {
    console.debug(`[ai-assistant auto-detect] command "${command}" failed:`, e);
    return { stdout: '', exitCode: -1 };
  }
}

// ---------------------------------------------------------------------------
// GitHub Copilot detection
// ---------------------------------------------------------------------------

/**
 * Detects a GitHub personal access token via the `gh` CLI.
 */
export async function detectGitHubToken(commandRunner: CommandRunner): Promise<string | null> {
  console.debug('[ai-assistant auto-detect] checking for GitHub CLI token (gh auth token)...');
  const { stdout, exitCode } = await runDetectCommand('gh', ['auth', 'token'], commandRunner);
  if (exitCode !== 0 || !stdout) {
    console.debug(`[ai-assistant auto-detect] gh auth token failed: exitCode=${exitCode}`);
    return null;
  }
  const token = stdout.trim();
  if (!token || token.length < 10) {
    console.debug('[ai-assistant auto-detect] gh auth token returned empty or too-short value');
    return null;
  }
  console.debug(`[ai-assistant auto-detect] gh auth token returned ${token.length}-char token`);
  return token;
}

/**
 * Validates a GitHub token against the GitHub API.
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const authHeader = 'Bearer ' + token;
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: authHeader },
    });
    const valid = response.ok;
    console.debug(
      `[ai-assistant auto-detect] GitHub token validation: ${valid ? 'valid' : 'invalid'} (status ${
        response.status
      })`
    );
    return valid;
  } catch (e) {
    console.debug('[ai-assistant auto-detect] GitHub token validation failed:', e);
    return false;
  }
}

/**
 * Fetches available chat models from the GitHub Copilot model catalog.
 */
export async function detectCopilotChatModels(token: string): Promise<CopilotModelEntry[]> {
  try {
    const response = await fetch('https://api.githubcopilot.com/models', {
      headers: {
        Authorization: 'Bearer ' + token,
        'Copilot-Integration-Id': 'vscode-chat',
      },
    });
    if (!response.ok) {
      console.debug(`[ai-assistant auto-detect] Copilot model catalog returned ${response.status}`);
      return [];
    }
    const data = await response.json();
    const models: CopilotModelEntry[] = data.data || data.models || [];
    const chatModels = models.filter(m => !m.capabilities?.type || m.capabilities.type === 'chat');
    console.debug(`[ai-assistant auto-detect] Copilot catalog: ${chatModels.length} chat model(s)`);
    return chatModels;
  } catch (e) {
    console.debug('[ai-assistant auto-detect] Copilot model catalog fetch failed:', e);
    return [];
  }
}

/**
 * Priority-ordered model families for selecting the best Copilot model.
 * Each entry is a substring match against the model ID (lowercased).
 */
const COPILOT_MODEL_PRIORITY: string[] = [
  'claude-opus',
  'gpt-5',
  'claude-sonnet',
  'gpt-4',
  'o4',
  'o3',
  'o1',
];

/**
 * Selects the best chat model from a Copilot model list based on priority.
 */
export function pickBestCopilotChatModel(models: CopilotModelEntry[]): string {
  for (const priority of COPILOT_MODEL_PRIORITY) {
    const match = models.find(m => m.id.toLowerCase().includes(priority));
    if (match) return match.id;
  }
  return models.length > 0 ? models[0].id : 'gpt-4o';
}

/**
 * Full Copilot detection flow: token → validation → model catalog → best model.
 */
export async function detectCopilotProvider(
  commandRunner: CommandRunner
): Promise<DetectedProvider | null> {
  const token = await detectGitHubToken(commandRunner);
  if (!token) return null;

  const valid = await validateGitHubToken(token);
  if (!valid) {
    console.debug('[ai-assistant auto-detect] GitHub token invalid — skipping Copilot');
    return null;
  }

  const models = await detectCopilotChatModels(token);
  const bestModel = pickBestCopilotChatModel(models);
  console.debug(`[ai-assistant auto-detect] Copilot detected, best model: ${bestModel}`);

  return {
    providerId: 'copilot',
    source: 'GitHub CLI',
    config: {
      apiKey: GH_CLI_AUTH_SENTINEL,
      model: bestModel,
    },
    displayName: `GitHub Copilot (${bestModel})`,
  };
}

/**
 * Fetches a fresh GitHub token from the `gh` CLI.
 * Call at model creation time when config.apiKey is {@link GH_CLI_AUTH_SENTINEL}.
 */
export async function refreshGitHubToken(commandRunner: CommandRunner): Promise<string | null> {
  return detectGitHubToken(commandRunner);
}

/**
 * Returns true when the `gh` CLI binary is present and executable,
 * regardless of authentication state. Returns false if the binary is
 * not installed (exit code 127, ENOENT, or "command not found" in stderr).
 */
export async function detectGhCliAvailable(commandRunner: CommandRunner): Promise<boolean> {
  try {
    const { stdout, exitCode } = await runDetectCommand('gh', ['auth', 'token'], commandRunner);
    if (exitCode === 127) return false;
    const combined = stdout.toLowerCase();
    if (
      combined.includes('command not found') ||
      combined.includes('no such file') ||
      combined.includes('is not recognized')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Ollama (local model) detection
// ---------------------------------------------------------------------------

interface OllamaModel {
  name: string;
}

/**
 * Detects whether Ollama is running locally and returns available models.
 */
export async function detectOllamaProvider(): Promise<DetectedProvider | null> {
  console.debug('[ai-assistant auto-detect] checking Ollama at localhost:11434...');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      signal: controller.signal,
    });

    if (!response.ok) {
      console.debug(`[ai-assistant auto-detect] Ollama returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const models: OllamaModel[] = data.models || [];
    if (models.length === 0) {
      console.debug('[ai-assistant auto-detect] Ollama running but no models found');
      return null;
    }

    const firstModel = models[0].name;
    console.debug(
      `[ai-assistant auto-detect] Ollama detected with ${models.length} model(s), using: ${firstModel}`
    );

    return {
      providerId: 'local',
      source: 'Ollama',
      config: {
        baseUrl: 'http://localhost:11434',
        model: firstModel,
      },
      displayName: `Ollama (${firstModel})`,
    };
  } catch (e) {
    console.debug('[ai-assistant auto-detect] Ollama not reachable:', e);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Azure OpenAI detection via `az` CLI
// ---------------------------------------------------------------------------

interface AzureOpenAIAccount {
  name: string;
  properties?: {
    endpoint?: string;
  };
  resourceGroup?: string;
}

interface AzureOpenAIDeployment {
  name: string;
  properties?: {
    model?: {
      name?: string;
    };
    capabilities?: Record<string, string>;
  };
}

/**
 * Returns true if the deployment supports chat completions.
 */
function isChatDeployment(deployment: AzureOpenAIDeployment): boolean {
  const caps = deployment.properties?.capabilities;
  if (caps) {
    if (caps['chatCompletion'] !== undefined) return caps['chatCompletion'] === 'true';
    if (caps['embeddings'] === 'true') return false;
  }
  const modelName = (deployment.properties?.model?.name ?? '').toLowerCase();
  return (
    !modelName.includes('embedding') &&
    !modelName.includes('whisper') &&
    !modelName.includes('tts') &&
    !modelName.includes('dall-e')
  );
}

async function checkAzureLogin(commandRunner: CommandRunner): Promise<string | null> {
  const { stdout, exitCode } = await runDetectCommand(
    'az',
    ['account', 'show', '-o', 'json'],
    commandRunner
  );
  if (exitCode !== 0 || !stdout) return null;
  try {
    const account = JSON.parse(stdout);
    return account.name || account.user?.name || 'Azure';
  } catch {
    return null;
  }
}

async function listAzureOpenAIAccounts(
  commandRunner: CommandRunner
): Promise<AzureOpenAIAccount[]> {
  const { stdout, exitCode } = await runDetectCommand(
    'az',
    [
      'cognitiveservices',
      'account',
      'list',
      '--query',
      "[?kind=='OpenAI' || kind=='AIServices']",
      '-o',
      'json',
    ],
    commandRunner
  );
  if (exitCode !== 0 || !stdout) return [];
  try {
    const accounts: AzureOpenAIAccount[] = JSON.parse(stdout);
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

async function listAzureOpenAIDeployments(
  resourceGroup: string,
  accountName: string,
  commandRunner: CommandRunner
): Promise<AzureOpenAIDeployment[]> {
  const { stdout, exitCode } = await runDetectCommand(
    'az',
    [
      'cognitiveservices',
      'account',
      'deployment',
      'list',
      '-g',
      resourceGroup,
      '-n',
      accountName,
      '-o',
      'json',
    ],
    commandRunner
  );
  if (exitCode !== 0 || !stdout) return [];
  try {
    const deployments: AzureOpenAIDeployment[] = JSON.parse(stdout);
    return Array.isArray(deployments) ? deployments : [];
  } catch {
    return [];
  }
}

async function getAzureOpenAIKey(
  resourceGroup: string,
  accountName: string,
  commandRunner: CommandRunner
): Promise<string | null> {
  const { stdout, exitCode } = await runDetectCommand(
    'az',
    [
      'cognitiveservices',
      'account',
      'keys',
      'list',
      '-g',
      resourceGroup,
      '-n',
      accountName,
      '-o',
      'json',
    ],
    commandRunner
  );
  if (exitCode !== 0 || !stdout) return null;
  try {
    const keys = JSON.parse(stdout);
    return keys.key1 || keys.key2 || null;
  } catch {
    return null;
  }
}

/**
 * Normalise an Azure OpenAI endpoint URL for comparison.
 */
function normaliseEndpoint(url: string): string {
  let s = url.trim().toLowerCase();
  while (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
}

/**
 * Collects all valid Azure OpenAI accounts with chat-capable deployments.
 */
export async function collectAzureOpenAIProviders(
  commandRunner: CommandRunner,
  skipAccountNames: ReadonlySet<string> = new Set(),
  skipEndpoints: ReadonlySet<string> = new Set()
): Promise<DetectedProvider[]> {
  const subscriptionName = await checkAzureLogin(commandRunner);
  if (!subscriptionName) return [];

  const accounts = await listAzureOpenAIAccounts(commandRunner);
  if (accounts.length === 0) return [];

  const results: DetectedProvider[] = [];

  for (const account of accounts) {
    if (skipAccountNames.has(account.name)) continue;

    const endpoint = account.properties?.endpoint;
    const resourceGroup = account.resourceGroup;

    if (endpoint && skipEndpoints.has(normaliseEndpoint(endpoint))) continue;
    if (!endpoint || !resourceGroup) continue;

    const deployments = await listAzureOpenAIDeployments(
      resourceGroup,
      account.name,
      commandRunner
    );
    const chatDeployments = deployments.filter(isChatDeployment);
    if (chatDeployments.length === 0) continue;

    const deployment = chatDeployments[0];
    const deploymentName = deployment.name;
    const modelName = deployment.properties?.model?.name || 'gpt-4';

    const apiKey = await getAzureOpenAIKey(resourceGroup, account.name, commandRunner);
    if (!apiKey) continue;

    results.push({
      providerId: 'azure',
      source: 'Azure CLI',
      config: {
        apiKey: AZ_CLI_AUTH_SENTINEL,
        azResourceGroup: resourceGroup,
        azAccountName: account.name,
        endpoint,
        deploymentName,
        model: modelName,
      },
      displayName: `Azure OpenAI (${account.name})`,
    });
  }

  return results;
}

/**
 * Fetches a fresh Azure OpenAI API key from the `az` CLI.
 * Call at model creation time when config.apiKey is {@link AZ_CLI_AUTH_SENTINEL}.
 */
export async function refreshAzureOpenAIKey(
  resourceGroup: string,
  accountName: string,
  commandRunner: CommandRunner
): Promise<string | null> {
  return getAzureOpenAIKey(resourceGroup, accountName, commandRunner);
}

/**
 * Returns a stable per-configuration dismissal key for persisting user
 * dismissals across sessions.
 */
export function dismissalKey(provider: DetectedProvider): string {
  if (provider.providerId === 'azure' && provider.config.azAccountName) {
    return `azure:${provider.config.azAccountName}`;
  }
  return provider.providerId;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all provider auto-detection checks.
 * Only returns providers that are not already configured and not dismissed.
 *
 * @param existingProviders - Provider configs already saved by the user.
 * @param dismissedKeys - Dismissal keys previously persisted by the user.
 * @param commandRunner - Platform-specific CLI command executor (null disables CLI-based detection).
 */
export async function detectProviders(
  existingProviders: StoredProviderConfig[],
  dismissedKeys: string[] = [],
  commandRunner: CommandRunner | null = null
): Promise<DetectedProvider[]> {
  console.debug(
    `[ai-assistant auto-detect] detectProviders called with ${existingProviders.length} existing provider(s)`
  );

  const detected: DetectedProvider[] = [];

  const hasProvider = (providerId: string) =>
    existingProviders.some(p => p.providerId === providerId);

  const skipCopilot = hasProvider('copilot') || dismissedKeys.includes('copilot');
  const skipLocal = hasProvider('local') || dismissedKeys.includes('local');

  const skipAllAzure = dismissedKeys.includes('azure');
  const dismissedAzureNames = new Set(
    dismissedKeys.filter(k => k.startsWith('azure:')).map(k => k.slice('azure:'.length))
  );
  const savedAzureAccountNames = new Set(
    existingProviders
      .filter(p => p.providerId === 'azure' && p.config?.azAccountName)
      .map(p => p.config.azAccountName as string)
  );
  const savedAzureEndpoints = new Set(
    existingProviders
      .filter(p => p.providerId === 'azure' && p.config?.endpoint)
      .map(p => normaliseEndpoint(p.config.endpoint as string))
  );
  const skipAzureAccountNames = new Set([...savedAzureAccountNames, ...dismissedAzureNames]);
  const skipAzureEndpoints = new Set([
    ...savedAzureEndpoints,
    ...dismissedKeys
      .filter(k => k.startsWith('azure-endpoint:'))
      .map(k => k.slice('azure-endpoint:'.length)),
  ]);

  const [copilot, azureAll, ollama] = await Promise.all([
    skipCopilot || !commandRunner ? Promise.resolve(null) : detectCopilotProvider(commandRunner),
    skipAllAzure || !commandRunner
      ? Promise.resolve([])
      : collectAzureOpenAIProviders(commandRunner, skipAzureAccountNames, skipAzureEndpoints),
    skipLocal ? Promise.resolve(null) : detectOllamaProvider(),
  ]);

  if (copilot) detected.push(copilot);
  for (const a of azureAll) {
    const accountName = a.config?.azAccountName as string | undefined;
    if (!accountName && hasProvider('azure')) continue;
    detected.push(a);
  }
  if (ollama) detected.push(ollama);

  console.debug(
    `[ai-assistant auto-detect] detection complete: ${detected.length} provider(s) found`
  );

  return detected;
}
