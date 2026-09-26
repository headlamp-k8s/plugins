import type { Meta, StoryObj } from '@storybook/react';
import { BackupCoveragePanelPure } from './BackupCoveragePanelPure';

const meta: Meta<typeof BackupCoveragePanelPure> = {
  title: 'Velero/BackupCoveragePanel',
  component: BackupCoveragePanelPure,
  args: {
    installed: true,
    loading: false,
    coverage: [
      {
        scheduleName: 'daily-apps',
        cronSchedule: '0 7 * * *',
        nextScheduledRun: '7/6/2026, 7:00:00 AM',
        lastBackup: {
          name: 'daily-apps-20260702',
          scheduleName: 'daily-apps',
          phase: 'Completed',
          completionTimestamp: '2026-07-02T07:05:00Z',
        },
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof BackupCoveragePanelPure>;

export const NotInstalled: Story = {
  args: {
    installed: false,
    loading: false,
    coverage: [],
  },
};

export const Loading: Story = {
  args: {
    installed: true,
    loading: true,
    coverage: [],
  },
};

export const LoadError: Story = {
  args: {
    installed: true,
    loading: false,
    error: new Error('Forbidden'),
    coverage: [],
  },
};

export const NotCovered: Story = {
  args: {
    installed: true,
    loading: false,
    coverage: [],
  },
};

export const Covered: Story = {
  args: {
    installed: true,
    loading: false,
    coverage: [
      {
        scheduleName: 'daily-apps',
        cronSchedule: '0 7 * * *',
        nextScheduledRun: '7/6/2026, 7:00:00 AM',
        lastBackup: {
          name: 'daily-apps-20260702',
          scheduleName: 'daily-apps',
          phase: 'Completed',
          completionTimestamp: '2026-07-02T07:05:00Z',
        },
      },
    ],
  },
};

export const NamespaceSummary: Story = {
  args: {
    installed: true,
    loading: false,
    sectionTitle: 'Velero backup schedules',
    emptyMessage: 'No Velero schedule covers this namespace.',
    coverage: [
      {
        scheduleName: 'default-deployments-daily',
        cronSchedule: '0 2 * * *',
        nextScheduledRun: '7/6/2026, 2:00:00 AM',
        lastBackup: {
          name: 'default-deployments-daily-20260705',
          scheduleName: 'default-deployments-daily',
          phase: 'Completed',
          completionTimestamp: '2026-07-05T02:05:00Z',
        },
      },
    ],
  },
};
