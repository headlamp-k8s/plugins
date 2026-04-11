import type { Meta, StoryObj } from '@storybook/react';
import { TestProvider } from '../common/TestProvider';
import { notebookFailed, notebookRunning } from '../notebooks/__fixtures__/mockData';
import { OverviewContent } from './OverviewContent';

const meta: Meta<typeof OverviewContent> = {
  title: 'Kubeflow/Overview',
  component: OverviewContent,
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
          'Kubeflow Control Center overview showing installed components, active workloads, and failed workloads across all modules.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof OverviewContent>;

const baseModules = [
  { title: 'Notebooks', key: 'Notebook', icon: 'mdi:notebook', items: [], isInstalled: true },
  { title: 'Pipelines', key: 'Pipeline', icon: 'mdi:sitemap', items: [], isInstalled: true },
  {
    title: 'Katib Experiments',
    key: 'Katib',
    icon: 'mdi:tune',
    items: [],
    isInstalled: true,
  },
  { title: 'Training Jobs', key: 'Training', icon: 'mdi:school', items: [], isInstalled: false },
  {
    title: 'Spark Applications',
    key: 'Spark',
    icon: 'mdi:flash',
    items: [],
    isInstalled: false,
  },
];

/**
 * Full platform with active and failed workloads across modules.
 */
export const WithWorkloads: Story = {
  args: {
    modules: [
      {
        ...baseModules[0],
        items: [notebookRunning, notebookFailed],
      },
      {
        ...baseModules[1],
        items: [
          {
            metadata: { name: 'training-pipeline', namespace: 'kubeflow-user' },
            status: { conditions: [{ type: 'Running', status: 'True' }] },
          },
        ],
      },
      baseModules[2],
      baseModules[3],
      baseModules[4],
    ],
  },
};

/**
 * Platform installed but no workloads running — shows the informational alert.
 */
export const InstalledNoWorkloads: Story = {
  args: {
    modules: baseModules,
  },
};

/**
 * No Kubeflow components detected at all — shows the warning alert.
 */
export const NothingInstalled: Story = {
  args: {
    modules: baseModules.map(m => ({ ...m, isInstalled: false })),
  },
};

/**
 * Only Notebooks module installed with a single running workload.
 */
export const NotebooksOnlyInstalled: Story = {
  args: {
    modules: [
      { ...baseModules[0], items: [notebookRunning] },
      ...baseModules.slice(1).map(m => ({ ...m, isInstalled: false })),
    ],
  },
};
