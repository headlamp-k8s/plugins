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

import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatOllama } from '@langchain/ollama';
import { AzureChatOpenAI, ChatOpenAI } from '@langchain/openai';
import { GH_CLI_AUTH_SENTINEL } from './detectProvider';
import { createFixtureChatModel } from './langchain/testing/FixtureChatModel';

/**
 * The set of provider IDs recognised by `createChatModel`.
 * Keeping this as a union type means TypeScript can catch typos at call sites.
 */
export type SupportedProviderId =
  | 'openai'
  | 'azure'
  | 'anthropic'
  | 'mistral'
  | 'gemini'
  | 'deepseek'
  | 'vllm'
  | 'copilot'
  | 'local'
  | 'mock-testing-model';

/**
 * Creates a LangChain `BaseChatModel` from a provider ID and configuration map.
 *
 * This is the single source of truth for provider → model mapping shared by
 * assistant sessions and the `headlamp-ai` CLI.
 *
 * The caller is responsible for resolving sentinel API keys (e.g.
 * `GH_CLI_AUTH_SENTINEL`) to real tokens before calling this function.
 *
 * @param providerId - Provider identifier that selects the model implementation.
 * @param config - Provider-specific credentials, endpoints, model, and options.
 * @returns A configured LangChain chat model for the selected provider.
 * @throws When the provider is unsupported or required configuration is missing.
 */
export function createChatModel(
  providerId: string,
  config: Record<string, unknown>
): BaseChatModel {
  /**
   * Normalizes an optional configuration value as a trimmed string.
   *
   * @param v - Configuration value to normalize.
   * @returns The trimmed string, or an empty string for a non-string value.
   */
  const s = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  const verbose = Boolean(config.verbose);
  const c = {
    ...config,
    apiKey: s(config.apiKey),
    endpoint: s(config.endpoint),
    baseUrl: s(config.baseUrl),
    deploymentName: s(config.deploymentName),
    model: s(config.model),
  };

  try {
    switch (providerId) {
      case 'openai':
        if (!c.apiKey) throw new Error('API key is required for OpenAI');
        return new ChatOpenAI({ apiKey: c.apiKey, model: c.model, verbose });

      case 'azure':
        if (!c.apiKey || !c.endpoint || !c.deploymentName)
          throw new Error('Incomplete Azure OpenAI configuration');
        return new AzureChatOpenAI({
          azureOpenAIEndpoint: c.endpoint.replace(/\/+$/, '').replace(/\/openai\/.*$/, ''),
          azureOpenAIApiKey: c.apiKey,
          azureOpenAIApiDeploymentName: c.deploymentName,
          azureOpenAIApiVersion: '2025-04-01-preview',
          model: c.model,
          verbose,
        });

      case 'anthropic':
        if (!c.apiKey) throw new Error('API key is required for Anthropic');
        return new ChatAnthropic({ apiKey: c.apiKey, model: c.model, verbose });

      case 'mistral':
        if (!c.apiKey) throw new Error('API key is required for Mistral AI');
        return new ChatMistralAI({ apiKey: c.apiKey, model: c.model, verbose });

      case 'gemini':
        if (!c.apiKey) throw new Error('API key is required for Google Gemini');
        return new ChatGoogleGenerativeAI({ apiKey: c.apiKey, model: c.model, verbose });

      case 'deepseek':
        if (!c.apiKey) throw new Error('API key is required for DeepSeek');
        return new ChatDeepSeek({ apiKey: c.apiKey, model: c.model, verbose });

      case 'vllm': {
        if (!c.baseUrl) throw new Error('Base URL is required for vLLM');
        if (!c.model) throw new Error('Model is required for vLLM');
        let url = c.baseUrl.replace(/\/+$/, '');
        if (!url.endsWith('/v1')) url = `${url}/v1`;
        return new ChatOpenAI({
          apiKey: c.apiKey || 'sk-noop',
          model: c.model,
          verbose,
          configuration: { baseURL: url },
        });
      }

      case 'copilot': {
        if (!c.apiKey) throw new Error('GitHub token is required for GitHub Copilot');
        if (c.apiKey === GH_CLI_AUTH_SENTINEL)
          throw new Error(
            'Copilot token must be resolved before creating the model. ' +
              'Replace GH_CLI_AUTH_SENTINEL with the real token from `gh auth token`.'
          );
        // Strip optional "provider/" prefix (e.g. "openai/gpt-4o" → "gpt-4o")
        const model = c.model.includes('/') ? c.model.split('/').pop()! : c.model;
        return new ChatOpenAI({
          apiKey: c.apiKey,
          model,
          verbose,
          configuration: { baseURL: 'https://api.githubcopilot.com' },
        });
      }

      case 'local': {
        if (!c.baseUrl) throw new Error('Base URL is required for local models');
        const headers: Record<string, string> = c.apiKey
          ? { Authorization: `Bearer ${c.apiKey}` }
          : {};
        return new ChatOllama({
          baseUrl: c.baseUrl,
          model: c.model,
          verbose,
          headers: Object.keys(headers).length ? headers : undefined,
        });
      }

      case 'mock-testing-model':
        return createFixtureChatModel({
          fixturesDir: (config.fixturesDir as string) || undefined,
          sequenceName: (config.sequenceName as string) || undefined,
        });

      default:
        throw new Error(
          `Unsupported provider: ${providerId}. ` +
            'Supported: openai, azure, anthropic, mistral, gemini, deepseek, vllm, copilot, local, mock-testing-model'
        );
    }
  } catch (err) {
    console.error(`[createLangChainModel] Error creating model for ${providerId}:`, err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Provider capability checks
// ---------------------------------------------------------------------------

/**
 * The set of provider IDs that support direct / native tool calling via the
 * LangChain `bindTools` API.
 *
 * All comparisons are done after lowercasing the input so that provider IDs
 * from user config (e.g. `'OpenAI'`) are handled consistently.
 */
export const DIRECT_TOOL_CALLING_PROVIDERS: ReadonlySet<string> = new Set([
  'openai',
  'azure',
  'anthropic',
  'mistral',
  'gemini',
  'vllm',
  'copilot',
  'local', // Ollama — many models (llama3, qwen2.5, …) support bindTools
]);

/**
 * Returns `true` when `providerId` supports the LangChain direct tool-calling
 * path (i.e. `model.bindTools(...)` + `invoke`).
 *
 * Input is normalised to lower-case so callers with different casing
 * (e.g. `'OpenAI'`, `'ANTHROPIC'`) are handled correctly.
 *
 * @param providerId - Provider identifier to check without case sensitivity.
 * @returns Whether the provider supports native LangChain tool binding.
 */
export function canUseDirectToolCalling(providerId: string): boolean {
  return DIRECT_TOOL_CALLING_PROVIDERS.has(providerId.toLowerCase());
}
