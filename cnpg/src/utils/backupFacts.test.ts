/*
 * Copyright 2026 The Kubernetes Authors
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

import { CnpgBackupLike, CnpgClusterLike, CnpgScheduledBackupLike } from '../resources/types';
import {
  backupsForCluster,
  describeBackupConfiguration,
  getContinuousArchivingStatus,
  getFirstRecoverabilityPoint,
  lastSuccessfulBackupByCluster,
  scheduledBackupsForCluster,
  summarizeBackups,
} from './backupFacts';

function backup(
  name: string,
  cluster: string,
  overrides: Partial<CnpgBackupLike> = {}
): CnpgBackupLike {
  return {
    metadata: { name, namespace: 'db', creationTimestamp: '2026-08-01T00:00:00Z' },
    spec: { cluster: { name: cluster } },
    ...overrides,
  };
}

/** Summaries are built from the same records the UI renders, so compose both. */
function summarize(backups: CnpgBackupLike[]) {
  return summarizeBackups(backupsForCluster(backups, 'pg-1'));
}

describe('backupsForCluster', () => {
  it('keeps only the backups that target the named cluster', () => {
    const backups = [backup('a', 'pg-1'), backup('b', 'pg-2'), backup('c', 'pg-1')];

    expect(backupsForCluster(backups, 'pg-1').map(b => b.name)).toEqual(['a', 'c']);
  });

  it('drops backups that name no cluster rather than attributing them', () => {
    const orphan: CnpgBackupLike = { metadata: { name: 'orphan' }, spec: {} };

    expect(backupsForCluster([orphan], 'pg-1')).toEqual([]);
  });

  it('tolerates a null list, which is what Headlamp supplies before a read completes', () => {
    expect(backupsForCluster(null, 'pg-1')).toEqual([]);
    expect(backupsForCluster(undefined, 'pg-1')).toEqual([]);
  });
});

describe('lastSuccessfulBackupByCluster', () => {
  it('keys each cluster by namespace and name', () => {
    const backups = [
      backup('a', 'pg-1', { status: { phase: 'completed', stoppedAt: '2026-08-01T01:00:00Z' } }),
    ];

    expect(lastSuccessfulBackupByCluster(backups).get('db/pg-1')?.name).toBe('a');
  });

  it('never attributes a backup to a same-named cluster in another namespace', () => {
    // The list view reads Backups across namespaces, so name-only matching would
    // show one team's backup time against another team's cluster.
    const elsewhere = backup('a', 'pg-1', {
      metadata: { name: 'a', namespace: 'other' },
      status: { phase: 'completed', stoppedAt: '2026-08-01T01:00:00Z' },
    });

    const index = lastSuccessfulBackupByCluster([elsewhere]);

    expect(index.get('other/pg-1')?.name).toBe('a');
    expect(index.get('db/pg-1')).toBeUndefined();
  });

  it('reports the most recent successful backup and ignores failures', () => {
    const backups = [
      backup('old', 'pg-1', { status: { phase: 'completed', stoppedAt: '2026-08-01T01:00:00Z' } }),
      backup('new', 'pg-1', { status: { phase: 'completed', stoppedAt: '2026-08-03T01:00:00Z' } }),
      backup('broken', 'pg-1', { status: { phase: 'failed', stoppedAt: '2026-08-04T01:00:00Z' } }),
    ];

    expect(lastSuccessfulBackupByCluster(backups).get('db/pg-1')?.name).toBe('new');
  });

  it('omits a cluster whose backups have all failed, rather than claiming one', () => {
    const backups = [
      backup('broken', 'pg-1', { status: { phase: 'failed', stoppedAt: '2026-08-04T01:00:00Z' } }),
    ];

    expect(lastSuccessfulBackupByCluster(backups).get('db/pg-1')).toBeUndefined();
  });

  it('drops backups that name no cluster rather than attributing them', () => {
    const orphan: CnpgBackupLike = {
      metadata: { name: 'orphan', namespace: 'db' },
      spec: {},
      status: { phase: 'completed', stoppedAt: '2026-08-01T01:00:00Z' },
    };

    expect(lastSuccessfulBackupByCluster([orphan]).size).toBe(0);
  });

  it('tolerates a null list, which is what Headlamp supplies before a read completes', () => {
    expect(lastSuccessfulBackupByCluster(null).size).toBe(0);
    expect(lastSuccessfulBackupByCluster(undefined).size).toBe(0);
  });
});

describe('summarizeBackups', () => {
  it('reports the most recent completed backup by the time it stopped', () => {
    const backups = [
      backup('old', 'pg-1', {
        status: { phase: 'completed', stoppedAt: '2026-08-01T01:00:00Z', method: 'plugin' },
      }),
      backup('new', 'pg-1', {
        status: { phase: 'completed', stoppedAt: '2026-08-03T01:00:00Z', method: 'plugin' },
      }),
      backup('mid', 'pg-1', {
        status: { phase: 'completed', stoppedAt: '2026-08-02T01:00:00Z', method: 'plugin' },
      }),
    ];

    const summary = summarize(backups);
    expect(summary.lastSuccessful?.name).toBe('new');
    expect(summary.lastSuccessful?.completedAt).toBe('2026-08-03T01:00:00Z');
    expect(summary.total).toBe(3);
  });

  it('falls back to startedAt, then creationTimestamp, when the stop time is missing', () => {
    const backups = [
      backup('stopped-known', 'pg-1', {
        status: { phase: 'completed', stoppedAt: '2026-08-01T00:00:00Z' },
      }),
      backup('started-only', 'pg-1', {
        status: { phase: 'completed', startedAt: '2026-08-05T00:00:00Z' },
      }),
    ];

    expect(summarize(backups).lastSuccessful?.name).toBe('started-only');
  });

  it('reports the most recent failed backup and its error separately', () => {
    const backups = [
      backup('ok', 'pg-1', { status: { phase: 'completed', stoppedAt: '2026-08-01T00:00:00Z' } }),
      backup('bad', 'pg-1', {
        status: { phase: 'failed', stoppedAt: '2026-08-04T00:00:00Z', error: 'no such bucket' },
      }),
    ];

    const summary = summarize(backups);
    expect(summary.lastSuccessful?.name).toBe('ok');
    expect(summary.lastFailed?.name).toBe('bad');
    expect(summary.lastFailed?.error).toBe('no such bucket');
  });

  it('treats walArchivingFailing as a failure, because no new backup can complete while it holds', () => {
    const backups = [
      backup('wal', 'pg-1', {
        status: { phase: 'walArchivingFailing', error: 'WAL archiving is not working' },
      }),
    ];

    expect(summarize(backups).lastFailed?.name).toBe('wal');
  });

  it('lists running backups without counting them as successes', () => {
    const backups = [
      backup('p', 'pg-1', { status: { phase: 'pending' } }),
      backup('r', 'pg-1', { status: { phase: 'running' } }),
      backup('f', 'pg-1', { status: { phase: 'finalizing' } }),
    ];

    const summary = summarize(backups);
    expect(summary.inProgress.map(b => b.name)).toEqual(['p', 'r', 'f']);
    expect(summary.lastSuccessful).toBeNull();
    expect(summary.lastFailed).toBeNull();
  });

  it('collects the distinct methods actually used', () => {
    const backups = [
      backup('a', 'pg-1', { status: { phase: 'completed', method: 'plugin' } }),
      backup('b', 'pg-1', { status: { phase: 'completed', method: 'volumeSnapshot' } }),
      backup('c', 'pg-1', { status: { phase: 'completed', method: 'plugin' } }),
    ];

    expect(summarize(backups).methods).toEqual(['plugin', 'volumeSnapshot']);
  });

  it('keeps an unrecognised phase in the total without classifying it', () => {
    const backups = [backup('x', 'pg-1', { status: { phase: 'somethingNew' } })];
    const summary = summarize(backups);

    expect(summary.total).toBe(1);
    expect(summary.lastSuccessful).toBeNull();
    expect(summary.lastFailed).toBeNull();
    expect(summary.inProgress).toEqual([]);
  });

  it('reports an empty summary for a cluster that has never been backed up', () => {
    expect(summarizeBackups([])).toEqual({
      total: 0,
      lastSuccessful: null,
      lastFailed: null,
      inProgress: [],
      methods: [],
    });
  });

  it('does not throw on a backup with no status at all', () => {
    const summary = summarize([backup('nostatus', 'pg-1')]);

    expect(summary.total).toBe(1);
    expect(summary.lastSuccessful).toBeNull();
  });
});

describe('getContinuousArchivingStatus', () => {
  it('reports ok when the operator says WAL archiving is working', () => {
    const cluster: CnpgClusterLike = {
      status: {
        conditions: [
          {
            type: 'ContinuousArchiving',
            status: 'True',
            reason: 'ContinuousArchivingSuccess',
            lastTransitionTime: '2026-08-01T00:00:00Z',
          },
        ],
      },
    };

    expect(getContinuousArchivingStatus(cluster)).toEqual({
      state: 'ok',
      reason: 'ContinuousArchivingSuccess',
      message: null,
      lastTransitionTime: '2026-08-01T00:00:00Z',
    });
  });

  it('reports failing, with the operator message, when archiving is broken', () => {
    const cluster: CnpgClusterLike = {
      status: {
        conditions: [
          {
            type: 'ContinuousArchiving',
            status: 'False',
            reason: 'ContinuousArchivingFailing',
            message: 'unable to upload WAL',
          },
        ],
      },
    };

    const archiving = getContinuousArchivingStatus(cluster);
    expect(archiving.state).toBe('failing');
    expect(archiving.message).toBe('unable to upload WAL');
  });

  it('reports unknown when the condition is absent or indeterminate', () => {
    expect(getContinuousArchivingStatus({ status: { conditions: [] } }).state).toBe('unknown');
    expect(getContinuousArchivingStatus(undefined).state).toBe('unknown');
    expect(
      getContinuousArchivingStatus({
        status: { conditions: [{ type: 'ContinuousArchiving', status: 'Unknown' }] },
      }).state
    ).toBe('unknown');
  });
});

describe('getFirstRecoverabilityPoint', () => {
  it('returns the oldest point in time the cluster can be restored to', () => {
    const cluster: CnpgClusterLike = {
      status: {
        firstRecoverabilityPointByMethod: {
          barmanObjectStore: '2026-07-02T00:00:00Z',
          volumeSnapshot: '2026-07-01T00:00:00Z',
        },
      },
    };

    expect(getFirstRecoverabilityPoint(cluster)).toBe('2026-07-01T00:00:00Z');
  });

  it('prefers the top-level field when the operator sets it', () => {
    expect(
      getFirstRecoverabilityPoint({ status: { firstRecoverabilityPoint: '2026-07-05T00:00:00Z' } })
    ).toBe('2026-07-05T00:00:00Z');
  });

  it('returns null for plugin-based backups, where the field is deprecated and never set', () => {
    expect(getFirstRecoverabilityPoint({ status: {} })).toBeNull();
    expect(getFirstRecoverabilityPoint(undefined)).toBeNull();
  });
});

describe('describeBackupConfiguration', () => {
  it('recognises a barman object store configured directly on the cluster', () => {
    const cluster: CnpgClusterLike = {
      spec: {
        backup: { barmanObjectStore: { destinationPath: 's3://x' }, retentionPolicy: '30d' },
      },
    };

    expect(describeBackupConfiguration(cluster)).toEqual({
      kind: 'barmanObjectStore',
      retentionPolicy: '30d',
      walArchiverPlugins: [],
    });
  });

  it('recognises a WAL-archiving plugin', () => {
    const cluster: CnpgClusterLike = {
      spec: {
        plugins: [
          { name: 'barman-cloud.cloudnative-pg.io', enabled: true, isWALArchiver: true },
          { name: 'other.example.com', enabled: true },
        ],
      },
    };

    expect(describeBackupConfiguration(cluster)).toEqual({
      kind: 'plugin',
      retentionPolicy: null,
      walArchiverPlugins: ['barman-cloud.cloudnative-pg.io'],
    });
  });

  it('ignores a disabled plugin, which archives nothing', () => {
    const cluster: CnpgClusterLike = {
      spec: {
        plugins: [{ name: 'barman-cloud.cloudnative-pg.io', enabled: false, isWALArchiver: true }],
      },
    };

    expect(describeBackupConfiguration(cluster).kind).toBe('none');
  });

  it('recognises volume snapshots configured on the cluster', () => {
    const cluster: CnpgClusterLike = {
      spec: { backup: { volumeSnapshot: { className: 'csi-azuredisk' } } },
    };

    expect(describeBackupConfiguration(cluster)).toEqual({
      kind: 'volumeSnapshot',
      retentionPolicy: null,
      walArchiverPlugins: [],
    });
  });

  // Both can be set at once: snapshots take the base backup while the object
  // store receives the WALs. The object store is the stronger answer because it
  // is the one that makes point-in-time recovery possible.
  it('prefers the object store when snapshots are configured alongside it', () => {
    const cluster: CnpgClusterLike = {
      spec: {
        backup: {
          barmanObjectStore: { destinationPath: 's3://x' },
          volumeSnapshot: { className: 'csi-azuredisk' },
        },
      },
    };

    expect(describeBackupConfiguration(cluster).kind).toBe('barmanObjectStore');
  });

  it('reports none when nothing is configured', () => {
    expect(describeBackupConfiguration({ spec: {} }).kind).toBe('none');
    expect(describeBackupConfiguration(undefined).kind).toBe('none');
  });
});

describe('scheduledBackupsForCluster', () => {
  function schedule(
    name: string,
    cluster: string,
    overrides: Partial<CnpgScheduledBackupLike> = {}
  ) {
    return {
      metadata: { name, namespace: 'db' },
      spec: { cluster: { name: cluster }, schedule: '0 0 0 * * *' },
      ...overrides,
    } as CnpgScheduledBackupLike;
  }

  it('keeps only schedules targeting the cluster and reports whether they are suspended', () => {
    const schedules = [
      schedule('nightly', 'pg-1'),
      schedule('other', 'pg-2'),
      schedule('paused', 'pg-1', {
        spec: { cluster: { name: 'pg-1' }, schedule: '0 0 3 * * *', suspend: true },
      }),
    ];

    expect(scheduledBackupsForCluster(schedules, 'pg-1')).toEqual([
      {
        name: 'nightly',
        schedule: '0 0 0 * * *',
        suspended: false,
        nextScheduleTime: null,
        error: null,
      },
      {
        name: 'paused',
        schedule: '0 0 3 * * *',
        suspended: true,
        nextScheduleTime: null,
        error: null,
      },
    ]);
  });

  it('surfaces the next run time and any schedule error', () => {
    const schedules = [
      schedule('nightly', 'pg-1', {
        spec: { cluster: { name: 'pg-1' }, schedule: '0 0 0 * * *' },
        status: { nextScheduleTime: '2026-08-11T00:00:00Z', error: 'bad cron' },
      }),
    ];

    expect(scheduledBackupsForCluster(schedules, 'pg-1')[0]).toEqual({
      name: 'nightly',
      schedule: '0 0 0 * * *',
      suspended: false,
      nextScheduleTime: '2026-08-11T00:00:00Z',
      error: 'bad cron',
    });
  });

  it('tolerates a null list', () => {
    expect(scheduledBackupsForCluster(null, 'pg-1')).toEqual([]);
  });
});
