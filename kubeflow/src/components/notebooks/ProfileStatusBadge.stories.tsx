import type { Meta, StoryObj } from '@storybook/react';
import { ProfileStatusBadge } from '../common/ProfileStatusBadge';
import { profileNoConditions, profileNotReady, profileReady } from './__fixtures__/mockData';

const meta: Meta<typeof ProfileStatusBadge> = {
  title: 'Kubeflow/Badges/ProfileStatusBadge',
  component: ProfileStatusBadge,
  parameters: {
    docs: {
      description: {
        component:
          'Visual status badge derived from a Profile jsonData object. Shows Ready / Not Ready / Active states.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ProfileStatusBadge>;

export const Ready: Story = {
  args: { jsonData: profileReady },
};

export const NotReady: Story = {
  args: { jsonData: profileNotReady },
};

export const Active: Story = {
  args: { jsonData: profileNoConditions },
};

export const NoData: Story = {
  args: { jsonData: {} },
};
