import type { Meta, StoryObj } from '@storybook/react';
import LogsDialog, { type LogsDialogProps } from './LogsDialog';

const meta = {
  title: 'AI UI/LogsDialog',
  component: LogsDialog,
} satisfies Meta<typeof LogsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const plainLogsDialogArgs: LogsDialogProps = {
  open: true,
  onClose: () => undefined,
  logs: 'Starting server\nListening on port 8080',
  title: 'Pod api Logs',
  resourceName: 'api',
};
export const PlainLogs: Story = { args: plainLogsDialogArgs };

export const jsonLogsDialogArgs: LogsDialogProps = {
  ...plainLogsDialogArgs,
  logs: '{"level":"info","message":"started"}',
  resourceName: 'api/pod',
};
export const JsonLogs: Story = { args: jsonLogsDialogArgs };

export const emptyLogsDialogArgs: LogsDialogProps = {
  ...plainLogsDialogArgs,
  logs: '',
  resourceName: undefined,
};
export const EmptyLogs: Story = { args: emptyLogsDialogArgs };
