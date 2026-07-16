import type { FormattedMCPOutput } from '@headlamp-k8s/ai-common/mcp/tools/formattedOutput';
import type { Meta, StoryObj } from '@storybook/react';
import MCPOutputDisplay from './MCPOutputDisplay';

const meta = {
  title: 'AI UI/MCPOutputDisplay',
  component: MCPOutputDisplay,
} satisfies Meta<typeof MCPOutputDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

const metadata = {
  toolName: 'kubernetes_get_pods',
  responseSize: 1024,
  processingTime: 150,
  dataPoints: 3,
};

export const tableOutput: FormattedMCPOutput = {
  type: 'table',
  title: 'Pods in default namespace',
  summary: '3 pods running in the default namespace',
  data: {
    headers: ['Name', 'Status', 'Restarts'],
    rows: [
      ['nginx', 'Running', 0],
      ['redis', 'Running', 1],
      ['frontend', 'CrashLoopBackOff', 15],
    ],
    highlightRows: [2],
  },
  insights: ['Most pods are healthy'],
  warnings: ['frontend has restarted 15 times'],
  actionable_items: ['Inspect frontend logs'],
  metadata,
};

export const metricsOutput: FormattedMCPOutput = {
  type: 'metrics',
  title: 'Node resource usage',
  summary: 'Current node health',
  data: {
    primary: [
      { label: 'CPU', value: '45%', status: 'info' },
      { label: 'Memory', value: '85%', status: 'warning' },
    ],
    secondary: [{ label: 'Nodes', value: 3 }],
    trends: [{ label: 'CPU change', value: '+5%', status: 'warning' }],
  },
  metadata,
};

export const listOutput: FormattedMCPOutput = {
  type: 'list',
  title: 'Namespaces',
  summary: '3 namespaces found',
  data: {
    items: [
      { text: 'default', status: 'info' },
      { text: 'kube-system', metadata: 'system namespace' },
      { text: 'monitoring', status: 'warning' },
    ],
  },
  metadata,
};

export const markdownOutput: FormattedMCPOutput = {
  type: 'text',
  title: 'Cluster status',
  summary: 'Cluster health check completed',
  data: {
    content:
      '## Cluster Health\n\n- **API Server**: Healthy\n- `etcd`: Healthy\n\n[Content truncated for display...]',
    fullContent:
      '## Cluster Health\n\n- **API Server**: Healthy\n- `etcd`: Healthy\n- Scheduler: Healthy',
    language: 'markdown',
    highlights: ['Healthy control plane'],
  },
  metadata,
};

export const errorOutput: FormattedMCPOutput = {
  type: 'error',
  title: 'Connection failed',
  summary: 'Unable to connect to cluster',
  data: { message: 'Kubernetes API server refused the connection' },
  metadata,
};

export const TableOutput: Story = { args: { output: tableOutput } };
export const MetricsOutput: Story = { args: { output: metricsOutput } };
export const TextOutput: Story = { args: { output: markdownOutput } };
export const ErrorOutput: Story = { args: { output: errorOutput } };
export const CompactMode: Story = { args: { output: listOutput, compact: true } };
