import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { KatibOverview } from './KatibOverview';

const meta: Meta<typeof KatibOverview> = {
  title: 'Kubeflow/Katib/KatibOverview',
  component: KatibOverview,
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
        component: 'Overview dashboard for Katib experiments, trials, and suggestions.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof KatibOverview>;

export const Default: Story = {};
