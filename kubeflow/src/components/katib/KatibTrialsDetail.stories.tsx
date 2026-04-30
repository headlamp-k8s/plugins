import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { mockKatibTrial } from './__fixtures__/mockData';
import { KatibTrialsDetail } from './KatibTrialsDetail';

const meta: Meta<typeof KatibTrialsDetail> = {
  title: 'Kubeflow/Katib/KatibTrialsDetail',
  component: KatibTrialsDetail,
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
        component: 'Detail view for a Katib Trial.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof KatibTrialsDetail>;

export const Default: Story = {
  args: {
    name: mockKatibTrial.metadata.name,
    namespace: mockKatibTrial.metadata.namespace,
  },
};
