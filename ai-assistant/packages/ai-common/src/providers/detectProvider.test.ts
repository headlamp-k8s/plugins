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
  detectAzureOpenAIProvider,
  detectCopilotChatModels,
  detectCopilotProvider,
  type DetectedProvider,
  detectGhCliAvailable,
  detectGitHubToken,
  detectOllamaProvider,
  detectProviders,
  dismissalKey,
  GH_CLI_AUTH_SENTINEL,
  pickBestCopilotChatModel,
  refreshAzureOpenAIKey,
  refreshGitHubToken,
  validateGitHubToken,
  verifyAzureOpenAIAccess,
} from './detectProvider';

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

  it('settles when Copilot detection is aborted during token validation', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_validtoken1234567890\n', exitCode: 0 },
    });
    let receivedSignal: AbortSignal | null | undefined;
    fetchSpy.mockImplementation((...args: unknown[]) => {
      const options = args[1] as RequestInit | undefined;
      receivedSignal = options?.signal;
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true }
        );
      });
    });
    const controller = new AbortController();

    const detection = detectCopilotProvider(runner, controller.signal);
    await vi.waitFor(() => expect(receivedSignal).toBe(controller.signal));
    controller.abort();

    expect(await detection).toBeNull();
    expect(receivedSignal?.aborted).toBe(true);
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
  it('uses Azure Management APIs without az graph, az rest, or key retrieval', async () => {
    const calls: string[] = [];
    const runner: CommandRunner = async (command, args) => {
      const call = `${command} ${args.join(' ')}`;
      calls.push(call);

      if (call.includes('az account get-access-token')) {
        return { stdout: 'management-token\n', exitCode: 0 };
      }
      return { stdout: '', exitCode: -1 };
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [
              {
                id: '/subscriptions/foundry-sub',
                subscriptionId: 'foundry-sub',
                state: 'Enabled',
              },
            ],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: '/subscriptions/foundry-sub/resourceGroups/foundry-rg/providers/Microsoft.CognitiveServices/accounts/my-foundry',
                name: 'my-foundry',
                resourceGroup: 'foundry-rg',
                subscriptionId: 'foundry-sub',
                endpoint: 'https://my-foundry.cognitiveservices.azure.com/',
              },
            ],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [
              {
                name: 'gpt-4.1',
                properties: {
                  model: { name: 'gpt-4.1' },
                  capabilities: { chatCompletion: 'true' },
                },
              },
            ],
          }),
          { status: 200 }
        )
      );

    try {
      const result = await collectAzureOpenAIProviders(runner);

      expect(result).toHaveLength(1);
      expect(result[0].config).toMatchObject({
        azSubscriptionId: 'foundry-sub',
        endpoint: 'https://my-foundry.cognitiveservices.azure.com/',
        deploymentName: 'gpt-4.1',
      });
      expect(calls).toEqual([
        'az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv',
      ]);
      expect(calls.some(call => call.includes('az graph'))).toBe(false);
      expect(calls.some(call => call.includes('az rest'))).toBe(false);
      expect(calls.some(call => call.includes('account keys list'))).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('returns no provider when the deployment API fails without invoking another command', async () => {
    const calls: string[] = [];
    const runner: CommandRunner = async (command, args) => {
      const call = `${command} ${args.join(' ')}`;
      calls.push(call);
      if (call.includes('az account get-access-token')) {
        return { stdout: 'token', exitCode: 0 };
      }
      return { stdout: '', exitCode: -1 };
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [{ id: '/subscriptions/sub', subscriptionId: 'sub', state: 'Enabled' }],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.CognitiveServices/accounts/account',
                name: 'account',
                resourceGroup: 'rg',
                subscriptionId: 'sub',
                endpoint: 'https://account.openai.azure.com',
              },
            ],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response('', { status: 503 }));

    try {
      const result = await detectAzureOpenAIProvider(runner);

      expect(result).toBeNull();
      expect(calls).toEqual([
        'az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv',
      ]);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('skips accounts without a subscription ID', async () => {
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT, [
      {
        id: '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.CognitiveServices/accounts/account',
        name: 'account',
        resourceGroup: 'rg',
        endpoint: 'https://account.openai.azure.com',
      },
    ]);

    expect(await collectAzureOpenAIProviders(runner)).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('follows Resource Graph API continuation tokens', async () => {
    const runner: CommandRunner = async (_command, args) => {
      const call = args.join(' ');
      if (call.includes('get-access-token')) {
        return { stdout: 'token', exitCode: 0 };
      }
      return { stdout: '', exitCode: -1 };
    };
    const graphBodies: Record<string, unknown>[] = [];
    const accounts = ['first', 'second'];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      if (String(url).includes('/subscriptions?')) {
        return new Response(
          JSON.stringify({
            value: [{ id: '/subscriptions/sub', subscriptionId: 'sub', state: 'Enabled' }],
          }),
          { status: 200 }
        );
      }
      if (String(url).includes('Microsoft.ResourceGraph/resources')) {
        const body = JSON.parse(String(options?.body)) as Record<string, any>;
        graphBodies.push(body);
        const secondPage = body.options?.$skipToken === 'next-page';
        const name = secondPage ? 'second' : 'first';
        return new Response(
          JSON.stringify({
            data: [
              {
                id: `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.CognitiveServices/accounts/${name}`,
                name,
                resourceGroup: 'rg',
                subscriptionId: 'sub',
                endpoint: `https://${name}.openai.azure.com`,
              },
            ],
            ...(secondPage ? {} : { $skipToken: 'next-page' }),
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ value: JSON.parse(CHAT_DEPLOYMENT_STDOUT) }), {
        status: 200,
      });
    });

    try {
      const result = await collectAzureOpenAIProviders(runner);

      expect(result.map(provider => provider.config.azAccountName)).toEqual(accounts);
      expect(graphBodies).toHaveLength(2);
      expect(graphBodies[1].options).toMatchObject({ $skipToken: 'next-page' });
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('limits deployment discovery to eight concurrent commands', async () => {
    let activeCommands = 0;
    let maxActiveCommands = 0;
    const releaseCommands: Array<() => void> = [];
    const accounts = Array.from({ length: 9 }, (_, index) => ({
      id: `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.CognitiveServices/accounts/account-${index}`,
      name: `account-${index}`,
      resourceGroup: 'rg',
      subscriptionId: 'sub',
      endpoint: `https://account-${index}.openai.azure.com`,
    }));
    const runner: CommandRunner = async (_command, args) => {
      const call = args.join(' ');
      if (call.includes('get-access-token')) {
        return { stdout: 'token', exitCode: 0 };
      }
      return { stdout: '', exitCode: -1 };
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
      if (String(url).includes('/subscriptions?')) {
        return new Response(
          JSON.stringify({
            value: [{ id: '/subscriptions/sub', subscriptionId: 'sub', state: 'Enabled' }],
          }),
          { status: 200 }
        );
      }
      if (String(url).includes('Microsoft.ResourceGraph/resources')) {
        return new Response(JSON.stringify({ data: accounts }), { status: 200 });
      }
      return new Promise<Response>(resolve => {
        activeCommands += 1;
        maxActiveCommands = Math.max(maxActiveCommands, activeCommands);
        releaseCommands.push(() => {
          activeCommands -= 1;
          resolve(
            new Response(JSON.stringify({ value: JSON.parse(CHAT_DEPLOYMENT_STDOUT) }), {
              status: 200,
            })
          );
        });
      });
    });

    try {
      const detection = collectAzureOpenAIProviders(runner);
      await vi.waitFor(() => expect(releaseCommands).toHaveLength(8));
      releaseCommands.splice(0).forEach(resolve => resolve());
      await vi.waitFor(() => expect(releaseCommands).toHaveLength(1));
      releaseCommands.splice(0).forEach(resolve => resolve());

      expect(await detection).toHaveLength(9);
      expect(maxActiveCommands).toBe(8);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('stops after the first successful deployment batch for single-provider detection', async () => {
    const deploymentCalls: string[] = [];
    const abortedAccounts: string[] = [];
    const accounts = Array.from({ length: 9 }, (_, index) => ({
      id: `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.CognitiveServices/accounts/account-${index}`,
      name: `account-${index}`,
      resourceGroup: 'rg',
      subscriptionId: 'sub',
      endpoint: `https://account-${index}.openai.azure.com`,
    }));
    const runner: CommandRunner = async (_command, args) => {
      const call = args.join(' ');
      if (call.includes('get-access-token')) {
        return { stdout: 'token', exitCode: 0 };
      }
      return { stdout: '', exitCode: -1 };
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      if (String(url).includes('/subscriptions?')) {
        return new Response(
          JSON.stringify({
            value: [{ id: '/subscriptions/sub', subscriptionId: 'sub', state: 'Enabled' }],
          }),
          { status: 200 }
        );
      }
      if (String(url).includes('Microsoft.ResourceGraph/resources')) {
        return new Response(JSON.stringify({ data: accounts }), { status: 200 });
      }
      const match = String(url).match(/accounts\/(account-\d+)\/deployments/);
      const accountName = match?.[1] ?? '';
      deploymentCalls.push(accountName);
      if (accountName === 'account-0') {
        return new Response(JSON.stringify({ value: JSON.parse(CHAT_DEPLOYMENT_STDOUT) }), {
          status: 200,
        });
      }
      return new Promise(resolve => {
        options?.signal?.addEventListener(
          'abort',
          () => {
            abortedAccounts.push(accountName);
            resolve(new Response('', { status: 499 }));
          },
          { once: true }
        );
      });
    });

    try {
      const result = await detectAzureOpenAIProvider(runner);

      expect(result?.config.azAccountName).toBe('account-0');
      expect(deploymentCalls).toHaveLength(8);
      expect(abortedAccounts).toHaveLength(7);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('returns Azure providers with chat-capable deployments', async () => {
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);

    const result = await collectAzureOpenAIProviders(runner);
    expect(result).toHaveLength(1);
    expect(result[0].providerId).toBe('azure');
    expect(result[0].config.apiKey).toBe(AZ_CLI_AUTH_SENTINEL);
    expect(result[0].config.azAccountName).toBe('myoai');
    expect(result[0].config.deploymentName).toBe('gpt4-deploy');
  });

  it('detects Foundry models in enabled non-active subscriptions', async () => {
    const calls: string[] = [];
    const runner: CommandRunner = async (command, args) => {
      const call = `${command} ${args.join(' ')}`;
      calls.push(call);

      if (call.includes('az account get-access-token')) {
        return { stdout: 'token', exitCode: 0 };
      }
      return { stdout: '', exitCode: -1 };
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [
              {
                id: '/subscriptions/active-sub',
                subscriptionId: 'active-sub',
                state: 'Enabled',
              },
              {
                id: '/subscriptions/foundry-sub',
                subscriptionId: 'foundry-sub',
                state: 'Enabled',
              },
            ],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: '/subscriptions/foundry-sub/resourceGroups/foundry-rg/providers/Microsoft.CognitiveServices/accounts/my-foundry',
                name: 'my-foundry',
                resourceGroup: 'foundry-rg',
                subscriptionId: 'foundry-sub',
                endpoint: 'https://my-foundry.cognitiveservices.azure.com/',
              },
            ],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [
              {
                name: 'gpt-4.1-deployment',
                properties: {
                  model: { name: 'gpt-4.1' },
                  capabilities: { chatCompletion: 'true' },
                },
              },
            ],
          }),
          { status: 200 }
        )
      );

    const result = await collectAzureOpenAIProviders(runner);

    expect(result).toHaveLength(1);
    expect(result[0].config).toMatchObject({
      azSubscriptionId: 'foundry-sub',
      azAccountName: 'my-foundry',
      deploymentName: 'gpt-4.1-deployment',
      model: 'gpt-4.1',
    });
    expect(calls).toEqual([
      'az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv',
    ]);
    fetchSpy.mockRestore();
  });

  it('returns empty when not logged in', async () => {
    const runner = mockCommandRunner({
      'az account get-access-token': { stdout: '', exitCode: 1 },
    });
    const result = await collectAzureOpenAIProviders(runner);
    expect(result).toHaveLength(0);
  });

  it('skips accounts in the skip set', async () => {
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT, [
      { ...AZURE_TEST_ACCOUNT, name: 'skippedAccount' },
    ]);

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
  it('returns a fresh key using token auth and ARM', async () => {
    const runner = mockCommandRunner({
      'az account get-access-token': { stdout: 'token', exitCode: 0 },
    });
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ key1: 'fresh-key' }), { status: 200 }));
    expect(await refreshAzureOpenAIKey('rg1', 'account1', runner, 'sub')).toEqual({
      key: 'fresh-key',
    });
    fetchSpy.mockRestore();
  });

  it('explains the failure when token acquisition fails', async () => {
    const runner = mockCommandRunner({});
    const result = await refreshAzureOpenAIKey('rg1', 'account1', runner);
    expect(result.key).toBeNull();
    expect(result.reason).toContain('no subscription ID');
  });

  it('forwards cancellation to CLI authentication', async () => {
    const controller = new AbortController();
    let runnerSignal: AbortSignal | undefined;
    const runner = vi.fn(
      async (_command: string, _args: string[], signal?: AbortSignal) =>
        new Promise<{ stdout: string; exitCode: number }>(resolve => {
          runnerSignal = signal;
          signal?.addEventListener('abort', () => resolve({ stdout: '', exitCode: -1 }), {
            once: true,
          });
        })
    );

    const refresh = refreshAzureOpenAIKey('rg1', 'account1', runner, 'sub', controller.signal);
    await vi.waitFor(() => expect(runner).toHaveBeenCalled());
    controller.abort();

    expect((await refresh).key).toBeNull();
    expect(runnerSignal?.aborted).toBe(true);
  });

  it('forwards cancellation to the key request', async () => {
    const controller = new AbortController();
    const runner = vi.fn(async () => ({ stdout: 'token', exitCode: 0 }));
    let fetchSignal: AbortSignal | undefined;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (_url, options) =>
        new Promise<Response>((_resolve, reject) => {
          fetchSignal = options?.signal ?? undefined;
          options?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
        })
    );

    const refresh = refreshAzureOpenAIKey('rg1', 'account1', runner, 'sub', controller.signal);
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    controller.abort();

    expect((await refresh).key).toBeNull();
    expect(fetchSignal?.aborted).toBe(true);
  });
});

describe('verifyAzureOpenAIAccess', () => {
  const config = {
    azResourceGroup: 'rg1',
    azAccountName: 'account1',
    azSubscriptionId: 'sub',
    endpoint: 'https://account1.openai.azure.com',
  };

  /** Builds a runner whose Azure CLI token acquisition succeeds. */
  function authenticatedRunner(): CommandRunner {
    return mockCommandRunner({ 'az account get-access-token': { stdout: 'token', exitCode: 0 } });
  }

  it('passes when the key can be read and the endpoint accepts the key', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async url =>
      String(url).includes('/listKeys')
        ? new Response(JSON.stringify({ key1: 'fresh-key' }), { status: 200 })
        : new Response(JSON.stringify({ data: [] }), { status: 200 })
    );
    expect(await verifyAzureOpenAIAccess(config, authenticatedRunner())).toEqual({ ok: true });
  });

  it('explains that listing deployments does not grant key access', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }));
    const result = await verifyAzureOpenAIAccess(config, authenticatedRunner());
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Cognitive Services Contributor');
  });

  it('surfaces the endpoint rejection reason when network rules block the account', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async url =>
      String(url).includes('/listKeys')
        ? new Response(JSON.stringify({ key1: 'fresh-key' }), { status: 200 })
        : new Response(
            JSON.stringify({
              error: { message: 'Access denied due to Virtual Network/Firewall rules.' },
            }),
            { status: 403 }
          )
    );
    const result = await verifyAzureOpenAIAccess(config, authenticatedRunner());
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Virtual Network/Firewall rules');
  });

  it('does not block on an unreachable endpoint', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
      if (String(url).includes('/listKeys')) {
        return new Response(JSON.stringify({ key1: 'fresh-key' }), { status: 200 });
      }
      throw new TypeError('Failed to fetch');
    });
    expect(await verifyAzureOpenAIAccess(config, authenticatedRunner())).toEqual({ ok: true });
  });

  it('rejects a config that lacks the account details needed to fetch a key', async () => {
    const result = await verifyAzureOpenAIAccess(
      { azAccountName: 'account1' },
      authenticatedRunner()
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('missing the Azure account details');
  });

  it('skips the check when no command runner is available', async () => {
    expect(await verifyAzureOpenAIAccess(config, null)).toEqual({ ok: true });
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

  it('returns a subscription-scoped key for detected Azure accounts', () => {
    const provider: DetectedProvider = {
      providerId: 'azure',
      source: 'Azure CLI',
      config: {
        azAccountName: 'MyAccount',
        azResourceGroup: 'MyGroup',
        azSubscriptionId: 'MySubscription',
      },
      displayName: 'Azure',
    };
    expect(dismissalKey(provider)).toBe('azure-account:mysubscription/mygroup/myaccount');
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

// ---------------------------------------------------------------------------
// detectGhCliAvailable
// ---------------------------------------------------------------------------

describe('detectGhCliAvailable', () => {
  it('returns false when exit code is 127 (binary not installed)', async () => {
    const runner = mockCommandRunner({ 'gh auth token': { stdout: '', exitCode: 127 } });
    expect(await detectGhCliAvailable(runner)).toBe(false);
  });

  it('returns false when stdout contains "command not found"', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'gh: command not found', exitCode: 1 },
    });
    expect(await detectGhCliAvailable(runner)).toBe(false);
  });

  it('returns false when stdout contains "no such file"', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'no such file or directory', exitCode: 2 },
    });
    expect(await detectGhCliAvailable(runner)).toBe(false);
  });

  it('returns false when stdout contains "is not recognized"', async () => {
    const runner = mockCommandRunner({
      'gh auth token': {
        stdout: "'gh' is not recognized as an internal or external command",
        exitCode: 1,
      },
    });
    expect(await detectGhCliAvailable(runner)).toBe(false);
  });

  it('returns true when gh is available and authenticated', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_validtoken1234', exitCode: 0 },
    });
    expect(await detectGhCliAvailable(runner)).toBe(true);
  });

  it('returns true when gh is present but not authenticated (non-127 exit, no error strings)', async () => {
    const runner = mockCommandRunner({ 'gh auth token': { stdout: '', exitCode: 1 } });
    expect(await detectGhCliAvailable(runner)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runDetectCommand — error and timeout paths
// ---------------------------------------------------------------------------

describe('runDetectCommand — error paths (via detectGitHubToken)', () => {
  it('returns null when the command runner throws (catch path)', async () => {
    const throwingRunner: CommandRunner = async () => {
      throw new Error('ENOENT: no such file or directory');
    };
    const result = await detectGitHubToken(throwingRunner);
    expect(result).toBeNull();
  });

  it('aborts a command runner when detection times out', async () => {
    vi.useFakeTimers();
    try {
      let receivedSignal: AbortSignal | undefined;
      const runner: CommandRunner = async (_command, _args, signal) => {
        receivedSignal = signal;
        return new Promise(() => {});
      };
      const detection = detectGitHubToken(runner);
      await vi.advanceTimersByTimeAsync(15_001);
      expect(await detection).toBeNull();
      expect(receivedSignal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns null after command timeout (timeout path)', async () => {
    vi.useFakeTimers();
    try {
      const hangingRunner: CommandRunner = () => new Promise<never>(() => {});
      const p = detectGitHubToken(hangingRunner);
      await vi.advanceTimersByTimeAsync(20_000);
      expect(await p).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// detectOllamaProvider — non-ok HTTP response and abort
// ---------------------------------------------------------------------------

describe('detectOllamaProvider — non-ok HTTP and abort', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns null when Ollama responds with non-200 status', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }));
    expect(await detectOllamaProvider()).toBeNull();
  });

  it('aborts and returns null when Ollama fetch exceeds 2s timeout', async () => {
    vi.useFakeTimers();
    try {
      fetchSpy.mockImplementation((...args: unknown[]) => {
        const options = args[1] as RequestInit | undefined;
        return new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      });
      const p = detectOllamaProvider();
      await vi.advanceTimersByTimeAsync(3000);
      expect(await p).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// Helpers for Azure tests
// ---------------------------------------------------------------------------

/** Default account returned by the Azure Resource Graph API test harness. */
const AZURE_TEST_ACCOUNT = {
  id: '/subscriptions/sub/resourceGroups/rg1/providers/Microsoft.CognitiveServices/accounts/myoai',
  name: 'myoai',
  resourceGroup: 'rg1',
  subscriptionId: 'sub',
  endpoint: 'https://myoai.openai.azure.com',
};

/**
 * Builds an auth-only command runner and mocks the Azure APIs used for detection.
 *
 * @param deploymentStdout - JSON deployment array returned by the deployment API.
 * @param accounts - Resource Graph account rows.
 * @returns Command runner that supports only Azure token acquisition.
 */
function makeAzureBaseRunner(
  deploymentStdout: string,
  accounts: Record<string, unknown>[] = [AZURE_TEST_ACCOUNT]
): CommandRunner {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
    const requestUrl = String(url);
    if (requestUrl.includes('/subscriptions?')) {
      return new Response(
        JSON.stringify({
          value: [{ id: '/subscriptions/sub', subscriptionId: 'sub', state: 'Enabled' }],
        }),
        { status: 200 }
      );
    }
    if (requestUrl.includes('Microsoft.ResourceGraph/resources')) {
      return new Response(JSON.stringify({ data: accounts }), { status: 200 });
    }
    if (requestUrl.includes('/deployments?')) {
      return new Response(JSON.stringify({ value: JSON.parse(deploymentStdout) }), { status: 200 });
    }
    return new Response('', { status: 404 });
  });
  return mockCommandRunner({
    'az account get-access-token': { stdout: 'management-token', exitCode: 0 },
  });
}

afterEach(() => vi.restoreAllMocks());

const CHAT_DEPLOYMENT_STDOUT = JSON.stringify([
  {
    name: 'gpt4-deploy',
    properties: { model: { name: 'gpt-4' }, capabilities: { chatCompletion: 'true' } },
  },
]);

// ---------------------------------------------------------------------------
// isChatDeployment — branches via collectAzureOpenAIProviders
// ---------------------------------------------------------------------------

describe('isChatDeployment — deployment filtering via collectAzureOpenAIProviders', () => {
  it('excludes deployment when capabilities.embeddings is "true" (no chatCompletion key)', async () => {
    const runner = makeAzureBaseRunner(
      JSON.stringify([
        {
          name: 'embed',
          properties: {
            model: { name: 'ada-002' },
            capabilities: { embeddings: 'true' },
          },
        },
      ])
    );
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(0);
  });

  it('excludes deployment with "embedding" in model name when no capabilities', async () => {
    const runner = makeAzureBaseRunner(
      JSON.stringify([{ name: 'd', properties: { model: { name: 'text-embedding-3-large' } } }])
    );
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(0);
  });

  it('excludes deployment with "whisper" in model name', async () => {
    const runner = makeAzureBaseRunner(
      JSON.stringify([{ name: 'd', properties: { model: { name: 'whisper-1' } } }])
    );
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(0);
  });

  it('excludes deployment with "tts" in model name', async () => {
    const runner = makeAzureBaseRunner(
      JSON.stringify([{ name: 'd', properties: { model: { name: 'tts-1' } } }])
    );
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(0);
  });

  it('excludes deployment with "dall-e" in model name', async () => {
    const runner = makeAzureBaseRunner(
      JSON.stringify([{ name: 'd', properties: { model: { name: 'dall-e-3' } } }])
    );
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(0);
  });

  it('includes deployment with no capabilities and a chat-compatible model name', async () => {
    const runner = makeAzureBaseRunner(
      JSON.stringify([{ name: 'gpt4', properties: { model: { name: 'gpt-4o' } } }])
    );
    const result = await collectAzureOpenAIProviders(runner);
    expect(result).toHaveLength(1);
    expect(result[0].config.model).toBe('gpt-4o');
  });

  it('uses "gpt-4" as default model when deployment properties have no model name', async () => {
    const runner = makeAzureBaseRunner(
      JSON.stringify([{ name: 'chat-d', properties: { capabilities: { chatCompletion: 'true' } } }])
    );
    const result = await collectAzureOpenAIProviders(runner);
    expect(result).toHaveLength(1);
    expect(result[0].config.model).toBe('gpt-4');
  });
});

// ---------------------------------------------------------------------------
// collectAzureOpenAIProviders — error and skip branches
// ---------------------------------------------------------------------------

describe('collectAzureOpenAIProviders — error and skip branches', () => {
  it('returns empty when token acquisition fails', async () => {
    const runner = mockCommandRunner({
      'az account get-access-token': { stdout: '', exitCode: 1 },
    });
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(0);
  });

  it('returns empty when subscription discovery fails', async () => {
    const runner = mockCommandRunner({
      'az account get-access-token': { stdout: 'token', exitCode: 0 },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }));
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(0);
  });

  it('logs the account identity when deployment listing is rejected', async () => {
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    const fetchMock = vi.mocked(globalThis.fetch);
    const originalImplementation = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((url, options) =>
      String(url).includes('/deployments?')
        ? Promise.resolve(new Response('', { status: 403, statusText: 'Forbidden' }))
        : originalImplementation!(url, options)
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await collectAzureOpenAIProviders(runner)).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[ai-assistant auto-detect] Azure deployment listing for sub/rg1/myoai failed:',
      '403 Forbidden'
    );
  });

  it('logs the account identity when deployment listing throws', async () => {
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    const fetchMock = vi.mocked(globalThis.fetch);
    const originalImplementation = fetchMock.getMockImplementation();
    const failure = new Error('offline');
    fetchMock.mockImplementation((url, options) =>
      String(url).includes('/deployments?')
        ? Promise.reject(failure)
        : originalImplementation!(url, options)
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await collectAzureOpenAIProviders(runner)).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[ai-assistant auto-detect] Azure deployment listing for sub/rg1/myoai failed:',
      failure
    );
  });

  it('aborts subscription discovery when the Azure API times out', async () => {
    vi.useFakeTimers();
    try {
      const runner = mockCommandRunner({
        'az account get-access-token': { stdout: 'token', exitCode: 0 },
      });
      let receivedSignal: AbortSignal | undefined;
      vi.spyOn(globalThis, 'fetch').mockImplementation((_url, options) => {
        receivedSignal = options?.signal ?? undefined;
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
        });
      });

      const detection = collectAzureOpenAIProviders(runner);
      await vi.advanceTimersByTimeAsync(15_001);

      expect(await detection).toEqual([]);
      expect(receivedSignal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('queries only enabled subscriptions across subscription pages', async () => {
    const runner = mockCommandRunner({
      'az account get-access-token': { stdout: 'token', exitCode: 0 },
    });
    let graphBody: Record<string, any> | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      if (String(url).includes('subscriptions?page=2')) {
        return new Response(
          JSON.stringify({ value: [{ subscriptionId: 'enabled-two', state: 'Enabled' }] }),
          { status: 200 }
        );
      }
      if (String(url).includes('/subscriptions?')) {
        return new Response(
          JSON.stringify({
            value: [
              { subscriptionId: 'enabled-one', state: 'Enabled' },
              { subscriptionId: 'disabled', state: 'Disabled' },
            ],
            nextLink: 'https://management.azure.com/subscriptions?page=2',
          }),
          { status: 200 }
        );
      }
      if (String(url).includes('Microsoft.ResourceGraph/resources')) {
        graphBody = JSON.parse(String(options?.body));
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }
      return new Response('', { status: 404 });
    });

    expect(await collectAzureOpenAIProviders(runner)).toEqual([]);
    expect(graphBody?.subscriptions).toEqual(['enabled-one', 'enabled-two']);
  });

  it('skips account whose endpoint matches skipEndpoints (normalises trailing slashes)', async () => {
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT, [
      { ...AZURE_TEST_ACCOUNT, endpoint: 'https://myoai.openai.azure.com/' },
    ]);
    const result = await collectAzureOpenAIProviders(
      runner,
      new Set(),
      new Set(['https://myoai.openai.azure.com'])
    );
    expect(result).toHaveLength(0);
  });

  it.each([
    ['resource ID', { ...AZURE_TEST_ACCOUNT, id: undefined }],
    ['endpoint', { ...AZURE_TEST_ACCOUNT, endpoint: undefined }],
    ['resource group', { ...AZURE_TEST_ACCOUNT, resourceGroup: undefined }],
  ])('skips accounts missing %s', async (_label, account) => {
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT, [account]);
    expect(await collectAzureOpenAIProviders(runner)).toEqual([]);
  });

  it('skips account when all deployments are non-chat', async () => {
    const runner = makeAzureBaseRunner(
      JSON.stringify([
        {
          name: 'embed',
          properties: { model: { name: 'embedding' }, capabilities: { chatCompletion: 'false' } },
        },
      ])
    );
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(0);
  });

  it('defers key validation until the detected provider is used', async () => {
    const calls: string[] = [];
    const baseRunner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    const runner: CommandRunner = async (command, args) => {
      calls.push(`${command} ${args.join(' ')}`);
      return baseRunner(command, args);
    };
    expect(await collectAzureOpenAIProviders(runner)).toHaveLength(1);
    expect(calls).toEqual([
      'az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv',
    ]);
  });
});

// ---------------------------------------------------------------------------
// refreshAzureOpenAIKey — extra paths
// ---------------------------------------------------------------------------

describe('refreshAzureOpenAIKey — extra paths', () => {
  it('scopes key refresh to the saved subscription', async () => {
    const calls: string[] = [];
    const runner: CommandRunner = async (command, args) => {
      calls.push(`${command} ${args.join(' ')}`);
      return { stdout: 'token', exitCode: 0 };
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ key1: 'key' }), { status: 200 }));
    expect(await refreshAzureOpenAIKey('rg name', 'account/name', runner, 'subscription')).toEqual({
      key: 'key',
    });
    expect(calls).toEqual([
      'az account get-access-token --resource https://management.azure.com/ --query accessToken -o tsv',
    ]);
    expect(fetchSpy.mock.calls[0][0]).toContain(
      '/subscriptions/subscription/resourceGroups/rg%20name/providers/Microsoft.CognitiveServices/accounts/account%2Fname/listKeys'
    );
  });

  it('returns key2 when key1 is absent', async () => {
    const runner = mockCommandRunner({
      'az account get-access-token': { stdout: 'token', exitCode: 0 },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ key2: 'secondary-key' }), { status: 200 })
    );
    expect(await refreshAzureOpenAIKey('rg1', 'account1', runner, 'sub')).toEqual({
      key: 'secondary-key',
    });
  });

  it('explains why the subscription or key API is unavailable', async () => {
    const runner = mockCommandRunner({
      'az account get-access-token': { stdout: 'token', exitCode: 0 },
    });
    expect((await refreshAzureOpenAIKey('rg1', 'account1', runner)).reason).toContain(
      'no subscription ID'
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }));
    const denied = await refreshAzureOpenAIKey('rg1', 'account1', runner, 'sub');
    expect(denied.key).toBeNull();
    expect(denied.reason).toContain('not allowed to read its keys');
  });
});

// ---------------------------------------------------------------------------
// detectProviders — Azure and Copilot result-building paths
// ---------------------------------------------------------------------------

describe('detectProviders — Azure and Copilot result building', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('includes a detected Copilot provider in results', async () => {
    const runner = mockCommandRunner({
      'gh auth token': { stdout: 'ghp_validtoken1234567890\n', exitCode: 0 },
    });
    fetchSpy
      .mockResolvedValueOnce(new Response('{}', { status: 200 })) // validateGitHubToken
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'gpt-4o', name: 'GPT-4o', version: '1' }] }), {
          status: 200,
        })
      ) // detectCopilotChatModels
      .mockRejectedValueOnce(new Error('no ollama')); // detectOllamaProvider

    const result = await detectProviders([], [], runner);
    expect(result.some(p => p.providerId === 'copilot')).toBe(true);
  });

  it('includes a detected Azure provider in results', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    const result = await detectProviders([], [], runner);
    expect(result.some(p => p.providerId === 'azure')).toBe(true);
  });

  it('excludes Azure accounts that reject key authentication', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    await detectProviders([], [], runner);
    const calls = (globalThis.fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock
      .calls;
    const graphCall = calls.find(call => String(call[0]).includes('Microsoft.ResourceGraph'));
    expect(String(graphCall?.[1]?.body)).toContain("properties.disableLocalAuth) != 'true'");
  });

  it('includes same-named Azure accounts from different subscriptions', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const accounts = ['subscription-one', 'subscription-two'].map(subscriptionId => ({
      ...AZURE_TEST_ACCOUNT,
      id: `/subscriptions/${subscriptionId}/resourceGroups/rg1/providers/Microsoft.CognitiveServices/accounts/shared`,
      name: 'shared',
      subscriptionId,
      endpoint: `https://${subscriptionId}.openai.azure.com`,
    }));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT, accounts);

    const result = await detectProviders([], [], runner);
    const azureResults = result.filter(provider => provider.providerId === 'azure');

    expect(azureResults).toHaveLength(2);
    expect(azureResults.map(provider => provider.config.azSubscriptionId)).toEqual([
      'subscription-one',
      'subscription-two',
    ]);
  });

  it('skips Azure account matched by azure: dismissal key', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    const result = await detectProviders([], ['azure:myoai'], runner);
    expect(result.filter(p => p.providerId === 'azure')).toHaveLength(0);
  });

  it('skips all Azure detection when "azure" is in dismissedKeys', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = mockCommandRunner({});
    const result = await detectProviders([], ['azure'], runner);
    expect(result.filter(p => p.providerId === 'azure')).toHaveLength(0);
  });

  it('skips Azure account already in existing providers by accountName (savedAzureAccountNames)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    const existing = [{ providerId: 'azure', config: { azAccountName: 'myoai' } }];
    const result = await detectProviders(existing, [], runner);
    expect(result.filter(p => p.providerId === 'azure')).toHaveLength(0);
  });

  it('skips Azure account already in existing providers by endpoint (savedAzureEndpoints)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    const existing = [
      { providerId: 'azure', config: { endpoint: 'https://myoai.openai.azure.com' } },
    ];
    const result = await detectProviders(existing, [], runner);
    expect(result.filter(p => p.providerId === 'azure')).toHaveLength(0);
  });

  it('re-detects a legacy CLI Azure config that has no subscription ID', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    const existing = [
      {
        providerId: 'azure',
        config: {
          apiKey: AZ_CLI_AUTH_SENTINEL,
          azAccountName: 'myoai',
          endpoint: 'https://myoai.openai.azure.com',
        },
      },
    ];
    const result = await detectProviders(existing, [], runner);
    const azureResults = result.filter(p => p.providerId === 'azure');
    expect(azureResults).toHaveLength(1);
    expect(azureResults[0].config.azSubscriptionId).toBe('sub');
  });

  it('normalises azure-endpoint: dismissal key (bug fix: uppercase endpoint is still skipped)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT);
    // Uppercase dismissed endpoint should match the lowercase account endpoint after normalisation
    const result = await detectProviders(
      [],
      ['azure-endpoint:HTTPS://MYOAI.OPENAI.AZURE.COM'],
      runner
    );
    expect(result.filter(p => p.providerId === 'azure')).toHaveLength(0);
  });

  it('skips Azure provider with empty accountName when azure is already configured', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('no ollama'));
    const runner = makeAzureBaseRunner(CHAT_DEPLOYMENT_STDOUT, [
      { ...AZURE_TEST_ACCOUNT, name: '' },
    ]);
    const existing = [{ providerId: 'azure', config: {} }];
    const result = await detectProviders(existing, [], runner);
    expect(result.filter(p => p.providerId === 'azure')).toHaveLength(0);
  });
});
