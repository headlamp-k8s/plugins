import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { ClusterTrainingRuntimesList } from './ClusterTrainingRuntimesList';

const meta: Meta<typeof ClusterTrainingRuntimesList> = {
  title: 'Kubeflow/Training/ClusterTrainingRuntimesList',
  component: ClusterTrainingRuntimesList,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ClusterTrainingRuntimesList>;

export const Default: Story = {};
