import type { Meta, StoryObj } from '@storybook/react';
import MCPFormattedMessage, { type MCPFormattedMessageProps } from './MCPFormattedMessage';

const meta = { title: 'AI UI/MCPFormattedMessage', component: MCPFormattedMessage } satisfies Meta<
  typeof MCPFormattedMessage
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const formattedTableContent = JSON.stringify({
  formatted: true,
  mcpOutput: {
    type: 'table',
    title: 'Running Pods',
    summary: '2 pods in default namespace',
    data: {
      headers: ['Name', 'Status'],
      rows: [
        ['pod,"one"', 'Running'],
        ['pod-two', 'Pending'],
      ],
    },
    insights: ['One pod is pending'],
    actionable_items: ['Inspect pod-two'],
    metadata: { toolName: 'kubernetes/get pods', responseSize: 256, processingTime: 100 },
  },
  raw: 'raw pod output',
  originalArgs: { namespace: 'default' },
});

export const formattedTableArgs: MCPFormattedMessageProps = {
  content: formattedTableContent,
  isAssistant: true,
};
export const FormattedTableOutput: Story = { args: formattedTableArgs };

export const formattedErrorContent = JSON.stringify({
  formatted: true,
  mcpOutput: {
    type: 'error',
    title: 'API Request Failed',
    summary: 'Connection refused',
    data: { message: 'ECONNREFUSED' },
    metadata: { toolName: 'kubernetes_api_request', responseSize: 64, processingTime: 5000 },
  },
  raw: 'Error: ECONNREFUSED',
  isError: true,
  originalArgs: { path: '/api' },
});

export const FormattedErrorOutput: Story = {
  args: { content: formattedErrorContent, isAssistant: true },
};
export const NonMCPContent: Story = { args: { content: 'Regular text', isAssistant: true } };
export const InvalidJSON: Story = { args: { content: '{ invalid json', isAssistant: false } };
