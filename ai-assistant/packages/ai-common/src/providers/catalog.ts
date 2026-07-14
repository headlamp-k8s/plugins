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
 * Describes one configurable input for a model provider.
 */
export interface ModelField {
  /** Unique field key stored in provider configuration. */
  name: string;
  /** Label shown for the field in the UI. */
  label: string;
  /** Input control type used to render the field. */
  type: 'text' | 'select' | 'number';
  /** Whether the field must be provided by the user. */
  required: boolean;
  /** Optional placeholder text shown before input. */
  placeholder?: string;
  /** Allowed values for select fields. */
  options?: string[];
  /** Default value used when creating a new config. */
  default?: string | number;
  /** Short helper text describing the field. */
  description?: string;
}

/**
 * Describes a supported AI model provider.
 */
export interface ModelProvider {
  /** Stable provider identifier stored in settings. */
  id: string;
  /** Human-readable provider name. */
  name: string;
  /** Icon identifier used in provider pickers. */
  icon: string;
  /** Fields required to configure the provider. */
  fields: ModelField[];
  /** Optional curated list of supported model names. */
  models?: string[];
  /** Short provider description shown in the UI. */
  description?: string;
}

/**
 * Registry of supported model providers and their configuration fields.
 */
export const modelProviders: ModelProvider[] = [
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    icon: 'ai-providers:copilot',
    description: 'Integration with GitHub Copilot via GitHub CLI authentication',
    fields: [
      {
        name: 'apiKey',
        label: 'GitHub Token',
        type: 'text',
        required: true,
        placeholder: 'ghp_... or use Auto Detect',
        description:
          'GitHub personal access token. Use Auto Detect to authenticate via the gh CLI.',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          'gpt-5.4',
          'gpt-5.2',
          'gpt-5.1',
          'gpt-4.1',
          'gpt-4o',
          'gpt-4o-mini',
          'o4-mini',
          'o3',
          'o3-mini',
          'o1',
          'o1-mini',
          'claude-sonnet-4',
          'claude-3.5-sonnet',
          'claude-3.5-haiku',
        ],
        default: 'gpt-4o',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'ai-providers:openai',
    description: 'Integration with OpenAI API (GPT models)',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'sk-...',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          'gpt-5.4',
          'gpt-5.4-mini',
          'gpt-5.2',
          'gpt-5.1',
          'gpt-5.1-mini',
          'gpt-4.1',
          'gpt-4.1-mini',
          'gpt-4o',
          'gpt-4o-mini',
          'o4-mini',
          'o3',
          'o3-mini',
          'o1',
          'o1-mini',
        ],
        default: 'gpt-4.1',
      },
    ],
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    icon: 'ai-providers:azure',
    description: 'Integration with Azure OpenAI Service',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your Azure OpenAI API key',
      },
      {
        name: 'endpoint',
        label: 'Endpoint',
        type: 'text',
        required: true,
        placeholder: 'https://your-resource.openai.azure.com',
        description:
          'The base URL of your Azure OpenAI resource (e.g. https://your-resource.openai.azure.com). Do NOT include any path like /openai/v1/chat/completions.',
      },
      {
        name: 'deploymentName',
        label: 'Deployment Name',
        type: 'text',
        required: true,
        placeholder: 'Your deployment name',
        description: 'The name of your model deployment in Azure',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          'gpt-5.4',
          'gpt-5.2',
          'gpt-5.1',
          'gpt-4.1',
          'gpt-4.1-mini',
          'gpt-4o',
          'gpt-4o-mini',
          'o4-mini',
          'o3',
          'o3-mini',
        ],
        default: 'gpt-4o',
        description: 'The model used by your Azure OpenAI deployment',
      },
    ],
    models: [
      'gpt-5.4',
      'gpt-5.2',
      'gpt-5.1',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4o',
      'gpt-4o-mini',
      'o4-mini',
      'o3',
      'o3-mini',
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'ai-providers:anthropic',
    description: 'Integration with Anthropic Claude models',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'sk-ant-...',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          'claude-opus-4-6',
          'claude-sonnet-4-6',
          'claude-haiku-4-5-20251001',
          'claude-3-7-sonnet-20250219',
        ],
        default: 'claude-sonnet-4-6',
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: 'ai-providers:mistral',
    description: 'Integration with Mistral AI models',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your Mistral API key',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          'mistral-large-latest',
          'mistral-medium-latest',
          'mistral-small-latest',
          'magistral-medium-2507',
          'magistral-small-2507',
          'codestral-latest',
        ],
        default: 'mistral-large-latest',
      },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'ai-providers:google',
    description: 'Integration with Google Gemini models',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your Google API key',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: [
          'gemini-3-pro-preview',
          'gemini-2.5-pro',
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite',
        ],
        default: 'gemini-2.5-flash',
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: 'ai-providers:deepseek',
    description: 'Integration with DeepSeek models',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your DeepSeek API key',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        required: true,
        options: ['deepseek-chat', 'deepseek-reasoner'],
        default: 'deepseek-chat',
      },
    ],
  },
  {
    id: 'vllm',
    name: 'vLLM (OpenAI-compatible)',
    icon: 'ai-providers:local',
    description: 'Integration with vLLM or any OpenAI-compatible endpoint',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: false,
        placeholder: 'sk-noop (leave blank if vLLM has no auth)',
      },
      {
        name: 'baseUrl',
        label: 'Base URL',
        type: 'text',
        required: true,
        placeholder: 'http://vllm-server:8000/v1',
        description: 'Full URL including /v1 — e.g. http://host:8000/v1',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'text',
        required: true,
        placeholder: 'meta-llama/Llama-3.1-8B-Instruct',
        description: 'Must match --served-model-name passed to vLLM',
      },
    ],
  },
  {
    id: 'local',
    name: 'Local Models',
    icon: 'ai-providers:local',
    description: 'Integration with locally hosted models (Ollama or similar)',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: false,
        placeholder: 'Your Local Model API key',
      },
      {
        name: 'baseUrl',
        label: 'Base URL',
        type: 'text',
        required: true,
        placeholder: 'http://localhost:11434',
        default: 'http://localhost:11434',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'text',
        required: true,
        placeholder: 'llama3.1',
        default: 'llama3.1',
      },
    ],
    models: [
      'llama3.1',
      'llama3.2',
      'deepseek-r1',
      'gemma3',
      'gemma2',
      'mistral',
      'qwen3',
      'qwen2.5',
      'phi4',
      'phi3',
    ],
  },
  {
    id: 'mock-testing-model',
    name: 'Mock Testing Model',
    icon: 'mdi:test-tube',
    description:
      'A canned-response model for automated tests, CI, and scripted demos — no API key or network required',
    fields: [
      {
        name: 'fixturesDir',
        label: 'Custom Fixtures Directory',
        type: 'text',
        required: false,
        placeholder: '/path/to/custom/fixtures',
        description: 'Optional path to a directory of extra .json fixture files',
      },
      {
        name: 'sequenceName',
        label: 'Demo Sequence',
        type: 'text',
        required: false,
        placeholder: 'cluster-exploration-demo',
        description:
          'Name of a conversation sequence to play back in order (leave empty for template matching)',
      },
    ],
  },
];

/**
 * Returns the provider definition for the given identifier.
 *
 * @param id - Stable provider identifier to find.
 * @returns The matching provider definition, or `undefined` when it is unknown.
 */
export function getProviderById(id: string): ModelProvider | undefined {
  return modelProviders.find(provider => provider.id === id);
}

/**
 * Returns the configuration fields for a provider.
 *
 * @param providerId - Stable provider identifier whose fields should be returned.
 * @returns The provider's configuration fields, or an empty array when it is unknown.
 */
export function getProviderFields(providerId: string): ModelField[] {
  const provider = getProviderById(providerId);
  return provider ? provider.fields : [];
}

/**
 * Returns default field values for a provider configuration.
 *
 * @param providerId - Stable provider identifier whose defaults should be collected.
 * @returns Default values keyed by field name, excluding fields without defaults.
 */
export function getDefaultConfig(providerId: string): Record<string, string | number> {
  const fields = getProviderFields(providerId);
  const config: Record<string, string | number> = {};

  fields.forEach(field => {
    if (field.default !== undefined) {
      config[field.name] = field.default;
    }
  });

  return config;
}
