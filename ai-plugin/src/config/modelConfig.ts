
import '../utils/icons';

export interface ModelField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
  default?: string | number;
  description?: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  icon: string;
  fields: ModelField[];
  models: string[];
  description?: string;
}

// Define the available model providers and their configuration fields
export const modelProviders: ModelProvider[] = [
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
          'gpt-4o',
          'gpt-4o-mini',
          'o1-mini',
          'o1',
          'o1-preview',
          'gpt-4-turbo',
          'gpt-4',
          'gpt-3.5-turbo',
        ],
        default: 'gpt-4o',
      },
    ],
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'o1-mini',
      'o1',
      'o1-preview',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
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
        placeholder: 'https://your-resource.openai.azure.com/',
        description: 'The full URL to your Azure OpenAI resource',
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
        options: ['gpt-4o', 'gpt-4', 'gpt-35-turbo', 'gpt-4-turbo', 'o3-mini'],
        default: 'gpt-4',
        description: 'The model used by your Azure OpenAI deployment',
      },
    ],
    models: ['gpt-4o', 'gpt-4', 'gpt-35-turbo', 'gpt-4-turbo'],
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
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
          'claude-2.1',
          'claude-instant-1.2',
        ],
        default: 'claude-3-opus-20240229',
      },
    ],
    models: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-instant-1.2',
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
          'mistral-small',
          'mistral-medium',
          'mistral-large',
          'mistral-embed',
          'mixtral-8x7b',
          'open-mixtral-8x7b',
          'open-mistral-7b',
        ],
        default: 'mistral-medium',
      },
    ],
    models: [
      'mistral-small',
      'mistral-medium',
      'mistral-large',
      'mixtral-8x7b',
      'open-mixtral-8x7b',
      'open-mistral-7b',
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
        options: ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        default: 'gemini-pro',
      },
    ],
    models: ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'local',
    name: 'Local Models',
    icon: 'ai-providers:local',
    description: 'Integration with locally hosted models (Ollama or similar)',
    fields: [
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
        placeholder: 'llama2',
        default: 'llama2',
      },
    ],
    models: ['llama2', 'mistral', 'mixtral', 'phi3', 'gemma'],
  },
];

// Function to get provider by ID
export function getProviderById(id: string): ModelProvider | undefined {
  return modelProviders.find(provider => provider.id === id);
}

// Function to get fields for a specific provider
export function getProviderFields(providerId: string): ModelField[] {
  const provider = getProviderById(providerId);
  return provider ? provider.fields : [];
}

// Function to get default configuration for a provider
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
