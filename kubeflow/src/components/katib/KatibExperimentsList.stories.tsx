import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { KatibExperimentsList } from './KatibExperimentsList';

const meta: Meta<typeof KatibExperimentsList> = {
  title: 'Kubeflow/Katib/KatibExperimentsList',
  component: KatibExperimentsList,
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
        component: 'List view for all Katib Experiments.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof KatibExperimentsList>;

export const Default: Story = {};
