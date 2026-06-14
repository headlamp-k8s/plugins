import type { DetectedProvider } from '@headlamp-k8s/ai-common/providers/providerAutoDetect';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { AutoDetectProvider } from './AutoDetectProvider';

export default {
  title: 'AI UI/AutoDetectProvider',
  component: AutoDetectProvider,
} as Meta;

const sampleProviders: DetectedProvider[] = [
  {
    providerId: 'copilot',
    source: 'GitHub CLI',
    displayName: 'GitHub Copilot',
    config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
  },
  {
    providerId: 'local',
    source: 'Ollama',
    displayName: 'Ollama (llama3)',
    config: { baseUrl: 'http://localhost:11434', model: 'llama3' },
  },
  {
    providerId: 'azure',
    source: 'Azure CLI',
    displayName: 'Azure OpenAI (myaccount)',
    config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'myaccount', model: 'gpt-4o' },
  },
];

type AutoDetectProviderProps = React.ComponentProps<typeof AutoDetectProvider>;
const Template: StoryFn<AutoDetectProviderProps> = args => <AutoDetectProvider {...args} />;

/** Dialog shown with multiple detected providers. */
export const WithDetectedProviders = Template.bind({});
WithDetectedProviders.args = {
  detectedProviders: sampleProviders,
  showDetectedDialog: true,
  setShowDetectedDialog: (show: boolean) => console.log('Show dialog:', show),
  handleAddDetectedProviders: providers => console.log('Add:', providers),
  handleDismissDetectedProviders: providers => console.log('Dismiss:', providers),
};

/** Dialog shown with a single provider. */
export const SingleProvider = Template.bind({});
SingleProvider.args = {
  detectedProviders: [sampleProviders[0]],
  showDetectedDialog: true,
  setShowDetectedDialog: (show: boolean) => console.log('Show dialog:', show),
  handleAddDetectedProviders: providers => console.log('Add:', providers),
  handleDismissDetectedProviders: providers => console.log('Dismiss:', providers),
};

/** Dialog hidden (not detecting). */
export const Hidden = Template.bind({});
Hidden.args = {
  detectedProviders: [],
  showDetectedDialog: false,
  setShowDetectedDialog: () => {},
  handleAddDetectedProviders: () => {},
  handleDismissDetectedProviders: () => {},
};
