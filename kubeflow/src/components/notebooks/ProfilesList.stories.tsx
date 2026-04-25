import type { Meta, StoryObj } from '@storybook/react';
import { ProfileStatusBadge } from '../common/ProfileStatusBadge';
import { profileNoConditions, profileNotReady, profileReady } from './__fixtures__/mockData';

/**
 * Shows how ProfileStatusBadge renders inside a profiles list context —
 * one badge per row of the table.
 */
const meta: Meta<typeof ProfileStatusBadge> = {
  title: 'Kubeflow/Profiles/ProfileStatusBadge (List)',
  component: ProfileStatusBadge,
  parameters: {
    docs: {
      description: {
        component:
          'Profile status badges as rendered in the Profiles list view. Each story corresponds to a distinct profile state.',
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
