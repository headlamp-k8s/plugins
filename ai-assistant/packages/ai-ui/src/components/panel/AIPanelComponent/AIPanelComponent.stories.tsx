import { Box, Typography } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import AIPanelComponent, { type AIPanelComponentProps } from './AIPanelComponent';

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

export const openPanelArgs: AIPanelComponentProps = {
  isOpen: true,
  hasValidConfig: true,
  children: <SampleContent />,
};
export const Open: Story = {
  args: openPanelArgs,
};

export const closedPanelArgs: AIPanelComponentProps = {
  ...openPanelArgs,
  isOpen: false,
  hasValidConfig: false,
};
export const Closed: Story = {
  args: closedPanelArgs,
};

export const noValidConfigArgs: AIPanelComponentProps = {
  ...openPanelArgs,
  hasValidConfig: false,
};
export const NoValidConfig: Story = {
  args: noValidConfigArgs,
};
