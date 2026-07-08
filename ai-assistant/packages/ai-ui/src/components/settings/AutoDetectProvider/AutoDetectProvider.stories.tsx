import type { DetectedProvider } from '@headlamp-k8s/ai-common/providers/detectProvider';
import type { Meta, StoryFn } from '@storybook/react';
import { type AutoDetectDialogProps, AutoDetectProvider } from './AutoDetectProvider';

export default {
  title: 'AI UI/AutoDetectProvider',
  component: AutoDetectProvider,
} as Meta;

export const sampleDetectedProviders: DetectedProvider[] = [
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

const Template: StoryFn<AutoDetectDialogProps> = args => <AutoDetectProvider {...args} />;

/** Dialog shown with multiple detected providers. */
export const withDetectedProvidersArgs: AutoDetectDialogProps = {
  detectedProviders: sampleDetectedProviders,
  showDetectedDialog: true,
  setShowDetectedDialog: (show: boolean) => console.log('Show dialog:', show),
  handleAddDetectedProviders: providers => console.log('Add:', providers),
  handleDismissDetectedProviders: providers => console.log('Dismiss:', providers),
};
export const WithDetectedProviders = Template.bind({});
WithDetectedProviders.args = withDetectedProvidersArgs;

/** Dialog shown with a single provider. */
export const singleProviderArgs: AutoDetectDialogProps = {
  ...withDetectedProvidersArgs,
  detectedProviders: [sampleDetectedProviders[0]],
};
export const SingleProvider = Template.bind({});
SingleProvider.args = singleProviderArgs;

/** Dialog hidden (not detecting). */
export const hiddenArgs: AutoDetectDialogProps = {
  detectedProviders: [],
  showDetectedDialog: false,
  setShowDetectedDialog: () => {},
  handleAddDetectedProviders: () => {},
  handleDismissDetectedProviders: () => {},
};
export const Hidden = Template.bind({});
Hidden.args = hiddenArgs;
