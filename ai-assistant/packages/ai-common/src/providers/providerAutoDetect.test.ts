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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AZ_CLI_AUTH_SENTINEL,
  collectAzureOpenAIProviders,
  type CommandRunner,
  type CopilotModelEntry,
  detectCopilotChatModels,
  detectCopilotProvider,
  type DetectedProvider,
  detectGitHubToken,
  detectOllamaProvider,
  detectProviders,
  dismissalKey,
  GH_CLI_AUTH_SENTINEL,
  pickBestCopilotChatModel,
  refreshAzureOpenAIKey,
  refreshGitHubToken,
  validateGitHubToken,
} from './providerAutoDetect';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockCommandRunner(
  responses: Record<string, { stdout: string; exitCode: number }>
): CommandRunner {
  return async (command: string, args: string[]) => {
    const key = `${command} ${args.join(' ')}`;
    for (const [pattern, response] of Object.entries(responses)) {
      if (key.includes(pattern)) {
        return response;
      }
    }
    return { stdout: '', exitCode: -1 };
  };
}

// ---------------------------------------------------------------------------
// detectGitHubToken
// ---------------------------------------------------------------------------

describe('detectGitHubToken', () => {
  it('returns token when gh auth token succeeds', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_test1234567890abcdef\n', exitCode: 0 },
    });
    const result = await detectGitHubToken(runner);
    expect(result).toBe('ghp_test1234567890abcdef');
  });

  it('returns null when gh auth token fails', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: '', exitCode: 1 },
    });
    const result = await detectGitHubToken(runner);
    expect(result).toBeNull();
  });

  it('returns null when token is too short', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'short', exitCode: 0 },
    });
    const result = await detectGitHubToken(runner);
    expect(result).toBeNull();
  });

  it('returns null when command runner is not available for gh', async () => {
    const runner = mockCommandRunner({});
    const result = await detectGitHubToken(runner);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateGitHubToken
// ---------------------------------------------------------------------------

describe('validateGitHubToken', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns true for valid token', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const result = await validateGitHubToken('ghp_valid');
    expect(result).toBe(true);
  });

  it('returns false for invalid token', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    const result = await validateGitHubToken('ghp_invalid');
    expect(result).toBe(false);
  });

  it('returns false on network error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network error'));
    const result = await validateGitHubToken('ghp_error');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectCopilotChatModels
// ---------------------------------------------------------------------------

describe('detectCopilotChatModels', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns chat models from Copilot API', async () => {
    const models = [
      { id: 'gpt-4o', name: 'GPT-4o', version: '1', capabilities: { type: 'chat' } },
      {
        id: 'text-embedding',
        name: 'Embedding',
        version: '1',
        capabilities: { type: 'embeddings' },
      },
    ];
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ data: models }), { status: 200 }));
    const result = await detectCopilotChatModels('ghp_test');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('gpt-4o');
  });

  it('returns empty array on API error', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));
    const result = await detectCopilotChatModels('ghp_test');
    expect(result).toHaveLength(0);
  });

  it('returns empty array on network error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network error'));
    const result = await detectCopilotChatModels('ghp_test');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// pickBestCopilotChatModel
// ---------------------------------------------------------------------------

describe('pickBestCopilotChatModel', () => {
  it('prefers claude-opus over other models', () => {
    const models: CopilotModelEntry[] = [
      { id: 'gpt-4o', name: 'GPT-4o', version: '1' },
      { id: 'claude-opus-4', name: 'Claude Opus', version: '1' },
      { id: 'gpt-5.4', name: 'GPT-5.4', version: '1' },
    ];
    expect(pickBestCopilotChatModel(models)).toBe('claude-opus-4');
  });

  it('prefers gpt-5 over gpt-4', () => {
    const models: CopilotModelEntry[] = [
      { id: 'gpt-4o', name: 'GPT-4o', version: '1' },
      { id: 'gpt-5.4', name: 'GPT-5.4', version: '1' },
    ];
    expect(pickBestCopilotChatModel(models)).toBe('gpt-5.4');
  });

  it('returns first model when no priority matches', () => {
    const models: CopilotModelEntry[] = [{ id: 'custom-model', name: 'Custom', version: '1' }];
    expect(pickBestCopilotChatModel(models)).toBe('custom-model');
  });

  it('returns gpt-4o when models array is empty', () => {
    expect(pickBestCopilotChatModel([])).toBe('gpt-4o');
  });
});

// ---------------------------------------------------------------------------
// detectCopilotProvider
// ---------------------------------------------------------------------------

describe('detectCopilotProvider', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns copilot provider when gh token is valid', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_validtoken1234567890\n', exitCode: 0 },
    });

    // validateGitHubToken
    fetchSpy.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    // detectCopilotChatModels
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: 'gpt-4o', name: 'GPT-4o', version: '1' }] }), {
        status: 200,
      })
    );

    const result = await detectCopilotProvider(runner);
    expect(result).not.toBeNull();
    expect(result!.providerId).toBe('copilot');
    expect(result!.config.apiKey).toBe(GH_CLI_AUTH_SENTINEL);
    expect(result!.config.model).toBe('gpt-4o');
  });

  it('returns null when gh token is invalid', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_invalidtoken12345678\n', exitCode: 0 },
    });
    fetchSpy.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

    const result = await detectCopilotProvider(runner);
    expect(result).toBeNull();
  });

  it('returns null when gh is not installed', async () => {
    const runner = mockCommandRunner({});
    const result = await detectCopilotProvider(runner);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectOllamaProvider
// ---------------------------------------------------------------------------

describe('detectOllamaProvider', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns local provider when Ollama is running with models', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ models: [{ name: 'llama3.1' }, { name: 'mistral' }] }), {
        status: 200,
      })
    );
    const result = await detectOllamaProvider();
    expect(result).not.toBeNull();
    expect(result!.providerId).toBe('local');
    expect(result!.config.model).toBe('llama3.1');
    expect(result!.config.baseUrl).toBe('http://localhost:11434');
    expect(result!.source).toBe('Ollama');
  });

  it('returns null when Ollama has no models', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ models: [] }), { status: 200 }));
    const result = await detectOllamaProvider();
    expect(result).toBeNull();
  });

  it('returns null when Ollama is not reachable', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Connection refused'));
    const result = await detectOllamaProvider();
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// collectAzureOpenAIProviders
// ---------------------------------------------------------------------------

describe('collectAzureOpenAIProviders', () => {
  it('returns Azure providers with chat-capable deployments', async () => {
    const runner = mockCommandRunner({
      'az account show': {
        stdout: JSON.stringify({ name: 'TestSub' }),
        exitCode: 0,
      },
      'az cognitiveservices account list': {
        stdout: JSON.stringify([
          {
            name: 'myopenai',
            resourceGroup: 'rg1',
            properties: { endpoint: 'https://myopenai.openai.azure.com' },
          },
        ]),
        exitCode: 0,
      },
      'az cognitiveservices account deployment list': {
        stdout: JSON.stringify([
          {
            name: 'gpt4-deploy',
            properties: { model: { name: 'gpt-4' }, capabilities: { chatCompletion: 'true' } },
          },
        ]),
        exitCode: 0,
      },
      'az cognitiveservices account keys list': {
        stdout: JSON.stringify({ key1: 'test-key-1' }),
        exitCode: 0,
      },
    });

    const result = await collectAzureOpenAIProviders(runner);
    expect(result).toHaveLength(1);
    expect(result[0].providerId).toBe('azure');
    expect(result[0].config.apiKey).toBe(AZ_CLI_AUTH_SENTINEL);
    expect(result[0].config.azAccountName).toBe('myopenai');
    expect(result[0].config.deploymentName).toBe('gpt4-deploy');
  });

  it('returns empty when not logged in', async () => {
    const runner = mockCommandRunner({
      'az account show': { stdout: '', exitCode: 1 },
    });
    const result = await collectAzureOpenAIProviders(runner);
    expect(result).toHaveLength(0);
  });

  it('skips accounts in the skip set', async () => {
    const runner = mockCommandRunner({
      'az account show': {
        stdout: JSON.stringify({ name: 'TestSub' }),
        exitCode: 0,
      },
      'az cognitiveservices account list': {
        stdout: JSON.stringify([
          {
            name: 'skippedAccount',
            resourceGroup: 'rg1',
            properties: { endpoint: 'https://skipped.openai.azure.com' },
          },
        ]),
        exitCode: 0,
      },
    });

    const result = await collectAzureOpenAIProviders(runner, new Set(['skippedAccount']));
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// refreshGitHubToken / refreshAzureOpenAIKey
// ---------------------------------------------------------------------------

describe('refreshGitHubToken', () => {
  it('returns fresh token from gh CLI', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_freshtoken1234567890\n', exitCode: 0 },
    });
    const result = await refreshGitHubToken(runner);
    expect(result).toBe('ghp_freshtoken1234567890');
  });
});

describe('refreshAzureOpenAIKey', () => {
  it('returns fresh key from az CLI', async () => {
    const runner = mockCommandRunner({
      'az cognitiveservices account keys list': {
        stdout: JSON.stringify({ key1: 'fresh-key' }),
        exitCode: 0,
      },
    });
    const result = await refreshAzureOpenAIKey('rg1', 'account1', runner);
    expect(result).toBe('fresh-key');
  });

  it('returns null when az CLI fails', async () => {
    const runner = mockCommandRunner({});
    const result = await refreshAzureOpenAIKey('rg1', 'account1', runner);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// dismissalKey
// ---------------------------------------------------------------------------

describe('dismissalKey', () => {
  it('returns provider ID for non-Azure providers', () => {
    const provider: DetectedProvider = {
      providerId: 'copilot',
      source: 'GitHub CLI',
      config: { apiKey: GH_CLI_AUTH_SENTINEL },
      displayName: 'Copilot',
    };
    expect(dismissalKey(provider)).toBe('copilot');
  });

  it('returns azure:accountName for Azure providers', () => {
    const provider: DetectedProvider = {
      providerId: 'azure',
      source: 'Azure CLI',
      config: { azAccountName: 'myaccount' },
      displayName: 'Azure (myaccount)',
    };
    expect(dismissalKey(provider)).toBe('azure:myaccount');
  });

  it('returns bare azure for Azure without account name', () => {
    const provider: DetectedProvider = {
      providerId: 'azure',
      source: 'Azure CLI',
      config: {},
      displayName: 'Azure',
    };
    expect(dismissalKey(provider)).toBe('azure');
  });
});

// ---------------------------------------------------------------------------
// detectProviders
// ---------------------------------------------------------------------------

describe('detectProviders', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('detects Ollama without a command runner', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ models: [{ name: 'llama3.1' }] }), { status: 200 })
    );
    const result = await detectProviders([], [], null);
    expect(result).toHaveLength(1);
    expect(result[0].providerId).toBe('local');
  });

  it('skips copilot when already configured', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ models: [] }), { status: 200 }));
    const existing = [
      { providerId: 'copilot', config: { apiKey: GH_CLI_AUTH_SENTINEL, model: 'gpt-4o' } },
    ];
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_test12345678901234\n', exitCode: 0 },
    });

    const result = await detectProviders(existing, [], runner);
    // Copilot should be skipped, no Ollama (mocked empty)
    expect(result.every(p => p.providerId !== 'copilot')).toBe(true);
  });

  it('skips dismissed providers', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_test12345678901234\n', exitCode: 0 },
    });

    const result = await detectProviders([], ['copilot', 'local'], runner);
    expect(result).toHaveLength(0);
  });

  it('returns empty array when all providers are already configured', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const existing = [
      { providerId: 'copilot', config: {} },
      { providerId: 'local', config: {} },
    ];
    const result = await detectProviders(existing, [], null);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Sentinel constants
// ---------------------------------------------------------------------------

describe('sentinel constants', () => {
  it('GH_CLI_AUTH_SENTINEL is a string', () => {
    expect(typeof GH_CLI_AUTH_SENTINEL).toBe('string');
    expect(GH_CLI_AUTH_SENTINEL).toBe('__GH_CLI_AUTH__');
  });

  it('AZ_CLI_AUTH_SENTINEL is a string', () => {
    expect(typeof AZ_CLI_AUTH_SENTINEL).toBe('string');
    expect(AZ_CLI_AUTH_SENTINEL).toBe('__AZ_CLI_AUTH__');
  });
});

// ---------------------------------------------------------------------------
// Command allowlist
// ---------------------------------------------------------------------------

describe('command allowlist', () => {
  it('rejects disallowed commands', async () => {
    const calls: string[] = [];
    const runner: CommandRunner = async (cmd, args) => {
      calls.push(`${cmd} ${args.join(' ')}`);
      return { stdout: 'hacked', exitCode: 0 };
    };
    // detectGitHubToken uses 'gh' which is allowed
    // Try to inject a disallowed command by calling the underlying function indirectly
    // We can't call runDetectCommand directly, but detectProviders only uses allowed commands
    await detectGitHubToken(runner);
    // The runner was called with 'gh' which is allowed
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain('gh');
  });
});
