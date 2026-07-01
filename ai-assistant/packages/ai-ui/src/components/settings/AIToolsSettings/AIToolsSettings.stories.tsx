import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { AIToolsSettings, type AIToolsSettingsProps } from './AIToolsSettings';

export default {
  title: 'AI UI/AIToolsSettings',
  component: AIToolsSettings,
} as Meta;

const Template: StoryFn<AIToolsSettingsProps> = args => <AIToolsSettings {...args} />;

const sampleTools = [
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
export const AllEnabled = Template.bind({});
AllEnabled.args = {
  tools: sampleTools,
  isToolEnabled: () => true,
  onToolToggle: toolId => console.log('Toggle:', toolId),
};

/** All tools disabled. */
export const AllDisabled = Template.bind({});
AllDisabled.args = {
  tools: sampleTools,
  isToolEnabled: () => false,
  onToolToggle: toolId => console.log('Toggle:', toolId),
};

/** Some tools enabled, some disabled. */
export const Mixed = Template.bind({});
Mixed.args = {
  tools: sampleTools,
  isToolEnabled: toolId => ['web-search', 'kubectl'].includes(toolId),
  onToolToggle: toolId => console.log('Toggle:', toolId),
};

/** Empty tools list. */
export const Empty = Template.bind({});
Empty.args = {
  tools: [],
  isToolEnabled: () => false,
  onToolToggle: () => {},
};
