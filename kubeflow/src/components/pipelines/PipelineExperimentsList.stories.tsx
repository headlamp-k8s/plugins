import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { PipelineExperimentsList } from './PipelineExperimentsList';

const meta: Meta<typeof PipelineExperimentsList> = {
  title: 'Kubeflow/Pipelines/PipelineExperimentsList',
  component: PipelineExperimentsList,
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
        component: 'List view for all Kubeflow Pipeline Experiments.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineExperimentsList>;

export const Default: Story = {};
