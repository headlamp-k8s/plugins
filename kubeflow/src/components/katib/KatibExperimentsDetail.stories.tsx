import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TestProvider } from '../common/TestProvider';
import {
  mockKatibExperiment,
  mockKatibExperimentFailed,
  mockKatibExperimentRunning,
} from './__fixtures__/mockData';
import { KatibExperimentsDetail } from './KatibExperimentsDetail';

/**
 * We use the real KatibExperimentsDetail component because we have patched
 * the KubeObject.useGet and useList hooks in StorybookMocks.ts.
 */
const meta: Meta<typeof KatibExperimentsDetail> = {
  title: 'Kubeflow/Katib/KatibExperimentsDetail',
  component: KatibExperimentsDetail,
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
        component: 'Detail view for a Katib Experiment.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof KatibExperimentsDetail>;

export const Succeeded: Story = {
  args: {
    name: mockKatibExperiment.metadata.name,
    namespace: mockKatibExperiment.metadata.namespace,
  },
};

export const Running: Story = {
  args: {
    name: mockKatibExperimentRunning.metadata.name,
    namespace: mockKatibExperimentRunning.metadata.namespace,
  },
};

export const Failed: Story = {
  args: {
    name: mockKatibExperimentFailed.metadata.name,
    namespace: mockKatibExperimentFailed.metadata.namespace,
  },
};
