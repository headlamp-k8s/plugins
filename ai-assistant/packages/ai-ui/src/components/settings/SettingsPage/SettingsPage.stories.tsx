import type { Meta, StoryFn } from '@storybook/react';
import type { ConfigStore } from '../MCPSettings/MCPSettings';
import { SettingsPage, type SettingsPageProps } from './SettingsPage';

/** Creates a mock ConfigStore backed by an in-memory object. */
export function createMockStore(initial: Record<string, unknown> = {}): ConfigStore {
  let data = { ...initial };
  return {
    get: () => data,
    update: (patch: unknown) => {
      if (typeof patch === 'object' && patch !== null) data = { ...data, ...patch };
    },
  };
}

export const sampleSettingsTools = [
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
export const emptySettingsArgs: SettingsPageProps = {
  savedConfigs: { providers: [] },
  onConfigsChange: configs => console.log('Configs changed:', configs),
  configStore: createMockStore(),
  tools: sampleSettingsTools,
  isToolEnabled: () => false,
  onToolToggle: id => console.log('Toggle:', id),
  isRunningAsApp: false,
};
export const Empty = Template.bind({});
Empty.args = emptySettingsArgs;

/** With a saved OpenAI provider and all features enabled. */
export const withProviderArgs: SettingsPageProps = {
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
  tools: sampleSettingsTools,
  isToolEnabled: id => ['web-search', 'kubectl'].includes(id),
  onToolToggle: id => console.log('Toggle:', id),
  isRunningAsApp: true,
  previewEnabled: true,
  onPreviewChange: enabled => console.log('Preview:', enabled),
  proactiveDiagnosisEnabled: false,
  onProactiveDiagnosisChange: enabled => console.log('Proactive diagnosis:', enabled),
  onHolmesConfigChange: patch => console.log('Holmes:', patch),
};
export const WithProvider = Template.bind({});
WithProvider.args = withProviderArgs;

/** With auto-detect button in the desktop app after the command runner is ready. */
export const WithAutoDetect = Template.bind({});
WithAutoDetect.args = {
  savedConfigs: { providers: [] },
  onConfigsChange: configs => console.log('Configs changed:', configs),
  configStore: createMockStore(),
  tools: sampleSettingsTools,
  isToolEnabled: () => false,
  onToolToggle: id => console.log('Toggle:', id),
  isRunningAsApp: true,
  commandRunner: async () => ({ stdout: '', exitCode: 0 }),
  dismissedProviders: [],
  onDismissProviders: keys => console.log('Dismissed:', keys),
};

/** With multiple providers and all sections visible. */
export const fullSettingsArgs: SettingsPageProps = {
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
  tools: sampleSettingsTools,
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
  commandRunner: null,
  dismissedProviders: [],
  onDismissProviders: keys => console.log('Dismissed:', keys),
};
export const FullSettings = Template.bind({});
FullSettings.args = fullSettingsArgs;

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
  tools: sampleSettingsTools,
  isToolEnabled: () => true,
  onToolToggle: id => console.log('Toggle:', id),
  isTestMode: true,
  onTestModeChange: enabled => console.log('Test mode:', enabled),
  hasShownConfigPopover: true,
  onResetPopover: () => console.log('Reset popover'),
  previewEnabled: true,
  onPreviewChange: enabled => console.log('Preview:', enabled),
};
