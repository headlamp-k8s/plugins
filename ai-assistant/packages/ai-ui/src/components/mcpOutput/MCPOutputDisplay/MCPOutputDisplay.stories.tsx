/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import MCPOutputDisplay from './MCPOutputDisplay';

export default {
  title: 'AI UI/MCPOutputDisplay',
  component: MCPOutputDisplay,
} as Meta;

const Template: StoryFn<React.ComponentProps<typeof MCPOutputDisplay>> = args => (
  <MCPOutputDisplay {...args} />
);

export const TableOutput = Template.bind({});
TableOutput.args = {
  output: {
    type: 'table',
    title: 'Pods in default namespace',
    summary: '3 pods running in the default namespace',
    data: {
      headers: ['Name', 'Status', 'Restarts', 'Age'],
      rows: [
        ['nginx-deployment-abc123', 'Running', '0', '2d'],
        ['redis-master-xyz456', 'Running', '1', '5d'],
        ['frontend-app-def789', 'CrashLoopBackOff', '15', '1h'],
      ],
    },
    insights: ['All pods except frontend-app are healthy', 'frontend-app is crash-looping'],
    warnings: ['frontend-app-def789 has restarted 15 times'],
    metadata: {
      toolName: 'kubernetes_get_pods',
      responseSize: 1024,
      processingTime: 150,
      dataPoints: 3,
    },
  },
  onRetry: () => console.log('Retry clicked'),
  onExport: (format: string) => console.log('Export:', format),
};

export const TextOutput = Template.bind({});
TextOutput.args = {
  output: {
    type: 'text',
    title: 'Cluster Status',
    summary: 'Cluster health check completed',
    data: {
      content:
        '## Cluster Health Report\n\n- **API Server**: Healthy\n- **etcd**: Healthy\n- **Controller Manager**: Healthy\n- **Scheduler**: Healthy\n\nAll components are running normally.',
      language: 'markdown',
    },
    metadata: {
      toolName: 'cluster_health_check',
      responseSize: 256,
      processingTime: 80,
    },
  },
};

export const ErrorOutput = Template.bind({});
ErrorOutput.args = {
  output: {
    type: 'error',
    title: 'Connection Failed',
    summary: 'Unable to connect to cluster',
    data: {
      message: 'Failed to connect to Kubernetes API server at https://10.0.0.1:6443',
      code: 'ECONNREFUSED',
      details: 'The cluster may be unreachable or the kubeconfig may be invalid.',
    },
    metadata: {
      toolName: 'kubernetes_api_request',
      responseSize: 128,
      processingTime: 5000,
    },
  },
  onRetry: () => console.log('Retry clicked'),
};

export const MetricsOutput = Template.bind({});
MetricsOutput.args = {
  output: {
    type: 'metrics',
    title: 'Node Resource Usage',
    summary: 'Resource utilization across 3 nodes',
    data: {
      headers: ['Node', 'CPU Usage', 'Memory Usage', 'Disk Usage'],
      rows: [
        ['node-1', '45%', '62%', '38%'],
        ['node-2', '78%', '85%', '55%'],
        ['node-3', '23%', '41%', '22%'],
      ],
    },
    warnings: ['node-2 memory usage is above 80%'],
    actionable_items: ['Consider scaling node-2 or redistributing workloads'],
    metadata: {
      toolName: 'node_metrics',
      responseSize: 512,
      processingTime: 200,
      dataPoints: 3,
    },
  },
};

export const CompactMode = Template.bind({});
CompactMode.args = {
  output: {
    type: 'list',
    title: 'Namespaces',
    summary: '5 namespaces found',
    data: {
      items: ['default', 'kube-system', 'kube-public', 'monitoring', 'ingress-nginx'],
    },
    metadata: {
      toolName: 'list_namespaces',
      responseSize: 64,
      processingTime: 50,
    },
  },
  compact: true,
};
