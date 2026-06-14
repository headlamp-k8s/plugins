import { Box, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import AIPanelComponent from './AIPanelComponent';

const meta: Meta<typeof AIPanelComponent> = {
  title: 'AI/Panel/AIPanelComponent',
  component: AIPanelComponent,
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <Box sx={{ flex: 1, p: 2 }}>
          <Typography>Main content area</Typography>
        </Box>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AIPanelComponent>;

const SampleContent = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6">AI Assistant</Typography>
    <Typography>Chat content goes here</Typography>
  </Box>
);

export const Open: Story = {
  args: {
    isOpen: true,
    hasValidConfig: true,
    children: <SampleContent />,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    hasValidConfig: false,
    children: <SampleContent />,
  },
};

export const NoValidConfig: Story = {
  args: {
    isOpen: true,
    hasValidConfig: false,
    children: <SampleContent />,
  },
};
