import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import type { ConfigStore } from '../MCPSettings/MCPSettings';
import { SettingsPage, type SettingsPageProps } from './SettingsPage';

/** Creates a mock ConfigStore backed by an in-memory object. */
function createMockStore(initial: Record<string, any> = {}): ConfigStore {
  let data = { ...initial };
  return {
    get: () => data,
    update: (patch: any) => {
      data = { ...data, ...patch };
    },
  };
}

const sampleTools = [
  { id: 'web-search', name: 'Web Search', description: 'Search the web for information' },
  { id: 'code-exec', name: 'Code Execution', description: 'Execute code snippets' },
  { id: 'kubectl', name: 'kubectl', description: 'Execute kubectl commands' },
];

export default {
  title: 'AI UI/SettingsPage',
  component: SettingsPage,
} as Meta;

const Template: StoryFn<SettingsPageProps> = args => <SettingsPage {...args} />;

/** Empty state with no providers configured. */
export const Empty = Template.bind({});
Empty.args = {
  savedConfigs: { providers: [] },
  onConfigsChange: configs => console.log('Configs changed:', configs),
  configStore: createMockStore(),
  tools: sampleTools,
  isToolEnabled: () => false,
  onToolToggle: id => console.log('Toggle:', id),
  isRunningAsApp: false,
};

/** With a saved OpenAI provider and all features enabled. */
export const WithProvider = Template.bind({});
WithProvider.args = {
  savedConfigs: {
    providers: [
      {
        providerId: 'openai',
        displayName: 'OpenAI',
        config: { apiKey: 'sk-test', model: 'gpt-4o' },
      },
    ],
    defaultProviderIndex: 0,
    termsAccepted: true,
  },
  onConfigsChange: configs => console.log('Configs changed:', configs),
  configStore: createMockStore(),
  tools: sampleTools,
  isToolEnabled: id => ['web-search', 'kubectl'].includes(id),
  onToolToggle: id => console.log('Toggle:', id),
  isRunningAsApp: true,
  previewEnabled: true,
  onPreviewChange: enabled => console.log('Preview:', enabled),
  onHolmesConfigChange: patch => console.log('Holmes:', patch),
  aksDocUrl: 'https://learn.microsoft.com/en-us/azure/aks/install',
};

/** With auto-detect button (no command runner). */
export const WithAutoDetect = Template.bind({});
WithAutoDetect.args = {
  savedConfigs: { providers: [] },
  onConfigsChange: configs => console.log('Configs changed:', configs),
  configStore: createMockStore(),
  tools: sampleTools,
  isToolEnabled: () => false,
  onToolToggle: id => console.log('Toggle:', id),
  commandRunner: null,
  dismissedProviders: [],
  onDismissProviders: keys => console.log('Dismissed:', keys),
};

/** With multiple providers and all sections visible. */
export const FullSettings = Template.bind({});
FullSettings.args = {
  savedConfigs: {
    providers: [
      {
        providerId: 'openai',
        displayName: 'OpenAI',
        config: { apiKey: 'sk-test', model: 'gpt-4o' },
      },
      {
        providerId: 'copilot',
        displayName: 'GitHub Copilot',
        config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
      },
    ],
    defaultProviderIndex: 0,
    termsAccepted: true,
  },
  onConfigsChange: configs => console.log('Configs changed:', configs),
  onTermsAccept: configs => console.log('Terms accepted:', configs),
  configStore: createMockStore(),
  tools: sampleTools,
  isToolEnabled: id => id === 'web-search',
  onToolToggle: id => console.log('Toggle:', id),
  isRunningAsApp: true,
  previewEnabled: true,
  onPreviewChange: enabled => console.log('Preview:', enabled),
  isTestMode: false,
  onTestModeChange: enabled => console.log('Test mode:', enabled),
  onHolmesConfigChange: patch => console.log('Holmes:', patch),
  defaultHolmesNamespace: 'default',
  defaultHolmesServiceName: 'holmesgpt-holmes',
  defaultHolmesPort: 80,
  aksDocUrl: 'https://learn.microsoft.com/en-us/azure/aks/install',
  commandRunner: null,
  dismissedProviders: [],
  onDismissProviders: keys => console.log('Dismissed:', keys),
};

/** Test mode active with debug section visible. */
export const TestModeActive = Template.bind({});
TestModeActive.args = {
  savedConfigs: {
    providers: [
      {
        providerId: 'openai',
        displayName: 'OpenAI',
        config: { apiKey: 'sk-test', model: 'gpt-4o' },
      },
    ],
    defaultProviderIndex: 0,
    termsAccepted: true,
  },
  onConfigsChange: configs => console.log('Configs changed:', configs),
  configStore: createMockStore(),
  tools: sampleTools,
  isToolEnabled: () => true,
  onToolToggle: id => console.log('Toggle:', id),
  isTestMode: true,
  onTestModeChange: enabled => console.log('Test mode:', enabled),
  hasShownConfigPopover: true,
  onResetPopover: () => console.log('Reset popover'),
  previewEnabled: true,
  onPreviewChange: enabled => console.log('Preview:', enabled),
};
