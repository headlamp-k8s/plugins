import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { TrainJobsList } from './TrainJobsList';

const meta: Meta<typeof TrainJobsList> = {
  title: 'Kubeflow/Training/TrainJobsList',
  component: TrainJobsList,
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
        component: 'Searchable and filterable list of Kubeflow TrainJobs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TrainJobsList>;

export const Default: Story = {};
