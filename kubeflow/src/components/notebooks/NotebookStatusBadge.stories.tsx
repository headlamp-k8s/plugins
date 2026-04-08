import type { Meta, StoryObj } from '@storybook/react';
import { NotebookStatusBadge } from '../common/NotebookStatusBadge';
import {
  notebookFailed,
  notebookPending,
  notebookRunning,
  notebookTerminated,
} from './__fixtures__/mockData';

const meta: Meta<typeof NotebookStatusBadge> = {
  title: 'Kubeflow/Badges/NotebookStatusBadge',
  component: NotebookStatusBadge,
  parameters: {
    docs: {
      description: {
        component:
          'Visual status badge derived from a Notebook jsonData object. Shows label, icon, and tooltip reason for error states.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NotebookStatusBadge>;

export const Running: Story = {
  args: { jsonData: notebookRunning },
};

export const Pending: Story = {
  args: { jsonData: notebookPending },
};

export const Failed: Story = {
  args: { jsonData: notebookFailed },
};

export const Terminated: Story = {
  args: { jsonData: notebookTerminated },
};

export const NoStatus: Story = {
  args: { jsonData: {} },
};
