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

import type { Meta, StoryObj } from '@storybook/react';
import ModelSelector, { type ModelSelectorProps } from './ModelSelector';

const meta = {
  title: 'AI UI/ModelSelector',
  component: ModelSelector,
} satisfies Meta<typeof ModelSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Default state with no saved providers and no auto-detect. */
export const emptyArgs: ModelSelectorProps = {
  selectedProvider: '',
  config: {},
  savedConfigs: { providers: [] },
  isConfigView: true,
  onChange: changes => console.log('Changed:', changes),
};
export const Empty: Story = { args: emptyArgs };

/** With auto-detect button visible (idle state). */
export const withAutoDetectArgs: ModelSelectorProps = {
  selectedProvider: '',
  config: {},
  savedConfigs: { providers: [], termsAccepted: true },
  isConfigView: true,
  onChange: changes => console.log('Changed:', changes),
  onAutoDetect: () => console.log('Auto-detect triggered'),
  autoDetecting: false,
};
export const WithAutoDetect: Story = { args: withAutoDetectArgs };

/** Auto-detect in progress (button shows "Detecting…" with spinner). */
export const autoDetectingArgs: ModelSelectorProps = {
  selectedProvider: '',
  config: {},
  savedConfigs: { providers: [], termsAccepted: true },
  isConfigView: true,
  onChange: changes => console.log('Changed:', changes),
  onAutoDetect: () => console.log('Auto-detect triggered'),
  autoDetecting: true,
};
export const AutoDetecting: Story = { args: autoDetectingArgs };

/** With a saved Copilot provider configuration. */
export const withCopilotProviderArgs: ModelSelectorProps = {
  selectedConfigId: 'copilot-primary',
  selectedProvider: 'copilot',
  config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
  savedConfigs: {
    providers: [
      {
        id: 'copilot-primary',
        providerId: 'copilot',
        displayName: 'GitHub Copilot',
        config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
      },
    ],
    defaultProviderIndex: 0,
    termsAccepted: true,
  },
  isConfigView: true,
  onChange: changes => console.log('Changed:', changes),
  onAutoDetect: () => console.log('Auto-detect triggered'),
};
export const WithCopilotProvider: Story = { args: withCopilotProviderArgs };

/** With multiple saved providers. */
export const withMultipleProvidersArgs: ModelSelectorProps = {
  selectedConfigId: 'openai-primary',
  selectedProvider: 'openai',
  config: { apiKey: 'sk-example', model: 'gpt-4o' },
  savedConfigs: {
    providers: [
      {
        id: 'openai-primary',
        providerId: 'openai',
        displayName: 'OpenAI',
        config: { apiKey: 'sk-example', model: 'gpt-4o' },
      },
      {
        id: 'copilot-primary',
        providerId: 'copilot',
        displayName: 'GitHub Copilot',
        config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
      },
      {
        id: 'local-ollama',
        providerId: 'local',
        displayName: 'Ollama (llama3)',
        config: { baseUrl: 'http://localhost:11434', model: 'llama3' },
      },
    ],
    defaultProviderIndex: 0,
    termsAccepted: true,
  },
  isConfigView: true,
  onChange: changes => console.log('Changed:', changes),
  onAutoDetect: () => console.log('Auto-detect triggered'),
};
export const WithMultipleProviders: Story = { args: withMultipleProvidersArgs };

/** Legacy persisted data without IDs, retained for migration compatibility coverage. */
export const legacyMultipleProvidersArgs: ModelSelectorProps = {
  ...withMultipleProvidersArgs,
  selectedConfigId: undefined,
  savedConfigs: {
    ...withMultipleProvidersArgs.savedConfigs,
    providers: withMultipleProvidersArgs.savedConfigs.providers?.map(
      ({ id: _id, ...provider }) => provider
    ),
  },
};
export const LegacyMultipleProviders: Story = { args: legacyMultipleProvidersArgs };
