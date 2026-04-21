import type { Meta, StoryObj } from '@storybook/react';
import { TestProvider } from '../common/TestProvider';
import { PipelineArtifacts } from './PipelineArtifacts';

const meta: Meta<typeof PipelineArtifacts> = {
  title: 'Kubeflow/Pipelines/PipelineArtifacts',
  component: PipelineArtifacts,
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
        component: 'Discovered pipeline roots from recent runs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelineArtifacts>;

export const Default: Story = {};
