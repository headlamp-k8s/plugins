import { describe, expect, test } from 'vitest';
import {
  getCoveringSchedules,
  getLatestBackupForSchedule,
  getSchedulesForNamespace,
  scheduleCoversWorkload,
} from './coverage';

describe('scheduleCoversWorkload', () => {
  test('matches namespace and resource type with no label selector', () => {
    const covered = scheduleCoversWorkload(
      {
        name: 'daily',
        template: {
          includedNamespaces: ['apps'],
          includedResources: ['deployments'],
        },
      },
      {
        namespace: 'apps',
        labels: { app: 'web' },
        resourceKind: 'deployments',
      }
    );

    expect(covered).toBe(true);
  });

  test('rejects workloads outside included namespaces', () => {
    const covered = scheduleCoversWorkload(
      {
        name: 'daily',
        template: {
          includedNamespaces: ['apps'],
          includedResources: ['deployments'],
        },
      },
      {
        namespace: 'other',
        labels: {},
        resourceKind: 'deployments',
      }
    );

    expect(covered).toBe(false);
  });

  test('requires label selector matches when present', () => {
    const schedule = {
      name: 'app-only',
      template: {
        includedNamespaces: ['apps'],
        includedResources: ['deployments'],
        labelSelector: { matchLabels: { app: 'api' } },
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { app: 'api' },
        resourceKind: 'deployments',
      })
    ).toBe(true);

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { app: 'web' },
        resourceKind: 'deployments',
      })
    ).toBe(false);
  });

  test('evaluates matchExpressions instead of treating them as match-all', () => {
    const schedule = {
      name: 'env-prod',
      template: {
        includedNamespaces: ['apps'],
        includedResources: ['deployments'],
        labelSelector: {
          matchExpressions: [{ key: 'env', operator: 'In', values: ['prod'] }],
        },
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { env: 'prod' },
        resourceKind: 'deployments',
      })
    ).toBe(true);

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { env: 'dev' },
        resourceKind: 'deployments',
      })
    ).toBe(false);
  });

  test('requires both matchLabels and matchExpressions', () => {
    const schedule = {
      name: 'api-prod',
      template: {
        includedNamespaces: ['apps'],
        includedResources: ['deployments'],
        labelSelector: {
          matchLabels: { app: 'api' },
          matchExpressions: [{ key: 'env', operator: 'In', values: ['prod'] }],
        },
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { app: 'api', env: 'prod' },
        resourceKind: 'deployments',
      })
    ).toBe(true);

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { app: 'api', env: 'dev' },
        resourceKind: 'deployments',
      })
    ).toBe(false);
  });

  test('matches orLabelSelectors if any selector matches', () => {
    const schedule = {
      name: 'or-labels',
      template: {
        includedNamespaces: ['apps'],
        includedResources: ['deployments'],
        orLabelSelectors: [{ matchLabels: { app: 'web' } }, { matchLabels: { app: 'api' } }],
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { app: 'api' },
        resourceKind: 'deployments',
      })
    ).toBe(true);

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { app: 'other' },
        resourceKind: 'deployments',
      })
    ).toBe(false);
  });

  test('fails closed on unknown matchExpressions operators', () => {
    expect(
      scheduleCoversWorkload(
        {
          name: 'unknown-op',
          template: {
            includedNamespaces: ['apps'],
            includedResources: ['deployments'],
            labelSelector: {
              matchExpressions: [{ key: 'env', operator: 'Gt', values: ['1'] }],
            },
          },
        },
        {
          namespace: 'apps',
          labels: { env: '2' },
          resourceKind: 'deployments',
        }
      )
    ).toBe(false);
  });

  test('rejects PVC when schedule only includes deployments', () => {
    const schedule = {
      name: 'deployments-only',
      template: {
        includedNamespaces: ['default'],
        includedResources: ['deployments'],
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'default',
        labels: { backup: 'enabled' },
        resourceKind: 'deployments',
      })
    ).toBe(true);

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'default',
        labels: { backup: 'enabled' },
        resourceKind: 'persistentvolumeclaims',
      })
    ).toBe(false);
  });

  test('rejects resource type listed in excludedResources', () => {
    expect(
      scheduleCoversWorkload(
        {
          name: 'no-pvc',
          template: {
            includedNamespaces: ['default'],
            excludedResources: ['persistentvolumeclaims'],
          },
        },
        {
          namespace: 'default',
          labels: {},
          resourceKind: 'persistentvolumeclaims',
        }
      )
    ).toBe(false);
  });

  test('matches includedNamespaces glob patterns', () => {
    const schedule = {
      name: 'app-ns',
      template: {
        includedNamespaces: ['app-*'],
        includedResources: ['deployments'],
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'app-frontend',
        labels: {},
        resourceKind: 'deployments',
      })
    ).toBe(true);

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'other',
        labels: {},
        resourceKind: 'deployments',
      })
    ).toBe(false);
  });

  test('excludes namespaces matched by excludedNamespaces globs (no false coverage)', () => {
    const schedule = {
      name: 'all-but-prod',
      template: {
        includedNamespaces: ['*'],
        excludedNamespaces: ['prod-*'],
        includedResources: ['deployments'],
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'prod-api',
        labels: {},
        resourceKind: 'deployments',
      })
    ).toBe(false);

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'staging',
        labels: {},
        resourceKind: 'deployments',
      })
    ).toBe(true);
  });

  test('rejects workload labeled velero.io/exclude-from-backup=true', () => {
    const schedule = {
      name: 'daily',
      template: {
        includedNamespaces: ['apps'],
        includedResources: ['deployments'],
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: { 'velero.io/exclude-from-backup': 'true' },
        resourceKind: 'deployments',
      })
    ).toBe(false);
  });

  test('rejects PVC labeled velero.io/exclude-from-backup=true', () => {
    expect(
      scheduleCoversWorkload(
        {
          name: 'daily',
          template: {
            includedNamespaces: ['apps'],
            includedResources: ['persistentvolumeclaims'],
          },
        },
        {
          namespace: 'apps',
          labels: { 'velero.io/exclude-from-backup': 'true' },
          resourceKind: 'persistentvolumeclaims',
        }
      )
    ).toBe(false);
  });
});

describe('getLatestBackupForSchedule', () => {
  test('returns the newest backup for a schedule', () => {
    const latest = getLatestBackupForSchedule(
      [
        {
          name: 'old',
          scheduleName: 'daily',
          startTimestamp: '2026-07-01T10:00:00Z',
        },
        {
          name: 'new',
          scheduleName: 'daily',
          completionTimestamp: '2026-07-02T10:00:00Z',
        },
        {
          name: 'other',
          scheduleName: 'weekly',
          completionTimestamp: '2026-07-03T10:00:00Z',
        },
      ],
      'daily'
    );

    expect(latest?.name).toBe('new');
  });
});

describe('getCoveringSchedules', () => {
  test('joins schedules with their latest backup', () => {
    const results = getCoveringSchedules(
      [
        {
          name: 'daily',
          cronSchedule: '0 7 * * *',
          template: { includedNamespaces: ['apps'], includedResources: ['deployments'] },
        },
      ],
      [
        {
          name: 'backup-1',
          scheduleName: 'daily',
          phase: 'Completed',
          completionTimestamp: '2026-07-02T10:00:00Z',
        },
      ],
      {
        namespace: 'apps',
        labels: {},
        resourceKind: 'deployments',
      }
    );

    expect(results[0].nextScheduledRun).not.toBe('N/A');
    expect(results).toEqual([
      {
        scheduleName: 'daily',
        cronSchedule: '0 7 * * *',
        nextScheduledRun: expect.any(String),
        paused: false,
        lastBackup: {
          name: 'backup-1',
          scheduleName: 'daily',
          phase: 'Completed',
          completionTimestamp: '2026-07-02T10:00:00Z',
        },
      },
    ]);
  });

  test('marks paused schedules and omits next run', () => {
    const results = getCoveringSchedules(
      [
        {
          name: 'paused-daily',
          cronSchedule: '0 7 * * *',
          paused: true,
          template: { includedNamespaces: ['apps'], includedResources: ['deployments'] },
        },
      ],
      [],
      {
        namespace: 'apps',
        labels: {},
        resourceKind: 'deployments',
      }
    );

    expect(results).toHaveLength(1);
    expect(results[0].paused).toBe(true);
    expect(results[0].nextScheduledRun).toBeUndefined();
  });

  test('partial namespace coverage only matches labeled workloads', () => {
    const schedule = {
      name: 'labeled-default',
      cronSchedule: '0 7 * * *',
      template: {
        includedNamespaces: ['default'],
        includedResources: ['deployments'],
        labelSelector: { matchLabels: { backup: 'enabled' } },
      },
    };

    expect(
      getCoveringSchedules([schedule], [], {
        namespace: 'default',
        labels: { backup: 'enabled', app: 'nginx' },
        resourceKind: 'deployments',
      })
    ).toHaveLength(1);

    expect(
      getCoveringSchedules([schedule], [], {
        namespace: 'default',
        labels: { app: 'partial-demo' },
        resourceKind: 'deployments',
      })
    ).toHaveLength(0);
  });
});

describe('getSchedulesForNamespace', () => {
  test('returns schedules that include the namespace with latest backups', () => {
    const results = getSchedulesForNamespace(
      [
        {
          name: 'daily-apps',
          cronSchedule: '0 7 * * *',
          template: { includedNamespaces: ['apps'] },
        },
        {
          name: 'daily-other',
          template: { includedNamespaces: ['other'] },
        },
      ],
      [
        {
          name: 'backup-1',
          scheduleName: 'daily-apps',
          phase: 'Completed',
          completionTimestamp: '2026-07-02T07:05:00Z',
        },
      ],
      'apps'
    );

    expect(results).toEqual([
      {
        scheduleName: 'daily-apps',
        cronSchedule: '0 7 * * *',
        nextScheduledRun: expect.any(String),
        paused: false,
        lastBackup: {
          name: 'backup-1',
          scheduleName: 'daily-apps',
          phase: 'Completed',
          completionTimestamp: '2026-07-02T07:05:00Z',
        },
      },
    ]);
  });
});
