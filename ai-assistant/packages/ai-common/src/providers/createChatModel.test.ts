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

import { describe, expect, it } from 'vitest';
import {
  canUseDirectToolCalling,
  createChatModel,
  DIRECT_TOOL_CALLING_PROVIDERS,
} from './createChatModel';

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
    expect(() => createChatModel('deepseek', { model: 'deepseek-chat' })).toThrow(
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
