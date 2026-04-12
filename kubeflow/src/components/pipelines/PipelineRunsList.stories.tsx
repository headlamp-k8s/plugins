import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { PipelineRunsList } from './PipelineRunsList';

const meta: Meta<typeof PipelineRunsList> = {
  title: 'Kubeflow/Pipelines/PipelineRunsList',
  component: PipelineRunsList,
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
        component: 'List view for all Kubeflow Pipeline Runs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineRunsList>;

export const Default: Story = {};
