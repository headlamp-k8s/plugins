import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { TrainJobsDetail } from './TrainJobsDetail';

const meta: Meta<typeof TrainJobsDetail> = {
  title: 'Kubeflow/Training/TrainJobsDetail',
  component: TrainJobsDetail,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TrainJobsDetail>;

export const Running: Story = {
  args: {
    name: 'demo-trainjob',
    namespace: 'kubeflow-user',
  },
};

export const Suspended: Story = {
  args: {
    name: 'suspended-job',
    namespace: 'kubeflow-user',
  },
};

export const Failed: Story = {
  args: {
    name: 'failed-training',
    namespace: 'other-user',
  },
};

export const Completed: Story = {
  args: {
    name: 'successful-completion',
    namespace: 'kubeflow-user',
  },
};
