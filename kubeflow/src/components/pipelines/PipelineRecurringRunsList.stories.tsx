import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { PipelineRecurringRunsList } from './PipelineRecurringRunsList';

const meta: Meta<typeof PipelineRecurringRunsList> = {
  title: 'Kubeflow/Pipelines/PipelineRecurringRunsList',
  component: PipelineRecurringRunsList,
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
        component: 'List view for all Kubeflow Pipeline Recurring Runs (Schedules).',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineRecurringRunsList>;

export const Default: Story = {};
