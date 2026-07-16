import type { Meta, StoryObj } from '@storybook/react';
import AIAssistantToggle, { type AIAssistantToggleProps } from './AIAssistantToggle';

const meta = {
  title: 'AI UI/AIAssistantToggle',
  component: AIAssistantToggle,
} satisfies Meta<typeof AIAssistantToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const closedToggleArgs: AIAssistantToggleProps = {
  isOpen: false,
  onToggle: () => undefined,
  showConfigPrompt: false,
  onDismissPrompt: () => undefined,
  onConfigure: () => undefined,
};

export const Closed: Story = { args: closedToggleArgs };

export const openToggleArgs: AIAssistantToggleProps = {
  ...closedToggleArgs,
  isOpen: true,
};

export const Open: Story = { args: openToggleArgs };

export const unconfiguredToggleArgs: AIAssistantToggleProps = {
  ...closedToggleArgs,
  showConfigPrompt: true,
};

export const Unconfigured: Story = { args: unconfiguredToggleArgs };
