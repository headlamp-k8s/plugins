import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { KatibTrialsList } from './KatibTrialsList';

const meta: Meta<typeof KatibTrialsList> = {
  title: 'Kubeflow/Katib/KatibTrialsList',
  component: KatibTrialsList,
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
        component: 'List view for all Katib Trials.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof KatibTrialsList>;

export const Default: Story = {};
