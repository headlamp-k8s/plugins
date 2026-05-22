import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TrainJobClass } from '../../resources/trainJob';
import { TestProvider } from '../common/TestProvider';
import { allTrainJobs } from './__fixtures__/mockData';
import { TrainJobStatusBadge } from './TrainJobStatusBadge';

const meta: Meta<typeof TrainJobStatusBadge> = {
  title: 'Kubeflow/Training/TrainJobStatusBadge',
  component: TrainJobStatusBadge,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TrainJobStatusBadge>;

const jobs = allTrainJobs.map(job => new TrainJobClass(job));

export const Running: Story = {
  args: { job: jobs[0] },
};

export const Suspended: Story = {
  args: { job: jobs[1] },
};

export const Failed: Story = {
  args: { job: jobs[2] },
};

export const Succeeded: Story = {
  args: { job: jobs[3] },
};
