import '../utils/icons';

interface ModelField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
  default?: string | number;
  description?: string;
}

interface ModelProvider {
  id: string;
  name: string;
  icon: string;
  fields: ModelField[];
  models?: string[];
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
