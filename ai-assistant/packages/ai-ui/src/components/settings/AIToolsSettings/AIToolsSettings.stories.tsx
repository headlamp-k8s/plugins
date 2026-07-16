import type { Meta, StoryObj } from '@storybook/react';
import { AIToolsSettings, type AIToolsSettingsProps, type ToolInfo } from './AIToolsSettings';

const meta = {
  title: 'AI UI/AIToolsSettings',
  component: AIToolsSettings,
} satisfies Meta<typeof AIToolsSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const sampleTools: ToolInfo[] = [
  { id: 'web-search', name: 'Web Search', description: 'Search the web for current information' },
  {
    id: 'code-exec',
    name: 'Code Execution',
    description: 'Execute code snippets in a sandboxed environment',
  },
  {
    id: 'file-read',
    name: 'File Reader',
    description: 'Read files from the filesystem for context',
  },
  {
    id: 'kubectl',
    name: 'kubectl',
    description: 'Execute kubectl commands against the cluster',
  },
];

/** All tools enabled. */
export const allEnabledArgs: AIToolsSettingsProps = {
  tools: sampleTools,
  isToolEnabled: () => true,
  onToolToggle: () => undefined,
};
export const AllEnabled: Story = { args: allEnabledArgs };

/** All tools disabled. */
export const allDisabledArgs: AIToolsSettingsProps = {
  tools: sampleTools,
  isToolEnabled: () => false,
  onToolToggle: () => undefined,
};
export const AllDisabled: Story = { args: allDisabledArgs };

/** Some tools enabled, some disabled. */
export const mixedArgs: AIToolsSettingsProps = {
  tools: sampleTools,
  isToolEnabled: toolId => ['web-search', 'kubectl'].includes(toolId),
  onToolToggle: () => undefined,
};
export const Mixed: Story = { args: mixedArgs };

/** Empty tools list. */
export const emptyArgs: AIToolsSettingsProps = {
  tools: [],
  isToolEnabled: () => false,
  onToolToggle: () => undefined,
};
export const Empty: Story = { args: emptyArgs };
