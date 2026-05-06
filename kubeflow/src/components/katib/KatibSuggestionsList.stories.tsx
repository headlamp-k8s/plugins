import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { KatibSuggestionsList } from './KatibSuggestionsList';

const meta: Meta<typeof KatibSuggestionsList> = {
  title: 'Kubeflow/Katib/KatibSuggestionsList',
  component: KatibSuggestionsList,
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
        component: 'List view for all Katib Suggestions.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof KatibSuggestionsList>;

export const Default: Story = {};
