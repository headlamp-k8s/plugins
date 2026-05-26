import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { ClusterTrainingRuntimesDetail, TrainingRuntimesDetail } from './TrainingRuntimeDetails';

const meta: Meta<typeof TrainingRuntimesDetail> = {
  title: 'Kubeflow/Training/TrainingRuntimeDetail',
  component: TrainingRuntimesDetail,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TrainingRuntimesDetail>;

export const Namespaced: Story = {
  args: {
    name: 'demo-team-runtime',
    namespace: 'kubeflow-user',
  },
};

export const ClusterScoped: Story = {
  render: () => <ClusterTrainingRuntimesDetail name="demo-cluster-runtime" />,
};
