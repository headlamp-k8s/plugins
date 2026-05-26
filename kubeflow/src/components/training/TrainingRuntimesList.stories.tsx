import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import { TrainingRuntimesList } from './TrainingRuntimesList';

const meta: Meta<typeof TrainingRuntimesList> = {
  title: 'Kubeflow/Training/TrainingRuntimesList',
  component: TrainingRuntimesList,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TrainingRuntimesList>;

export const Default: Story = {};
