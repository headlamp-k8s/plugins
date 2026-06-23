import type { Meta, StoryObj } from '@storybook/react';
import Dashboard from './Dashboard';

const meta = {
  title: 'Components/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'padded',
  },
  args: {},
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'responsive',
    },
  },
};

export const NarrowViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const ConstrainedPanel: Story = {
  decorators: [
    Story => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
};
