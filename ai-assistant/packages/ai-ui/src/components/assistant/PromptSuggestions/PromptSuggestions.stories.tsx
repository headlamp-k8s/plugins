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
import { PromptSuggestions, type PromptSuggestionsProps } from './PromptSuggestions';

const meta = {
  title: 'AI UI/PromptSuggestions',
  component: PromptSuggestions,
} satisfies Meta<typeof PromptSuggestions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultPromptSuggestionsArgs: PromptSuggestionsProps = {
  suggestions: [
    'What pods are running in the default namespace?',
    'Show me deployments with issues',
    'How do I scale a deployment?',
  ],
  apiError: null,
  loading: false,
  onPromptSelect: () => undefined,
  onPromptSend: () => undefined,
  onErrorClear: () => undefined,
};
export const Default: Story = { args: defaultPromptSuggestionsArgs };

export const contentFilterErrorArgs: PromptSuggestionsProps = {
  suggestions: [
    'List all pods in the cluster',
    'Check node health status',
    'Show recent Kubernetes events',
  ],
  apiError: 'Response blocked by content filter policy',
  loading: false,
  onPromptSelect: () => undefined,
  onPromptSend: () => undefined,
  onErrorClear: () => undefined,
};
export const WithContentFilterError: Story = { args: contentFilterErrorArgs };

export const loadingPromptSuggestionsArgs: PromptSuggestionsProps = {
  suggestions: [],
  apiError: null,
  loading: true,
  onPromptSelect: () => undefined,
  onPromptSend: () => undefined,
  onErrorClear: () => undefined,
};
export const Loading: Story = { args: loadingPromptSuggestionsArgs };

export const manyPromptSuggestionsArgs: PromptSuggestionsProps = {
  suggestions: [
    'What pods are running?',
    'Show me deployments',
    'Check node status',
    'List services in kube-system',
    'Show recent events',
    'Describe the nginx deployment',
  ],
  apiError: null,
  loading: false,
  onPromptSelect: () => undefined,
  onPromptSend: () => undefined,
  onErrorClear: () => undefined,
};
export const ManySuggestions: Story = { args: manyPromptSuggestionsArgs };
