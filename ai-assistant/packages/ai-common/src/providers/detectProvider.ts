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

import type { ProviderSettings, StoredProviderConfig } from './savedConfigs';

/**
 * Auto-detection of AI providers (GitHub Copilot, Azure OpenAI, Ollama).
 *
 * All CLI-based detection uses an injectable {@link CommandRunner} function
 * so that platform-specific command execution (e.g. Headlamp's Electron
 * `pluginRunCommand`) can be wired in by the host application.
 */

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
 *
 * @param command - Executable name.
 * @param args - Command arguments.
 * @param signal - Optional cancellation signal for terminating supported command runners.
 * @returns Captured standard output and process exit code.
 */
export type CommandRunner = (
  command: string,
  args: string[],
  signal?: AbortSignal
) => Promise<CommandRunResult>;

/** A provider discovered by the auto-detection system. */
export interface DetectedProvider {
  /** Provider ID matching a {@link ModelProvider} entry (e.g. 'copilot', 'azure', 'local'). */
  providerId: string;
  /** Human-readable source label (e.g. 'GitHub CLI', 'Azure CLI', 'Ollama'). */
  source: string;
  /** Provider configuration to save (may contain sentinel values for CLI-refreshed tokens). */
  config: ProviderSettings;
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
 * an allowlist of permitted executables and a 15-second timeout.
 *
 * @param command - Executable name, which must be `gh` or `az`.
 * @param args - Command arguments passed to the runner.
 * @param commandRunner - Host-provided command executor.
 * @param signal - Optional parent signal propagated to the command runner.
 * @returns Runner result, or an empty result with exit code `-1` when rejected or failed.
 */
async function runDetectCommand(
  command: string,
  args: string[],
  commandRunner: CommandRunner,
  signal?: AbortSignal
): Promise<CommandRunResult> {
  if (!ALLOWED_COMMANDS.has(command)) {
    console.warn(`[ai-assistant auto-detect] command "${command}" not in allowlist — skipping`);
    return { stdout: '', exitCode: -1 };
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) {
    abort();
  } else {
    signal?.addEventListener('abort', abort, { once: true });
  }
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      commandRunner(command, args, controller.signal),
      new Promise<CommandRunResult>(
        (_resolve, reject) =>
          (timeoutId = setTimeout(() => {
            controller.abort();
            reject(new Error(`Command "${command}" timed out`));
          }, COMMAND_TIMEOUT_MS))
      ),
    ]);
    return result;
  } catch (e) {
    console.debug(`[ai-assistant auto-detect] command "${command}" failed:`, e);
    return { stdout: '', exitCode: -1 };
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abort);
  }
}

// ---------------------------------------------------------------------------
// GitHub Copilot detection
// ---------------------------------------------------------------------------

/**
 * Detects a GitHub personal access token via `gh auth token`.
 *
 * @param commandRunner - Host-provided command executor.
 * @returns Trimmed token of at least ten characters, or `null` when unavailable.
 */
export async function detectGitHubToken(
  commandRunner: CommandRunner,
  signal?: AbortSignal
): Promise<string | null> {
  console.debug('[ai-assistant auto-detect] checking for GitHub CLI token (gh auth token)...');
  const { stdout, exitCode } = await runDetectCommand(
    'gh',
    ['auth', 'token'],
    commandRunner,
    signal
  );
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
 *
 * @param token - Token sent as a bearer credential to the GitHub user endpoint.
 * @returns Whether the endpoint returned a successful response; network failures return `false`.
 */
export async function validateGitHubToken(token: string, signal?: AbortSignal): Promise<boolean> {
  try {
    const authHeader = 'Bearer ' + token;
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: authHeader },
      signal,
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
 *
 * Entries without a capability type and entries typed as `chat` are retained.
 *
 * @param token - GitHub token used as a bearer credential.
 * @returns Chat-capable catalog entries, or an empty array on response or network failure.
 */
export async function detectCopilotChatModels(
  token: string,
  signal?: AbortSignal
): Promise<CopilotModelEntry[]> {
  try {
    const response = await fetch('https://api.githubcopilot.com/models', {
      headers: {
        Authorization: 'Bearer ' + token,
        'Copilot-Integration-Id': 'vscode-chat',
      },
      signal,
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
 *
 * IDs are matched case-insensitively by priority substring.
 *
 * @param models - Available Copilot chat models in catalog order.
 * @returns Highest-priority ID, first catalog ID, or `gpt-4o` when empty.
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
 *
 * Catalog failure falls back to `gpt-4o`; unavailable or invalid credentials
 * prevent detection. The stored API key is the CLI-refresh sentinel.
 *
 * @param commandRunner - Host-provided command executor.
 * @returns Detected Copilot provider, or `null` when credentials cannot be validated.
 */
export async function detectCopilotProvider(
  commandRunner: CommandRunner,
  signal?: AbortSignal
): Promise<DetectedProvider | null> {
  const token = await detectGitHubToken(commandRunner, signal);
  if (!token) return null;

  const valid = await validateGitHubToken(token, signal);
  if (!valid) {
    console.debug('[ai-assistant auto-detect] GitHub token invalid — skipping Copilot');
    return null;
  }

  const models = await detectCopilotChatModels(token, signal);
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
 *
 * @param commandRunner - Host-provided command executor.
 * @returns Fresh token, or `null` when unavailable or too short.
 */
export async function refreshGitHubToken(
  commandRunner: CommandRunner,
  signal?: AbortSignal
): Promise<string | null> {
  return detectGitHubToken(commandRunner, signal);
}

/**
 * Infers whether the `gh` CLI is available from `gh auth token`.
 * Authentication failure is allowed; only exit code 127 or known missing-file
 * text in captured standard output produces `false`. Any other wrapped command
 * result, including the command wrapper's fallback, produces `true`.
 *
 * @param commandRunner - Host-provided command executor.
 * @returns Whether the result avoids known missing-executable signals.
 */
export async function detectGhCliAvailable(
  commandRunner: CommandRunner,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    const { stdout, exitCode } = await runDetectCommand(
      'gh',
      ['auth', 'token'],
      commandRunner,
      signal
    );
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

/** Model metadata returned by Ollama's tags endpoint. */
interface OllamaModel {
  /** Local model name or identifier. */
  name: string;
}

/**
 * Detects a local Ollama server through its tags endpoint.
 *
 * The request targets `http://localhost:11434/api/tags`, times out after two
 * seconds, and selects the first returned model.
 *
 * @returns Local provider for the first model, or `null` when unavailable or empty.
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
// Azure OpenAI detection via Azure Management APIs
// ---------------------------------------------------------------------------

/** Azure OpenAI account returned by Azure Management APIs. */
interface AzureOpenAIAccount {
  /** Azure resource ID. */
  id?: string;
  /** Azure resource name. */
  name: string;
  /** Optional account properties. */
  properties?: {
    /** Azure OpenAI service endpoint. */
    endpoint?: string;
  };
  /** Resource group containing the account. */
  resourceGroup?: string;
  /** Subscription containing the account. */
  subscriptionId?: string;
}

/** Azure account with the fields required for deployment discovery. */
type DiscoverableAzureOpenAIAccount = AzureOpenAIAccount & {
  id: string;
  properties: { endpoint: string };
  resourceGroup: string;
};

/** Azure subscription returned by Azure Resource Manager. */
interface AzureSubscription {
  /** Subscription resource path. */
  id?: string;
  /** Subscription GUID used by Azure Resource Graph. */
  subscriptionId?: string;
  /** Subscription lifecycle state. */
  state?: string;
}

/** Maximum number of concurrent Azure deployment-list commands. */
const AZURE_DEPLOYMENT_CONCURRENCY = 8;

/** Maximum time (ms) to wait for an Azure Management API request. */
const AZURE_API_TIMEOUT_MS = 15_000;

/** Account row projected by the Azure Resource Graph query. */
interface AzureResourceGraphAccount {
  /** Azure resource ID. */
  id?: string;
  /** Azure resource name. */
  name: string;
  /** Resource group containing the account. */
  resourceGroup?: string;
  /** Subscription containing the account. */
  subscriptionId?: string;
  /** Azure AI service endpoint. */
  endpoint?: string;
}

/** Azure Resource Graph REST response envelope. */
interface AzureResourceGraphResponse {
  /** Accounts in the current page. */
  data?: AzureResourceGraphAccount[];
  /** Opaque token used to request the next page. */
  $skipToken?: string;
}

/** Azure Resource Manager list response envelope. */
interface AzureManagementListResponse<T> {
  /** Resources in the current page. */
  value?: T[];
  /** Absolute URL for the next page. */
  nextLink?: string;
}

/** Azure OpenAI deployment returned by Azure Management APIs. */
interface AzureOpenAIDeployment {
  /** Deployment name used by Azure OpenAI requests. */
  name: string;
  /** Optional deployment properties. */
  properties?: {
    /** Optional deployed-model metadata. */
    model?: {
      /** Underlying model name. */
      name?: string;
    };
    /** Capability flags represented as Azure response strings. */
    capabilities?: Record<string, string>;
  };
}

/**
 * Fetches an Azure Management API resource with timeout and parent cancellation.
 *
 * @param input - Azure API URL or request.
 * @param init - Fetch options.
 * @param signal - Optional parent cancellation signal.
 * @returns Azure API response.
 */
async function fetchAzureApi(
  input: RequestInfo | URL,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) {
    abort();
  } else {
    signal?.addEventListener('abort', abort, { once: true });
  }
  const timeoutId = setTimeout(abort, AZURE_API_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abort);
  }
}

/**
 * Determines whether an Azure deployment supports chat completions.
 *
 * An explicit `chatCompletion` flag takes precedence, followed by an explicit
 * embeddings flag and model-name exclusions for embedding, audio, and image models.
 * Deployments without those signals default to chat-capable.
 *
 * @param deployment - Azure deployment metadata to classify.
 * @returns Whether the deployment is considered chat-capable.
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

/**
 * Obtains an Azure Resource Manager token from the authenticated Azure CLI session.
 *
 * @param commandRunner - Host-provided command executor.
 * @returns ARM bearer token, or `null` when authentication is unavailable.
 */
async function getAzureManagementToken(
  commandRunner: CommandRunner,
  signal?: AbortSignal
): Promise<string | null> {
  const { stdout, exitCode } = await runDetectCommand(
    'az',
    [
      'account',
      'get-access-token',
      '--resource',
      'https://management.azure.com/',
      '--query',
      'accessToken',
      '-o',
      'tsv',
    ],
    commandRunner,
    signal
  );
  if (exitCode !== 0) return null;
  const token = stdout.trim();
  return token || null;
}

/**
 * Reports why an Azure call failed, so detection returning nothing can be diagnosed.
 *
 * @param operation - Human-readable name of the failed call.
 * @param cause - Status text or thrown error.
 */
function logAzureApiFailure(operation: string, cause: unknown): void {
  console.warn(`[ai-assistant auto-detect] Azure ${operation} failed:`, cause);
}

/**
 * Lists subscriptions available to the authenticated Azure identity.
 *
 * @param token - ARM bearer token.
 * @returns Accessible subscriptions, or `null` when the API is unavailable.
 */
async function listAzureSubscriptionsWithApi(
  token: string,
  signal?: AbortSignal
): Promise<AzureSubscription[] | null> {
  const subscriptions: AzureSubscription[] = [];
  let url: string | undefined = 'https://management.azure.com/subscriptions?api-version=2022-12-01';
  try {
    while (url) {
      const response = await fetchAzureApi(
        url,
        { headers: { Authorization: `Bearer ${token}` } },
        signal
      );
      if (!response.ok) {
        logAzureApiFailure('subscription listing', `${response.status} ${response.statusText}`);
        return null;
      }
      const page: AzureManagementListResponse<AzureSubscription> = await response.json();
      if (!Array.isArray(page.value)) return null;
      subscriptions.push(...page.value);
      url = page.nextLink;
    }
    return subscriptions;
  } catch (e) {
    logAzureApiFailure('subscription listing', e);
    return null;
  }
}

/**
 * Discovers Azure OpenAI and Foundry accounts through the Resource Graph REST API.
 *
 * @param token - ARM bearer token.
 * @param subscriptions - Subscription IDs included in the query.
 * @returns Accounts from Resource Graph, or `null` when the API is unavailable.
 */
async function listAzureOpenAIAccountsWithResourceGraphApi(
  token: string,
  subscriptions: string[],
  signal?: AbortSignal
): Promise<AzureOpenAIAccount[] | null> {
  const query = [
    'Resources',
    "| where type =~ 'microsoft.cognitiveservices/accounts'",
    "| where kind in~ ('OpenAI', 'AIServices')",
    // Accounts with local auth disabled reject the api-key this plugin sends.
    "| where tostring(properties.disableLocalAuth) != 'true'",
    '| project id, name, resourceGroup, subscriptionId, endpoint=tostring(properties.endpoint)',
    '| order by name asc',
  ].join(' ');
  const accounts: AzureOpenAIAccount[] = [];
  let skipToken: string | undefined;
  do {
    try {
      const response = await fetchAzureApi(
        'https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2022-10-01',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptions,
            query,
            options: {
              resultFormat: 'objectArray',
              $top: 1000,
              ...(skipToken ? { $skipToken: skipToken } : {}),
            },
          }),
        },
        signal
      );
      if (!response.ok) {
        logAzureApiFailure('account discovery', `${response.status} ${response.statusText}`);
        return null;
      }
      const page: AzureResourceGraphResponse = await response.json();
      if (!Array.isArray(page.data)) return null;
      accounts.push(
        ...page.data.map(account => ({
          id: account.id,
          name: account.name,
          resourceGroup: account.resourceGroup,
          subscriptionId: account.subscriptionId,
          properties: { endpoint: account.endpoint },
        }))
      );
      skipToken = page.$skipToken;
    } catch (e) {
      logAzureApiFailure('account discovery', e);
      return null;
    }
  } while (skipToken);
  return accounts;
}

/**
 * Lists deployments for one Azure account through the ARM REST API.
 *
 * @param account - Azure account with a resource ID.
 * @param token - ARM bearer token.
 * @param signal - Optional cancellation signal.
 * @returns Parsed deployments, or `null` when the API is unavailable.
 */
async function listAzureOpenAIDeploymentsWithApi(
  account: DiscoverableAzureOpenAIAccount,
  token: string,
  signal?: AbortSignal
): Promise<AzureOpenAIDeployment[] | null> {
  if (!account.id) return null;
  const accountIdentity = azureAccountIdentity(account) ?? account.name ?? account.id;
  const deployments: AzureOpenAIDeployment[] = [];
  let url:
    | string
    | undefined = `https://management.azure.com${account.id}/deployments?api-version=2023-05-01`;
  try {
    while (url) {
      const response = await fetchAzureApi(
        url,
        { headers: { Authorization: `Bearer ${token}` } },
        signal
      );
      if (!response.ok) {
        logAzureApiFailure(
          `deployment listing for ${accountIdentity}`,
          `${response.status} ${response.statusText}`
        );
        return null;
      }
      const page: AzureManagementListResponse<AzureOpenAIDeployment> = await response.json();
      if (!Array.isArray(page.value)) return null;
      deployments.push(...page.value);
      url = page.nextLink;
    }
    return deployments;
  } catch (e) {
    logAzureApiFailure(`deployment listing for ${accountIdentity}`, e);
    return null;
  }
}

/**
 * Normalise an Azure OpenAI endpoint URL for comparison.
 *
 * @param url - Endpoint URL to normalize.
 * @returns Trimmed lowercase URL without trailing slashes.
 */
function normaliseEndpoint(url: string): string {
  let s = url.trim().toLowerCase();
  while (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
}

/** Returns the stable scoped identity of an Azure account when metadata is complete. */
function azureAccountIdentity(account: {
  name?: string;
  resourceGroup?: string;
  subscriptionId?: string;
}): string | null {
  if (!account.name || !account.resourceGroup || !account.subscriptionId) return null;
  return [account.subscriptionId, account.resourceGroup, account.name]
    .map(value => value.toLowerCase())
    .join('/');
}

/**
 * Checks whether an Azure account has usable identity and endpoint metadata.
 *
 * @param account - Account to validate.
 * @param skipAccountNames - Exact account names to omit.
 * @param skipEndpoints - Normalized endpoint URLs to omit.
 * @param skipAccountIdentities - Subscription-scoped account identities to omit.
 * @returns Whether the account can be checked for chat deployments.
 */
function isDiscoverableAzureAccount(
  account: AzureOpenAIAccount,
  skipAccountNames: ReadonlySet<string>,
  skipEndpoints: ReadonlySet<string>,
  skipAccountIdentities: ReadonlySet<string>
): account is DiscoverableAzureOpenAIAccount {
  if (skipAccountNames.has(account.name)) return false;
  const identity = azureAccountIdentity(account);
  if (identity && skipAccountIdentities.has(identity)) return false;
  const endpoint = account.properties?.endpoint;
  if (!account.id || !endpoint || !account.resourceGroup || !account.subscriptionId) return false;
  return !skipEndpoints.has(normaliseEndpoint(endpoint));
}

/**
 * Detects the first chat deployment for one Azure account.
 *
 * @param account - Account with endpoint and resource-group metadata.
 * @param commandRunner - Host-provided command executor.
 * @param managementToken - Optional ARM token used for direct deployment API calls.
 * @param signal - Optional cancellation signal for deployment discovery.
 * @returns A detected provider, or `null` when the account has no chat deployment.
 */
async function detectAzureAccountProvider(
  account: DiscoverableAzureOpenAIAccount,
  managementToken: string,
  signal?: AbortSignal
): Promise<DetectedProvider | null> {
  const deployments = await listAzureOpenAIDeploymentsWithApi(account, managementToken, signal);
  if (!deployments) return null;
  const deployment = deployments.find(isChatDeployment);
  if (!deployment) return null;

  return {
    providerId: 'azure',
    source: `Azure CLI · ${account.subscriptionId}`,
    config: {
      apiKey: AZ_CLI_AUTH_SENTINEL,
      azResourceGroup: account.resourceGroup,
      azAccountName: account.name,
      azSubscriptionId: account.subscriptionId,
      endpoint: account.properties.endpoint,
      deploymentName: deployment.name,
      model: deployment.properties?.model?.name || 'gpt-4',
    },
    displayName: `Azure OpenAI (${account.name} · ${account.subscriptionId})`,
  };
}

/**
 * Collects all valid Azure OpenAI accounts with chat-capable deployments.
 *
 * Accounts are processed in CLI order. Each result uses the first chat-capable
 * deployment and stores an Azure CLI key-refresh sentinel.
 *
 * @param commandRunner - Host-provided command executor.
 * @param skipAccountNames - Exact Azure account names to omit.
 * @param skipEndpoints - Normalized endpoint URLs to omit.
 * @param skipAccountIdentities - Subscription-scoped account identities to omit.
 * @param maxResults - Maximum providers to return before ending deployment discovery.
 * @returns Detected Azure providers with endpoints, deployments, and account metadata.
 */
async function collectAzureOpenAIProvidersWithLimit(
  commandRunner: CommandRunner,
  skipAccountNames: ReadonlySet<string>,
  skipEndpoints: ReadonlySet<string>,
  skipAccountIdentities: ReadonlySet<string>,
  maxResults = Number.POSITIVE_INFINITY,
  signal?: AbortSignal
): Promise<DetectedProvider[]> {
  const managementToken = await getAzureManagementToken(commandRunner, signal);
  if (!managementToken) return [];
  const subscriptions = await listAzureSubscriptionsWithApi(managementToken, signal);
  if (!subscriptions) return [];
  const subscriptionIds = subscriptions.flatMap(subscription =>
    subscription.subscriptionId && subscription.state === 'Enabled'
      ? [subscription.subscriptionId]
      : []
  );
  if (subscriptionIds.length === 0) return [];
  const accounts = await listAzureOpenAIAccountsWithResourceGraphApi(
    managementToken,
    subscriptionIds,
    signal
  );
  if (!accounts) return [];
  if (accounts.length === 0) return [];

  const results: DetectedProvider[] = [];

  const eligibleAccounts = accounts.filter(account =>
    isDiscoverableAzureAccount(account, skipAccountNames, skipEndpoints, skipAccountIdentities)
  );

  for (let offset = 0; offset < eligibleAccounts.length; offset += AZURE_DEPLOYMENT_CONCURRENCY) {
    const batch = eligibleAccounts.slice(offset, offset + AZURE_DEPLOYMENT_CONCURRENCY);
    if (maxResults === 1) {
      const controllers = batch.map(() => new AbortController());
      const abortBatch = () => controllers.forEach(controller => controller.abort());
      if (signal?.aborted) abortBatch();
      else signal?.addEventListener('abort', abortBatch, { once: true });
      const provider = await new Promise<DetectedProvider | null>(resolve => {
        let remaining = batch.length;
        let settled = false;
        batch.forEach((account, index) => {
          void detectAzureAccountProvider(account, managementToken, controllers[index].signal)
            .then(result => {
              if (result && !settled) {
                settled = true;
                controllers.forEach(controller => controller.abort());
                resolve(result);
              }
            })
            .catch(() => undefined)
            .finally(() => {
              remaining -= 1;
              if (remaining === 0 && !settled) resolve(null);
            });
        });
      });
      signal?.removeEventListener('abort', abortBatch);
      if (provider) return [provider];
      continue;
    }
    const detectedBatch = await Promise.all(
      batch.map(account => detectAzureAccountProvider(account, managementToken, signal))
    );
    results.push(...detectedBatch.filter(result => result !== null));
    if (results.length >= maxResults) return results.slice(0, maxResults);
  }

  return results;
}

/**
 * Collects Azure OpenAI and Foundry providers across accessible subscriptions.
 *
 * @param commandRunner - Host-provided command executor.
 * @param skipAccountNames - Exact Azure account names to omit.
 * @param skipEndpoints - Normalized endpoint URLs to omit.
 * @param skipAccountIdentities - Subscription-scoped account identities to omit.
 * @returns Detected providers with their first chat-capable deployment.
 */
export async function collectAzureOpenAIProviders(
  commandRunner: CommandRunner,
  skipAccountNames: ReadonlySet<string> = new Set(),
  skipEndpoints: ReadonlySet<string> = new Set(),
  skipAccountIdentities: ReadonlySet<string> = new Set(),
  signal?: AbortSignal
): Promise<DetectedProvider[]> {
  return collectAzureOpenAIProvidersWithLimit(
    commandRunner,
    skipAccountNames,
    skipEndpoints,
    skipAccountIdentities,
    Number.POSITIVE_INFINITY,
    signal
  );
}

/**
 * Detects the first usable Azure OpenAI or Foundry provider.
 *
 * @param commandRunner - Host-provided command executor.
 * @param skipAccountNames - Exact Azure account names to omit.
 * @param skipEndpoints - Normalized endpoint URLs to omit.
 * @param skipAccountIdentities - Subscription-scoped account identities to omit.
 * @returns First detected provider, or `null` when none is usable.
 */
export async function detectAzureOpenAIProvider(
  commandRunner: CommandRunner,
  skipAccountNames: ReadonlySet<string> = new Set(),
  skipEndpoints: ReadonlySet<string> = new Set(),
  skipAccountIdentities: ReadonlySet<string> = new Set(),
  signal?: AbortSignal
): Promise<DetectedProvider | null> {
  return (
    (
      await collectAzureOpenAIProvidersWithLimit(
        commandRunner,
        skipAccountNames,
        skipEndpoints,
        skipAccountIdentities,
        1,
        signal
      )
    )[0] ?? null
  );
}

/** Outcome of a `listKeys` call, including why it failed. */
interface AzureKeyResult {
  /** Account key when the call succeeded. */
  key: string | null;
  /** HTTP status of the call, or `null` when the request could not be made. */
  status: number | null;
  /** Error detail reported by Azure Resource Manager. */
  message?: string;
}

/** Data-plane API version used to probe an endpoint before saving it. */
const AZURE_DATA_PLANE_API_VERSION = '2024-10-21';

/**
 * Reads the human-readable error message from a failed Azure response.
 *
 * @param response - Failed Azure REST response.
 * @returns Azure's explanation, or an empty string when none is present.
 */
async function readAzureErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const message = body?.error?.message ?? body?.message;
    return typeof message === 'string' ? message.trim() : '';
  } catch {
    return '';
  }
}

/**
 * Requests an account key from the Azure Management API, preserving the failure reason.
 *
 * @param resourceGroup - Resource group containing the account.
 * @param accountName - Azure account resource name.
 * @param subscriptionId - Subscription used to scope the key lookup.
 * @param commandRunner - Host-provided command executor.
 * @param signal - Optional cancellation signal.
 * @returns The key when available, plus the status and message needed to explain a failure.
 */
async function requestAzureOpenAIKey(
  resourceGroup: string,
  accountName: string,
  subscriptionId: string,
  commandRunner: CommandRunner,
  signal?: AbortSignal
): Promise<AzureKeyResult> {
  const managementToken = await getAzureManagementToken(commandRunner, signal);
  if (!managementToken) return { key: null, status: null };
  const accountId = `/subscriptions/${encodeURIComponent(
    subscriptionId
  )}/resourceGroups/${encodeURIComponent(
    resourceGroup
  )}/providers/Microsoft.CognitiveServices/accounts/${encodeURIComponent(accountName)}`;
  try {
    const response = await fetchAzureApi(
      `https://management.azure.com${accountId}/listKeys?api-version=2023-05-01`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${managementToken}` },
      },
      signal
    );
    if (!response.ok) {
      return { key: null, status: response.status, message: await readAzureErrorMessage(response) };
    }
    const keys = await response.json();
    return { key: keys.key1 || keys.key2 || null, status: response.status };
  } catch {
    return { key: null, status: null };
  }
}

/** Result of resolving an Azure OpenAI key for a saved provider. */
export interface AzureKeyResolution {
  /** Resolved account key, or `null` when it could not be read. */
  key: string | null;
  /** Explanation of the failure, present only when `key` is `null`. */
  reason?: string;
}

/**
 * Fetches a fresh Azure OpenAI API key from the Azure Management API.
 * Call at model creation time when config.apiKey is {@link AZ_CLI_AUTH_SENTINEL}.
 *
 * @param resourceGroup - Resource group containing the account.
 * @param accountName - Azure account resource name.
 * @param commandRunner - Host-provided command executor.
 * @param subscriptionId - Subscription used to scope the key lookup.
 * @param signal - Optional cancellation signal.
 * @returns The account key, or the reason it could not be read.
 */
export async function refreshAzureOpenAIKey(
  resourceGroup: string,
  accountName: string,
  commandRunner: CommandRunner,
  subscriptionId?: string,
  signal?: AbortSignal
): Promise<AzureKeyResolution> {
  if (!subscriptionId) {
    return {
      key: null,
      reason:
        `The saved provider for "${accountName}" has no subscription ID. ` +
        'Run Auto Detect and save it again.',
    };
  }
  const result = await requestAzureOpenAIKey(
    resourceGroup,
    accountName,
    subscriptionId,
    commandRunner,
    signal
  );
  if (result.key) return { key: result.key };
  return { key: null, reason: describeAzureKeyFailure(accountName, result) };
}

/** Azure account fields required to check whether a provider is usable. */
export interface AzureAccessCheckConfig {
  /** Resource group containing the account. */
  azResourceGroup?: string;
  /** Azure account resource name. */
  azAccountName?: string;
  /** Subscription containing the account. */
  azSubscriptionId?: string;
  /** Data-plane endpoint of the account. */
  endpoint?: string;
}

/** Result of checking whether a detected Azure provider can actually be used. */
export interface AzureAccessCheckResult {
  /** Whether the account is usable, or the check was inconclusive. */
  ok: boolean;
  /** Explanation of why the account is unusable. */
  reason?: string;
}

/**
 * Explains why an Azure `listKeys` call failed.
 *
 * @param accountName - Account the key was requested for.
 * @param result - Failed key request.
 * @returns User-facing explanation.
 */
function describeAzureKeyFailure(accountName: string, result: AzureKeyResult): string {
  if (result.status === 401 || result.status === 403) {
    return (
      `You can see "${accountName}" but are not allowed to read its keys. ` +
      'Listing deployments only needs Reader, while using the model needs ' +
      'Cognitive Services Contributor or higher.'
    );
  }
  if (result.status === 404) {
    return `The Azure OpenAI account "${accountName}" no longer exists.`;
  }
  if (result.status === null) {
    return (
      `Could not reach Azure to read the keys of "${accountName}". ` +
      'Ensure the `az` CLI is installed and logged in (run `az login`).'
    );
  }
  const detail = result.message ? ` ${result.message}` : '';
  return `Azure returned ${result.status} when reading the keys of "${accountName}".${detail}`;
}

/**
 * Sends a minimal data-plane request so firewall and key restrictions surface
 * before the account is saved rather than on the first chat message.
 *
 * @param endpoint - Account data-plane endpoint.
 * @param key - Account key to authenticate with.
 * @param accountName - Account name used in the failure message.
 * @param signal - Optional cancellation signal.
 * @returns Failure only for an explicit rejection; ambiguous outcomes pass.
 */
async function probeAzureOpenAIEndpoint(
  endpoint: string,
  key: string,
  accountName: string,
  signal?: AbortSignal
): Promise<AzureAccessCheckResult> {
  let response: Response;
  try {
    response = await fetchAzureApi(
      `${normaliseEndpoint(endpoint)}/openai/models?api-version=${AZURE_DATA_PLANE_API_VERSION}`,
      { headers: { 'api-key': key } },
      signal
    );
  } catch {
    // Transport failures are ambiguous here, so they must not block the save.
    return { ok: true };
  }
  if (response.status !== 401 && response.status !== 403) return { ok: true };
  const detail = await readAzureErrorMessage(response);
  return {
    ok: false,
    reason:
      `"${accountName}" rejected a test request (${response.status}).` +
      (detail ? ` ${detail}` : ''),
  };
}

/**
 * Verifies that an Azure provider can be used, not merely listed.
 *
 * Detection only reads Resource Manager metadata, which Reader grants, so an
 * account can be discoverable while its keys, roles, or network rules block use.
 *
 * @param config - Azure account fields from the provider config.
 * @param commandRunner - Host-provided command executor, or `null` outside the desktop app.
 * @param signal - Optional cancellation signal.
 * @returns Whether the account is usable, with a reason when it is not.
 */
export async function verifyAzureOpenAIAccess(
  config: AzureAccessCheckConfig,
  commandRunner: CommandRunner | null,
  signal?: AbortSignal
): Promise<AzureAccessCheckResult> {
  if (!commandRunner) return { ok: true };
  const { azResourceGroup, azAccountName, azSubscriptionId, endpoint } = config;
  if (!azResourceGroup || !azAccountName || !azSubscriptionId) {
    return {
      ok: false,
      reason: 'This provider is missing the Azure account details needed to fetch its key.',
    };
  }
  const keyResult = await requestAzureOpenAIKey(
    azResourceGroup,
    azAccountName,
    azSubscriptionId,
    commandRunner,
    signal
  );
  if (!keyResult.key) {
    return { ok: false, reason: describeAzureKeyFailure(azAccountName, keyResult) };
  }
  if (!endpoint) return { ok: true };
  return probeAzureOpenAIEndpoint(endpoint, keyResult.key, azAccountName, signal);
}

/**
 * Returns a stable per-configuration dismissal key for persisting user
 * dismissals across sessions.
 *
 * @param provider - Detected provider to identify.
 * @returns Account-specific Azure key when available, otherwise the provider ID.
 */
export function dismissalKey(provider: DetectedProvider): string {
  const identity = azureAccountIdentity({
    name: provider.config.azAccountName as string | undefined,
    resourceGroup: provider.config.azResourceGroup as string | undefined,
    subscriptionId: provider.config.azSubscriptionId as string | undefined,
  });
  if (provider.providerId === 'azure' && identity) {
    return `azure-account:${identity}`;
  }
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
 * @returns Undismissed, unconfigured providers ordered as Copilot, Azure accounts, then Ollama.
 */
export async function detectProviders(
  existingProviders: StoredProviderConfig[],
  dismissedKeys: string[] = [],
  commandRunner: CommandRunner | null = null,
  signal?: AbortSignal
): Promise<DetectedProvider[]> {
  console.debug(
    `[ai-assistant auto-detect] detectProviders called with ${existingProviders.length} existing provider(s)`
  );

  const detected: DetectedProvider[] = [];

  /**
   * Checks whether a provider ID already has a saved configuration.
   *
   * @param providerId - Provider catalog ID to find.
   * @returns Whether any saved configuration uses the ID.
   */
  const hasProvider = (providerId: string) =>
    existingProviders.some(p => p.providerId === providerId);

  const skipCopilot = hasProvider('copilot') || dismissedKeys.includes('copilot');
  const skipLocal = hasProvider('local') || dismissedKeys.includes('local');

  const skipAllAzure = dismissedKeys.includes('azure');
  const dismissedAzureNames = new Set(
    dismissedKeys.filter(k => k.startsWith('azure:')).map(k => k.slice('azure:'.length))
  );
  const dismissedAzureIdentities = new Set(
    dismissedKeys
      .filter(k => k.startsWith('azure-account:'))
      .map(k => k.slice('azure-account:'.length).toLowerCase())
  );
  // CLI-backed configs saved before subscription scoping must stay detectable so
  // re-saving them can backfill the subscription needed for key resolution.
  const needsSubscriptionMigration = (provider: StoredProviderConfig): boolean =>
    provider.providerId === 'azure' &&
    provider.config?.apiKey === AZ_CLI_AUTH_SENTINEL &&
    Boolean(provider.config?.azAccountName) &&
    !provider.config?.azSubscriptionId;

  const savedAzureAccountNames = new Set(
    existingProviders
      .filter(
        p =>
          p.providerId === 'azure' &&
          p.config?.azAccountName &&
          !p.config?.azSubscriptionId &&
          !needsSubscriptionMigration(p)
      )
      .map(p => p.config.azAccountName as string)
  );
  const savedAzureIdentities = new Set(
    existingProviders.flatMap(provider => {
      if (provider.providerId !== 'azure') return [];
      const identity = azureAccountIdentity({
        name: provider.config.azAccountName as string | undefined,
        resourceGroup: provider.config.azResourceGroup as string | undefined,
        subscriptionId: provider.config.azSubscriptionId as string | undefined,
      });
      return identity ? [identity] : [];
    })
  );
  const savedAzureEndpoints = new Set(
    existingProviders
      .filter(p => p.providerId === 'azure' && p.config?.endpoint && !needsSubscriptionMigration(p))
      .map(p => normaliseEndpoint(p.config.endpoint as string))
  );
  const skipAzureAccountNames = new Set([...savedAzureAccountNames, ...dismissedAzureNames]);
  const skipAzureEndpoints = new Set([
    ...savedAzureEndpoints,
    ...dismissedKeys
      .filter(k => k.startsWith('azure-endpoint:'))
      .map(k => normaliseEndpoint(k.slice('azure-endpoint:'.length))),
  ]);

  const [copilot, azureAll, ollama] = await Promise.all([
    skipCopilot || !commandRunner
      ? Promise.resolve(null)
      : detectCopilotProvider(commandRunner, signal),
    skipAllAzure || !commandRunner
      ? Promise.resolve([])
      : collectAzureOpenAIProviders(
          commandRunner,
          skipAzureAccountNames,
          skipAzureEndpoints,
          new Set([...savedAzureIdentities, ...dismissedAzureIdentities]),
          signal
        ),
    skipLocal ? Promise.resolve(null) : detectOllamaProvider(),
  ]);

  if (copilot) detected.push(copilot);
  for (const azure of azureAll) {
    const accountName = azure.config?.azAccountName as string | undefined;
    if (accountName || !hasProvider('azure')) detected.push(azure);
  }
  if (ollama) detected.push(ollama);

  console.debug(
    `[ai-assistant auto-detect] detection complete: ${detected.length} provider(s) found`
  );

  return detected;
}
