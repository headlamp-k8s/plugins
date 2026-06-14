import type { Meta, StoryObj } from '@storybook/react';
import ToolApprovalDialog, { type ToolApprovalDialogProps } from './ToolApprovalDialog';

const meta = { title: 'AI UI/ToolApprovalDialog', component: ToolApprovalDialog } satisfies Meta<
  typeof ToolApprovalDialog
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const regularToolCall = {
  id: 'call_1',
  name: 'kubernetes_api_request',
  description: 'Get pods from Kubernetes API',
  arguments: { url: '/api/v1/pods', method: 'GET', empty: '', omitted: undefined },
  type: 'regular' as const,
};
export const mcpToolCall = {
  id: 'call_2',
  name: 'flux_get_helmreleases',
  description: 'Check Flux Helm releases',
  arguments: { namespace: 'flux-system', options: { output: 'json' } },
  type: 'mcp' as const,
};

export const mixedToolApprovalArgs: ToolApprovalDialogProps = {
  open: true,
  toolCalls: [regularToolCall, mcpToolCall],
  onApprove: () => undefined,
  onDeny: () => undefined,
  onClose: () => undefined,
};
export const MultipleMixedTools: Story = { args: mixedToolApprovalArgs };

export const singleToolApprovalArgs: ToolApprovalDialogProps = {
  ...mixedToolApprovalArgs,
  toolCalls: [regularToolCall],
};
export const SingleKubernetesTool: Story = { args: singleToolApprovalArgs };

export const LoadingState: Story = { args: { ...singleToolApprovalArgs, loading: true } };
export const MCPOnlyTools: Story = {
  args: { ...mixedToolApprovalArgs, toolCalls: [mcpToolCall] },
};
