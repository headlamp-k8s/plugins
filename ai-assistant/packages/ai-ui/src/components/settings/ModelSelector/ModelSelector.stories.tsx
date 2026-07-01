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

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import ModelSelector from './ModelSelector';

export default {
  title: 'AI UI/ModelSelector',
  component: ModelSelector,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof ModelSelector>> = args => (
  <ModelSelector {...args} />
);

/** Default state with no saved providers and no auto-detect. */
export const Empty = Template.bind({});
Empty.args = {
  selectedProvider: '',
  config: {},
  savedConfigs: { providers: [] },
  isConfigView: true,
  onChange: changes => console.log('Changed:', changes),
};

/** With auto-detect button visible (idle state). */
export const WithAutoDetect = Template.bind({});
WithAutoDetect.args = {
  selectedProvider: '',
  config: {},
  savedConfigs: { providers: [] },
  isConfigView: true,
  onChange: changes => console.log('Changed:', changes),
  onAutoDetect: () => console.log('Auto-detect triggered'),
  autoDetecting: false,
};

/** Auto-detect in progress (button shows "Detecting…" with spinner). */
export const AutoDetecting = Template.bind({});
AutoDetecting.args = {
  selectedProvider: '',
  config: {},
  savedConfigs: { providers: [] },
  isConfigView: true,
  onChange: changes => console.log('Changed:', changes),
  onAutoDetect: () => console.log('Auto-detect triggered'),
  autoDetecting: true,
};

/** With a saved Copilot provider configuration. */
export const WithCopilotProvider = Template.bind({});
WithCopilotProvider.args = {
  selectedProvider: 'copilot',
  config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
  savedConfigs: {
    providers: [
      {
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

/** With multiple saved providers. */
export const WithMultipleProviders = Template.bind({});
WithMultipleProviders.args = {
  selectedProvider: 'openai',
  config: { apiKey: 'sk-example', model: 'gpt-4o' },
  savedConfigs: {
    providers: [
      {
        providerId: 'openai',
        displayName: 'OpenAI',
        config: { apiKey: 'sk-example', model: 'gpt-4o' },
      },
      {
        providerId: 'copilot',
        displayName: 'GitHub Copilot',
        config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
      },
      {
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
