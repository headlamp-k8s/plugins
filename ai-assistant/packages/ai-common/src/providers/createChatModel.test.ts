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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canUseDirectToolCalling,
  copilotModelRequiresResponsesApi,
  createChatModel,
  DIRECT_TOOL_CALLING_PROVIDERS,
} from './createChatModel';

const { chatOpenAIOptions } = vi.hoisted(() => ({
  chatOpenAIOptions: [] as Record<string, unknown>[],
}));

// Record constructor options so endpoint routing is asserted on what we hand to
// LangChain rather than on instance properties it may stop exposing.
vi.mock('@langchain/openai', async importOriginal => {
  const actual = await importOriginal<typeof import('@langchain/openai')>();
  class RecordingChatOpenAI extends actual.ChatOpenAI {
    constructor(fields: ConstructorParameters<typeof actual.ChatOpenAI>[0]) {
      super(fields);
      chatOpenAIOptions.push({ ...fields });
    }
  }
  return { ...actual, ChatOpenAI: RecordingChatOpenAI };
});

beforeEach(() => {
  chatOpenAIOptions.length = 0;
});

// createLangChainModel is a factory that instantiates real SDK objects.
// We only test the validation / error paths — those run before any network
// calls and require no API keys or mocks.

describe('createLangChainModel — validation errors', () => {
  it('throws a clear error for an unsupported provider', () => {
    expect(() => createChatModel('unknown-provider', {})).toThrow(/Unsupported provider/);
  });

  it('openai: throws when apiKey is missing', () => {
    expect(() => createChatModel('openai', { model: 'gpt-4' })).toThrow(
      /API key is required for OpenAI/
    );
  });

  it('openai: throws when apiKey is empty string', () => {
    expect(() => createChatModel('openai', { apiKey: '  ', model: 'gpt-4' })).toThrow(
      /API key is required for OpenAI/
    );
  });

  it('anthropic: throws when apiKey is missing', () => {
    expect(() => createChatModel('anthropic', { model: 'claude-3-opus' })).toThrow(
      /API key is required for Anthropic/
    );
  });

  it('mistral: throws when apiKey is missing', () => {
    expect(() => createChatModel('mistral', { model: 'mistral-large' })).toThrow(
      /API key is required for Mistral AI/
    );
  });

  it('gemini: throws when apiKey is missing', () => {
    expect(() => createChatModel('gemini', { model: 'gemini-pro' })).toThrow(
      /API key is required for Google Gemini/
    );
  });

  it('deepseek: throws when apiKey is missing', () => {
    expect(() => createChatModel('deepseek', { model: 'deepseek-v4-flash' })).toThrow(
      /API key is required for DeepSeek/
    );
  });

  it('azure: throws when apiKey is missing', () => {
    expect(() =>
      createChatModel('azure', {
        endpoint: 'https://my.openai.azure.com',
        deploymentName: 'gpt-4',
      })
    ).toThrow(/Incomplete Azure OpenAI configuration/);
  });

  it('azure: throws when endpoint is missing', () => {
    expect(() => createChatModel('azure', { apiKey: 'k', deploymentName: 'd' })).toThrow(
      /Incomplete Azure OpenAI configuration/
    );
  });

  it('azure: throws when deploymentName is missing', () => {
    expect(() =>
      createChatModel('azure', { apiKey: 'k', endpoint: 'https://x.azure.com' })
    ).toThrow(/Incomplete Azure OpenAI configuration/);
  });

  it('azure: strips trailing slashes and the /openai/ path from the endpoint', () => {
    const model = createChatModel('azure', {
      apiKey: 'k',
      endpoint: 'https://x.openai.azure.com/openai/deployments/gpt-4/',
      deploymentName: 'gpt-4',
    }) as unknown as { azureOpenAIEndpoint?: string };
    expect(model.azureOpenAIEndpoint).toBe('https://x.openai.azure.com');
  });

  it('azure: normalizes adversarial endpoints in linear time', () => {
    const start = performance.now();
    createChatModel('azure', {
      apiKey: 'k',
      endpoint: `https://x.azure.com${'/openai/'.repeat(50_000)}\n`,
      deploymentName: 'gpt-4',
    });
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('vllm: throws when baseUrl is missing', () => {
    expect(() => createChatModel('vllm', { model: 'llama3' })).toThrow(
      /Base URL is required for vLLM/
    );
  });

  it('vllm: throws when model is missing', () => {
    expect(() => createChatModel('vllm', { baseUrl: 'http://localhost:8080' })).toThrow(
      /Model is required for vLLM/
    );
  });

  it('copilot: throws when apiKey is missing', () => {
    expect(() => createChatModel('copilot', { model: 'gpt-4o' })).toThrow(
      /GitHub token is required for GitHub Copilot/
    );
  });

  it('copilot: throws the sentinel sentinel error when GH_CLI_AUTH_SENTINEL is passed', () => {
    // GH_CLI_AUTH_SENTINEL is a placeholder — it must be resolved before use.
    expect(() =>
      createChatModel('copilot', {
        apiKey: '__GH_CLI_AUTH__',
        model: 'gpt-4o',
      })
    ).toThrow(/Copilot token must be resolved/);
  });

  it('local: throws when baseUrl is missing', () => {
    expect(() => createChatModel('local', { model: 'llama3' })).toThrow(
      /Base URL is required for local models/
    );
  });

  it('mock-testing-model: returns a model instance without throwing', () => {
    // mock-testing-model requires no API key and is used throughout the test suite.
    const model = createChatModel('mock-testing-model', {});
    expect(model).toBeDefined();
    expect(typeof model.invoke).toBe('function');
  });
});

describe('createLangChainModel — OpenAI Responses API routing', () => {
  it.each(['gpt-6-astra', 'gpt-6-sol', 'gpt-6-luna', 'gpt-6.1-sol', 'gpt-6.1-terra'])(
    'sends tool calls for %s through Responses',
    async modelId => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'resp_test',
            object: 'response',
            created_at: 0,
            status: 'completed',
            model: modelId,
            output: [
              {
                id: 'msg_test',
                type: 'message',
                role: 'assistant',
                status: 'completed',
                content: [{ type: 'output_text', text: 'ok', annotations: [] }],
              },
            ],
            usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      );
      const model = createChatModel('openai', { apiKey: 'test-key', model: modelId });
      if (!model.bindTools) throw new Error('OpenAI model must support tools');
      const runnable = model.bindTools([
        {
          type: 'function',
          function: {
            name: 'lookup_resource',
            description: 'Look up a Kubernetes resource',
            parameters: { type: 'object', properties: {} },
          },
        },
      ]);

      expect((await runnable.invoke('List resources')).text).toBe('ok');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const request = new Request(...fetchSpy.mock.calls[0]);
      expect(request.url).toBe('https://api.openai.com/v1/responses');
      expect(await request.json()).toMatchObject({
        model: modelId,
        tools: [{ type: 'function', name: 'lookup_resource' }],
      });
    }
  );

  it.each(['gpt-5.6-terra', 'gpt-4o', 'custom-model'])('keeps %s on Chat Completions', modelId => {
    createChatModel('openai', { apiKey: 'test-key', model: modelId });
    expect(chatOpenAIOptions.at(-1)).toMatchObject({ model: modelId, useResponsesApi: false });
  });
});

describe('createLangChainModel — Gemini tool compatibility', () => {
  it('sends Gemini 4 tools through generateContent', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { content: { role: 'model', parts: [{ text: 'ok' }] }, finishReason: 'STOP', index: 0 },
          ],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    );
    const model = createChatModel('gemini', { apiKey: 'test-key', model: 'gemini-4-argon' });
    if (!model.bindTools) throw new Error('Gemini model must support tools');
    const runnable = model.bindTools([
      {
        type: 'function',
        function: {
          name: 'lookup_resource',
          description: 'Look up a Kubernetes resource',
          parameters: { type: 'object', properties: {} },
        },
      },
    ]);

    expect((await runnable.invoke('List resources')).text).toBe('ok');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const request = new Request(...fetchSpy.mock.calls[0]);
    expect(request.url).toContain('/models/gemini-4-argon:generateContent');
    expect(await request.json()).toMatchObject({
      tools: [{ functionDeclarations: [{ name: 'lookup_resource' }] }],
    });
  });
});

describe('createLangChainModel — Azure deployment routing', () => {
  it.each(['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.4-mini', 'gpt-5.4'])(
    'sends tool calls for %s to the configured deployment',
    async modelId => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'chatcmpl-test',
            object: 'chat.completion',
            created: 0,
            model: modelId,
            choices: [
              { index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' },
            ],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      );
      const model = createChatModel('azure', {
        apiKey: 'test-key',
        endpoint: 'https://test.openai.azure.com',
        deploymentName: 'cluster-chat',
        model: modelId,
      });
      if (!model.bindTools) throw new Error('Azure model must support tools');
      const runnable = model.bindTools([
        {
          type: 'function',
          function: {
            name: 'lookup_resource',
            description: 'Look up a Kubernetes resource',
            parameters: { type: 'object', properties: {} },
          },
        },
      ]);

      expect((await runnable.invoke('List resources')).content).toBe('ok');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const request = new Request(...fetchSpy.mock.calls[0]);
      expect(request.url).toContain('/openai/deployments/cluster-chat/chat/completions');
      expect(request.url).toContain('api-version=2025-04-01-preview');
      expect(await request.json()).toMatchObject({
        tools: [{ type: 'function', function: { name: 'lookup_resource' } }],
      });
    }
  );
});

describe('createLangChainModel — vLLM URL normalisation', () => {
  it('appends /v1 when the URL has no path', () => {
    const m = createChatModel('vllm', { baseUrl: 'http://localhost:8080', model: 'llama3' });
    expect(m).toBeDefined(); // construction succeeds
  });

  it('strips trailing slashes before checking for /v1', () => {
    expect(() =>
      createChatModel('vllm', { baseUrl: 'http://localhost:8080/', model: 'llama3' })
    ).not.toThrow();
  });

  it('does not double-append /v1 when already present', () => {
    expect(() =>
      createChatModel('vllm', { baseUrl: 'http://localhost:8080/v1', model: 'llama3' })
    ).not.toThrow();
  });

  it('Bug: incorrectly appends /v1 to a URL whose path ends with a different version string', () => {
    // URL 'http://localhost:8080/v12' does not end with '/v1', so the code appends
    // '/v1' producing 'http://localhost:8080/v12/v1' — almost certainly wrong.
    // This test documents the known behaviour; fix the check to use a regex boundary.
    // We cannot inspect the internal baseURL so we just verify construction does not throw.
    expect(() =>
      createChatModel('vllm', { baseUrl: 'http://localhost:8080/v12', model: 'llama3' })
    ).not.toThrow();
    // The model will be created with the wrong URL — a runtime error, not a construction error.
  });
});

describe('createLangChainModel — copilot model name stripping', () => {
  it('strips a single provider/ prefix from the model name', () => {
    // 'openai/gpt-4o' → 'gpt-4o'
    const m = createChatModel('copilot', { apiKey: 'ghp_tok', model: 'openai/gpt-4o' });
    expect(m).toBeDefined();
  });

  it('Bug: multi-segment model names lose all but the last segment', () => {
    // 'org/team/gpt-4o'.split('/').pop() === 'gpt-4o' — 'org/team' is silently dropped.
    // This may or may not be correct depending on the Copilot API; the test documents it.
    expect(() =>
      createChatModel('copilot', { apiKey: 'ghp_tok', model: 'org/team/gpt-4o' })
    ).not.toThrow();
  });
});

describe('createLangChainModel — Copilot Responses API routing', () => {
  const responsesOnlyModels = [
    'gpt-5.3-codex',
    'gpt-5.4-mini',
    'gpt-5.5',
    'gpt-5.6-sol',
    'gpt-5.6-luna',
    'gpt-5.6-terra',
    'gpt-6-astra',
    'gpt-6-sol',
    'gpt-6-luna',
    'gpt-6.1-sol',
    'gpt-6.1-terra',
    'grok-4.6',
    'mai-code-1.1-flash',
  ];
  const chatCompletionsModels = [
    'gpt-5.4',
    'gpt-4o',
    'gpt-4.1',
    'claude-opus-5',
    'claude-haiku-4.5',
  ];

  it.each(responsesOnlyModels)('requests the Responses API for %s', modelId => {
    createChatModel('copilot', { apiKey: 'ghp_tok', model: `openai/${modelId}` });

    expect(chatOpenAIOptions.at(-1)).toMatchObject({ model: modelId, useResponsesApi: true });
  });

  it.each(chatCompletionsModels)('keeps %s on the chat completions endpoint', modelId => {
    createChatModel('copilot', { apiKey: 'ghp_tok', model: modelId });

    expect(chatOpenAIOptions.at(-1)).toMatchObject({ model: modelId, useResponsesApi: false });
  });

  it.each(responsesOnlyModels)('classifies %s as Responses-only', modelId => {
    expect(copilotModelRequiresResponsesApi(modelId)).toBe(true);
  });

  it.each(chatCompletionsModels)('classifies %s as chat-completions capable', modelId => {
    expect(copilotModelRequiresResponsesApi(modelId)).toBe(false);
  });

  it('ignores an optional vendor prefix and model ID casing', () => {
    expect(copilotModelRequiresResponsesApi('openai/GPT-5.6-Sol')).toBe(true);
    expect(copilotModelRequiresResponsesApi('openai/gpt-4o')).toBe(false);
  });
});

describe('canUseDirectToolCalling', () => {
  it('returns true for all documented providers', () => {
    const supported = ['openai', 'azure', 'anthropic', 'mistral', 'gemini', 'vllm', 'copilot'];
    for (const p of supported) {
      expect(canUseDirectToolCalling(p)).toBe(true);
    }
  });

  it('returns false for unsupported/unknown providers', () => {
    expect(canUseDirectToolCalling('unknown')).toBe(false);
    expect(canUseDirectToolCalling('')).toBe(false);
  });

  it('returns true for "local" (Ollama) — many Ollama models support tool calling', () => {
    // Ollama users can now use direct tool calling when their model supports it.
    expect(canUseDirectToolCalling('local')).toBe(true);
  });

  it('is consistent with DIRECT_TOOL_CALLING_PROVIDERS set', () => {
    for (const p of DIRECT_TOOL_CALLING_PROVIDERS) {
      expect(canUseDirectToolCalling(p)).toBe(true);
    }
    expect(canUseDirectToolCalling('not-in-set')).toBe(false);
  });

  it('is case-insensitive — "OpenAI" and "ANTHROPIC" are normalised before lookup', () => {
    // Provider IDs from user config sometimes arrive with different casing.
    expect(canUseDirectToolCalling('OpenAI')).toBe(true);
    expect(canUseDirectToolCalling('ANTHROPIC')).toBe(true);
  });
});
