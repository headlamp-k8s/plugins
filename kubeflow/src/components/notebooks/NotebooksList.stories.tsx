import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { NotebooksList } from './NotebooksList';

const meta: Meta<typeof NotebooksList> = {
  title: 'Kubeflow/Notebooks/NotebooksList',
  component: NotebooksList,
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
          'Actual NotebooksList component rendered with mock data. Shows statuses, resource requests, and volumes across all notebooks.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NotebooksList>;

export const Default: Story = {};
