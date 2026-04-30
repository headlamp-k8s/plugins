import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { mockKatibSuggestion } from './__fixtures__/mockData';
import { KatibSuggestionsDetail } from './KatibSuggestionsDetail';

const meta: Meta<typeof KatibSuggestionsDetail> = {
  title: 'Kubeflow/Katib/KatibSuggestionsDetail',
  component: KatibSuggestionsDetail,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Detail view for a Katib Suggestion.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof KatibSuggestionsDetail>;

export const Default: Story = {
  args: {
    name: mockKatibSuggestion.metadata.name,
    namespace: mockKatibSuggestion.metadata.namespace,
  },
};
