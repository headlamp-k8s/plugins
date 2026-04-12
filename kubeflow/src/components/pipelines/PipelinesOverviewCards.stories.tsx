import type { Meta, StoryObj } from '@storybook/react';
import { TestProvider } from '../common/TestProvider';
import { allPipelines, allRuns, allVersions } from './__fixtures__/mockData';
import { PipelinesOverviewContent } from './PipelinesOverviewCards';

const meta: Meta<typeof PipelinesOverviewContent> = {
  title: 'Kubeflow/Pipelines/Overview',
  component: PipelinesOverviewContent,
  decorators: [
    Story => (
      <TestProvider>
        <Story />
      </TestProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Presentational dashboard for Kubeflow Pipelines, showing summary cards, control plane info, and recent resource tables.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PipelinesOverviewContent>;

/** Full dashboard with sample pipelines, runs, and versions. */
export const Default: Story = {
  args: {
    summaryCards: [
      { title: 'Pipelines', value: 1, icon: 'mdi:sitemap', subtitle: '1 ready, 0 failed' },
      {
        title: 'Pipeline Versions',
        value: 1,
        icon: 'mdi:source-branch',
        subtitle: '1 total versions discovered',
      },
      {
        title: 'Runs',
        value: 1,
        icon: 'mdi:play-circle-outline',
        subtitle: '0 running, 1 succeeded, 0 failed',
      },
      { title: 'Recurring Runs', value: 1, icon: 'mdi:calendar-refresh', subtitle: '1 enabled' },
      { title: 'Experiments', value: 1, icon: 'mdi:flask-outline', subtitle: '1 experiment' },
      {
        title: 'Namespaces',
        value: 1,
        icon: 'mdi:folder-multiple',
        subtitle: 'KFP data across namespaces',
      },
    ],
    controlPlaneRows: [
      { label: 'Cluster', value: 'storybook-cluster' },
      { label: 'Detected Namespaces', value: 'default' },
      { label: 'Native API Mode', value: 'Yes' },
      { label: 'API Service', value: 'ml-pipeline.kubeflow' },
      { label: 'API Endpoint', value: 'ml-pipeline.kubeflow:8888' },
      { label: 'Versions / Pipeline', value: '1.0' },
    ],
    accessRows: [
      { resource: 'Pipelines', access: 'Allowed' },
      { resource: 'Pipeline Versions', access: 'Allowed' },
      { resource: 'Runs', access: 'Allowed' },
      { resource: 'Recurring Runs', access: 'Allowed' },
      { resource: 'Experiments', access: 'Allowed' },
    ],
    kfpDeployments: [
      {
        metadata: { name: 'ml-pipeline', namespace: 'kubeflow' },
        status: { readyReplicas: 1, availableReplicas: 1 },
        spec: { replicas: 1 },
        getAge: () => '10d',
      },
    ],
    failureRows: [],
    recentPipelines: allPipelines,
    recentVersions: allVersions,
    recentRuns: allRuns,
    versionList: allVersions,
    hasListErrors: false,
  },
};

/** Dashboard showing a failure in the recent activities. */
export const WithFailures: Story = {
  args: {
    ...Default.args,
    failureRows: [
      {
        kind: 'Run',
        name: 'failed-run',
        namespace: 'default',
        status: 'Error',
        link: 'failed-run',
        createdAt: '2025-01-01T15:00:00Z',
      },
    ],
  },
};

/** Empty dashboard state. */
export const Empty: Story = {
  args: {
    summaryCards: Default.args?.summaryCards?.map(c => ({ ...c, value: 0, subtitle: 'None' })),
    controlPlaneRows: Default.args?.controlPlaneRows,
    accessRows: Default.args?.accessRows,
    kfpDeployments: [],
    failureRows: [],
    recentPipelines: [],
    recentVersions: [],
    recentRuns: [],
    versionList: [],
    hasListErrors: false,
  },
};
