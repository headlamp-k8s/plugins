import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { PodDefaultsList } from './PodDefaultsList';

const meta: Meta<typeof PodDefaultsList> = {
  title: 'Kubeflow/PodDefaults/PodDefaultsList',
  component: PodDefaultsList,
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
        component:
          'Actual PodDefaultsList component rendered with mock data. Shows injection rules and selector labels.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PodDefaultsList>;

export const Default: Story = {};
