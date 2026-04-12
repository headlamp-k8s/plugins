import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { PipelineVersionsList } from './PipelineVersionsList';

const meta: Meta<typeof PipelineVersionsList> = {
  title: 'Kubeflow/Pipelines/PipelineVersionsList',
  component: PipelineVersionsList,
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
        component: 'List view for all Kubeflow Pipeline Versions.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineVersionsList>;

export const Default: Story = {};
