import type { Meta, StoryObj } from '@storybook/react';
import { TestProvider } from '../common/TestProvider';
import {
  allNotebooks,
  allPodDefaults,
  allProfiles,
  notebookFailed,
  notebookPending,
  notebookRunning,
} from './__fixtures__/mockData';
import { NotebooksOverviewContent } from './NotebooksOverviewCards';

/**
 * NotebooksOverviewContent is the pure presentational version of the
 * Notebooks dashboard — no live API calls, driven entirely by props.
 */
const meta: Meta<typeof NotebooksOverviewContent> = {
  title: 'Kubeflow/Notebooks/OverviewDashboard',
  component: NotebooksOverviewContent,
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
          'Presentational dashboard combining summary cards, a recent notebooks table, and resource totals. All data is passed via props so this renders correctly in Storybook without a cluster.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NotebooksOverviewContent>;

/** Full dashboard with a mix of running, pending, and failed notebooks. */
export const Default: Story = {
  args: {
    notebooks: allNotebooks as any,
    profiles: allProfiles,
    podDefaults: allPodDefaults,
  },
};

/** Dashboard with only a single running notebook. */
export const SingleRunning: Story = {
  args: {
    notebooks: [notebookRunning] as any,
    profiles: allProfiles,
    podDefaults: allPodDefaults,
  },
};

/** Dashboard with all notebooks in a non-running state. */
export const AllUnhealthy: Story = {
  args: {
    notebooks: [notebookPending, notebookFailed] as any,
    profiles: allProfiles,
    podDefaults: [],
  },
};

/** Empty dashboard — no notebooks, profiles, or PodDefaults installed yet. */
export const Empty: Story = {
  args: {
    notebooks: [],
    profiles: [],
    podDefaults: [],
  },
};
