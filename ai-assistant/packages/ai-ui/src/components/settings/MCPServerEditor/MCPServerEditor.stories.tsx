import type { Meta, StoryObj } from '@storybook/react';
import MCPServerEditor, { type MCPServer, type MCPServerEditorProps } from './MCPServerEditor';

const meta = {
  title: 'AI UI/Settings/MCPServerEditor',
  component: MCPServerEditor,
} satisfies Meta<typeof MCPServerEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const sampleMCPServer: MCPServer = {
  name: 'cluster-tools',
  command: 'npx',
  args: ['cluster-tools-mcp', '--label', 'production cluster'],
  env: { LOG_LEVEL: 'info' },
  enabled: true,
  autoApprove: true,
};

export const addServerArgs: MCPServerEditorProps = {
  open: true,
  onClose: () => undefined,
  onSave: () => undefined,
  existingServerNames: ['existing-server'],
};
export const AddServer: Story = { args: addServerArgs };

export const editServerArgs: MCPServerEditorProps = {
  ...addServerArgs,
  server: sampleMCPServer,
  existingServerNames: [sampleMCPServer.name, 'other-server'],
};
export const EditServer: Story = { args: editServerArgs };

export const closedServerEditorArgs: MCPServerEditorProps = {
  ...addServerArgs,
  open: false,
};
export const Closed: Story = { args: closedServerEditorArgs };
