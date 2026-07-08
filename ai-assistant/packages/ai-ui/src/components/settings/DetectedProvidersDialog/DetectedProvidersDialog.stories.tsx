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
import type { DetectedProvidersDialogProps } from './DetectedProvidersDialog';
import DetectedProvidersDialog from './DetectedProvidersDialog';

const meta = {
  title: 'AI UI/DetectedProvidersDialog',
  component: DetectedProvidersDialog,
} satisfies Meta<typeof DetectedProvidersDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dialog with multiple detected providers (Copilot, Ollama, Azure). */
export const multipleProvidersArgs: DetectedProvidersDialogProps = {
  open: true,
  onClose: () => undefined,
  onAddProviders: () => undefined,
  onDismiss: () => undefined,
  detectedProviders: [
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
  ],
};
export const MultipleProviders: Story = { args: multipleProvidersArgs };

/** Dialog with a single detected provider. */
export const singleProviderArgs: DetectedProvidersDialogProps = {
  open: true,
  onClose: () => undefined,
  onAddProviders: () => undefined,
  onDismiss: () => undefined,
  detectedProviders: [
    {
      providerId: 'copilot',
      source: 'GitHub CLI',
      displayName: 'GitHub Copilot',
      config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
    },
  ],
};
export const SingleProvider: Story = { args: singleProviderArgs };

/** Dialog when closed. */
export const closedArgs: DetectedProvidersDialogProps = {
  open: false,
  onClose: () => undefined,
  onAddProviders: () => undefined,
  detectedProviders: [],
};
export const Closed: Story = { args: closedArgs };
