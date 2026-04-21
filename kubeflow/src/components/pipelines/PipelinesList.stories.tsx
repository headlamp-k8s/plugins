import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { PipelinesList } from './PipelinesList';

const meta: Meta<typeof PipelinesList> = {
  title: 'Kubeflow/Pipelines/PipelinesList',
  component: PipelinesList,
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
        component: 'List view for all Kubeflow Pipelines.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelinesList>;

export const Default: Story = {};
