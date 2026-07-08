import type { Meta, StoryObj } from '@storybook/react';
import MCPConfigEditorDialog, {
  type MCPConfig,
  type MCPConfigEditorDialogProps,
} from './MCPConfigEditorDialog';

const meta = {
  title: 'AI UI/Settings/MCPConfigEditorDialog',
  component: MCPConfigEditorDialog,
} satisfies Meta<typeof MCPConfigEditorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const sampleMCPConfig: MCPConfig = {
  enabled: true,
  servers: [
    {
      name: 'cluster-tools',
      command: 'npx',
      args: ['cluster-tools-mcp', '--stdio'],
      env: { LOG_LEVEL: 'info' },
      enabled: true,
      autoApprove: false,
    },
  ],
};

export const openMCPConfigEditorArgs: MCPConfigEditorDialogProps = {
  open: true,
  onClose: () => undefined,
  config: sampleMCPConfig,
  onSave: () => undefined,
};
export const Open: Story = { args: openMCPConfigEditorArgs };

export const closedMCPConfigEditorArgs: MCPConfigEditorDialogProps = {
  ...openMCPConfigEditorArgs,
  open: false,
};
export const Closed: Story = { args: closedMCPConfigEditorArgs };
