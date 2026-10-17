import { describe, expect, test } from 'vitest';
import {
  buildLatestBackupBySchedule,
  getCoveringSchedules,
  getLatestBackupForSchedule,
  getSchedulesForNamespace,
  resolveEveryRunAnchor,
  scheduleBackupLookupKey,
  scheduleCoversWorkload,
} from './coverage';
import { getNextScheduledRun } from './cron';

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

  test('matches known apps-group aliases but not cross-group resources', () => {
    const appsAlias = {
      name: 'apps-alias',
      template: {
        includedNamespaces: ['default'],
        includedResources: ['deployments.apps'],
      },
    };
    const singularQualified = {
      name: 'singular-qualified',
      template: {
        includedNamespaces: ['default'],
        includedResources: ['deployment.apps'],
      },
    };
    const stsSingularQualified = {
      name: 'sts-singular-qualified',
      template: {
        includedNamespaces: ['default'],
        includedResources: ['statefulset.apps'],
      },
    };
    const crossGroup = {
      name: 'cross-group',
      template: {
        includedNamespaces: ['default'],
        includedResources: ['deployments.example.com'],
      },
    };
    const deployTarget = {
      namespace: 'default',
      labels: {},
      resourceKind: 'deployments' as const,
    };
    const stsTarget = {
      namespace: 'default',
      labels: {},
      resourceKind: 'statefulsets' as const,
    };

    expect(scheduleCoversWorkload(appsAlias, deployTarget)).toBe(true);
    expect(scheduleCoversWorkload(singularQualified, deployTarget)).toBe(true);
    expect(scheduleCoversWorkload(stsSingularQualified, stsTarget)).toBe(true);
    expect(scheduleCoversWorkload(crossGroup, deployTarget)).toBe(false);

    // Exclusion via qualified singular must also match.
    expect(
      scheduleCoversWorkload(
        {
          name: 'exclude-deploy-singular',
          template: {
            includedNamespaces: ['default'],
            excludedResources: ['deployment.apps'],
          },
        },
        deployTarget
      )
    ).toBe(false);
    expect(
      scheduleCoversWorkload(
        {
          name: 'exclude-sts-singular',
          template: {
            includedNamespaces: ['default'],
            excludedResources: ['statefulset.apps'],
          },
        },
        stsTarget
      )
    ).toBe(false);
  });

  test('honors excludedNamespaceScopedResources', () => {
    const schedule = {
      name: 'no-deployments',
      template: {
        includedNamespaces: ['apps'],
        excludedNamespaceScopedResources: ['deployments.apps'],
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: {},
        resourceKind: 'deployments',
      })
    ).toBe(false);

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: {},
        resourceKind: 'persistentvolumeclaims',
      })
    ).toBe(true);
  });

  test('treats excludedNamespaceScopedResources * as excluding all namespaced kinds', () => {
    const schedule = {
      name: 'cluster-only',
      template: {
        includedNamespaces: ['apps'],
        excludedNamespaceScopedResources: ['*'],
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: {},
        resourceKind: 'deployments',
      })
    ).toBe(false);
    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: {},
        resourceKind: 'statefulsets',
      })
    ).toBe(false);
    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: {},
        resourceKind: 'persistentvolumeclaims',
      })
    ).toBe(false);
  });

  test('honors includedNamespaceScopedResources when set', () => {
    const schedule = {
      name: 'pods-only-ns-scoped',
      template: {
        includedNamespaces: ['apps'],
        includedNamespaceScopedResources: ['pods'],
      },
    };

    expect(
      scheduleCoversWorkload(schedule, {
        namespace: 'apps',
        labels: {},
        resourceKind: 'deployments',
      })
    ).toBe(false);
  });

  test('matches Velero short names deploy, sts, and pvc', () => {
    const ns = ['default'];
    expect(
      scheduleCoversWorkload(
        {
          name: 'deploy-short',
          template: { includedNamespaces: ns, includedResources: ['deploy'] },
        },
        { namespace: 'default', labels: {}, resourceKind: 'deployments' }
      )
    ).toBe(true);
    expect(
      scheduleCoversWorkload(
        { name: 'sts-short', template: { includedNamespaces: ns, includedResources: ['sts'] } },
        { namespace: 'default', labels: {}, resourceKind: 'statefulsets' }
      )
    ).toBe(true);
    expect(
      scheduleCoversWorkload(
        { name: 'pvc-short', template: { includedNamespaces: ns, includedResources: ['pvc'] } },
        { namespace: 'default', labels: {}, resourceKind: 'persistentvolumeclaims' }
      )
    ).toBe(true);
  });

  test('does not treat unsupported pvcs alias as covering PVCs', () => {
    expect(
      scheduleCoversWorkload(
        {
          name: 'pvcs-alias',
          template: { includedNamespaces: ['default'], includedResources: ['pvcs'] },
        },
        { namespace: 'default', labels: {}, resourceKind: 'persistentvolumeclaims' }
      )
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

  test('malformed namespace globs fail closed without throwing', () => {
    expect(() =>
      scheduleCoversWorkload(
        {
          name: 'bad-glob',
          template: {
            includedNamespaces: ['[z-a]'],
            includedResources: ['deployments'],
          },
        },
        {
          namespace: 'default',
          labels: {},
          resourceKind: 'deployments',
        }
      )
    ).not.toThrow();
    expect(
      scheduleCoversWorkload(
        {
          name: 'bad-glob',
          template: {
            includedNamespaces: ['[z-a]'],
            includedResources: ['deployments'],
          },
        },
        {
          namespace: 'default',
          labels: {},
          resourceKind: 'deployments',
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

  test('excludes FailedValidation schedules from coverage', () => {
    expect(
      scheduleCoversWorkload(
        {
          name: 'broken',
          phase: 'FailedValidation',
          template: {
            includedNamespaces: ['apps'],
            includedResources: ['deployments'],
          },
        },
        {
          namespace: 'apps',
          labels: {},
          resourceKind: 'deployments',
        }
      )
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

describe('buildLatestBackupBySchedule', () => {
  test('builds latest map in one pass keyed by cluster and schedule', () => {
    const latest = buildLatestBackupBySchedule([
      {
        name: 'older',
        scheduleName: 'daily',
        completionTimestamp: '2026-07-01T10:00:00Z',
      },
      {
        name: 'newer',
        scheduleName: 'daily',
        completionTimestamp: '2026-07-02T10:00:00Z',
      },
      {
        name: 'other',
        scheduleName: 'weekly',
        completionTimestamp: '2026-07-01T12:00:00Z',
      },
    ]);

    expect(latest.get(scheduleBackupLookupKey(undefined, 'daily'))?.name).toBe('newer');
    expect(latest.get(scheduleBackupLookupKey(undefined, 'weekly'))?.name).toBe('other');
    expect(latest.size).toBe(2);
  });

  test('keeps same-named schedules on different clusters separate', () => {
    const latest = buildLatestBackupBySchedule([
      {
        name: 'a-daily',
        cluster: 'cluster-a',
        scheduleName: 'daily',
        completionTimestamp: '2026-07-02T10:00:00Z',
      },
      {
        name: 'b-daily',
        cluster: 'cluster-b',
        scheduleName: 'daily',
        completionTimestamp: '2026-07-03T10:00:00Z',
      },
    ]);

    expect(latest.get(scheduleBackupLookupKey('cluster-a', 'daily'))?.name).toBe('a-daily');
    expect(latest.get(scheduleBackupLookupKey('cluster-b', 'daily'))?.name).toBe('b-daily');
    expect(latest.size).toBe(2);
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

  test('prefers startTimestamp so a newer in-progress backup wins', () => {
    const latest = getLatestBackupForSchedule(
      [
        {
          name: 'older-completed',
          scheduleName: 'daily',
          startTimestamp: '2026-07-01T10:00:00Z',
          completionTimestamp: '2026-07-02T12:00:00Z',
        },
        {
          name: 'newer-in-progress',
          scheduleName: 'daily',
          startTimestamp: '2026-07-02T11:00:00Z',
        },
      ],
      'daily'
    );

    expect(latest?.name).toBe('newer-in-progress');
  });

  test('falls back to creationTimestamp for pre-execution backups', () => {
    const latest = getLatestBackupForSchedule(
      [
        {
          name: 'older-completed',
          scheduleName: 'daily',
          startTimestamp: '2026-07-01T10:00:00Z',
          completionTimestamp: '2026-07-01T10:05:00Z',
        },
        {
          name: 'newer-queued',
          scheduleName: 'daily',
          phase: 'Queued',
          creationTimestamp: '2026-07-02T11:00:00Z',
        },
      ],
      'daily'
    );

    expect(latest?.name).toBe('newer-queued');
  });
});

describe('resolveEveryRunAnchor', () => {
  test('prefers the later of lastBackup and lastSkipped', () => {
    const anchor = resolveEveryRunAnchor({
      lastBackupTime: '2026-07-01T04:00:00Z',
      lastSkippedTime: '2026-07-01T05:10:00Z',
      creationTimestamp: '2026-06-01T00:00:00Z',
    });

    expect(anchor?.toISOString()).toBe('2026-07-01T05:10:00.000Z');
  });

  test('uses lastSkipped when lastBackup is absent', () => {
    const anchor = resolveEveryRunAnchor({
      lastSkippedTime: '2026-07-01T05:10:00Z',
      creationTimestamp: '2026-06-01T00:00:00Z',
    });

    expect(anchor?.toISOString()).toBe('2026-07-01T05:10:00.000Z');
  });

  test('anchors @every next-run from lastSkipped after skipImmediately', () => {
    // lastBackup 04:00, lastSkipped 05:10, now 06:00 → next is 06:10 (not 07:00).
    const next = getNextScheduledRun(
      '@every 1h',
      new Date('2026-07-01T06:00:00Z'),
      resolveEveryRunAnchor({
        lastBackupTime: '2026-07-01T04:00:00Z',
        lastSkippedTime: '2026-07-01T05:10:00Z',
      })
    );

    expect(next?.toISOString()).toBe('2026-07-01T06:10:00.000Z');
  });
});

describe('getCoveringSchedules', () => {
  test('joins schedules with their latest backup', () => {
    const results = getCoveringSchedules(
      [
        {
          name: 'daily',
          cronSchedule: '0 7 * * *',
          phase: 'Enabled',
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
        statusDisplay: 'Active',
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
          phase: 'Enabled',
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
    expect(results[0].statusDisplay).toBe('Paused');
    expect(results[0].nextScheduledRun).toBeUndefined();
  });

  test('omits next run for New schedules and labels them New not Active', () => {
    const results = getCoveringSchedules(
      [
        {
          name: 'new-daily',
          cronSchedule: '0 7 * * *',
          phase: 'New',
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
    expect(results[0].statusDisplay).toBe('New');
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
          phase: 'Enabled',
          template: { includedNamespaces: ['apps'] },
        },
        {
          name: 'daily-other',
          phase: 'Enabled',
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
        statusDisplay: 'Active',
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
