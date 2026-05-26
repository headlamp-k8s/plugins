import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { TrainingOverview } from './TrainingOverview';

const meta: Meta<typeof TrainingOverview> = {
  title: 'Kubeflow/Training/TrainingOverview',
  component: TrainingOverview,
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
          'Unified dashboard for Kubeflow Training, showing overview of jobs and runtimes.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TrainingOverview>;

export const Default: Story = {};
