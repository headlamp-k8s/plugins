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

import { CnpgClusterLike } from '../resources/types';
import { BackupRecord, ScheduledBackupRecord } from '../utils/backupFacts';
import { rulesProvider } from './rules';
import { Finding, InsightsContext } from './types';

const NOW = Date.parse('2026-08-10T12:00:00Z');
const HOUR = 60 * 60 * 1000;

function at(msAgo: number): string {
  return new Date(NOW - msAgo).toISOString();
}

/** A cluster with nothing wrong with it: healthy, HA, archiving, backed up. */
function healthyCluster(): CnpgClusterLike {
  return {
    metadata: { name: 'pg-1', namespace: 'db', creationTimestamp: at(90 * 24 * HOUR) },
    spec: {
      instances: 3,
      backup: { barmanObjectStore: { destinationPath: 's3://b/' }, retentionPolicy: '7d' },
    },
    status: {
      phase: 'Cluster in healthy state',
      instances: 3,
      readyInstances: 3,
      currentPrimary: 'pg-1-1',
      targetPrimary: 'pg-1-1',
      currentPrimaryTimestamp: at(60 * 24 * HOUR),
      firstRecoverabilityPoint: at(48 * HOUR),
      conditions: [
        { type: 'ContinuousArchiving', status: 'True', reason: 'ContinuousArchivingSuccess' },
      ],
    },
  };
}

function completedBackup(msAgo: number, name = 'backup-1'): BackupRecord {
  return {
    name,
    namespace: 'db',
    phase: 'completed',
    method: 'barmanObjectStore',
    startedAt: at(msAgo),
    completedAt: at(msAgo),
    error: null,
    backupId: name,
  };
}

function nightlySchedule(overrides: Partial<ScheduledBackupRecord> = {}): ScheduledBackupRecord {
  return {
    name: 'nightly',
    schedule: '0 0 3 * * *',
    suspended: false,
    nextScheduleTime: null,
    error: null,
    ...overrides,
  };
}

function context(overrides: Partial<InsightsContext> = {}): InsightsContext {
  return {
    cluster: healthyCluster(),
    backups: [completedBackup(2 * HOUR)],
    scheduledBackups: [nightlySchedule()],
    now: NOW,
    ...overrides,
  };
}

/** Runs the engine and returns its findings keyed by rule id. */
function findingsById(overrides: Partial<InsightsContext> = {}): Record<string, Finding> {
  const findings = rulesProvider.getFindings(context(overrides)) as Finding[];

  return Object.fromEntries(findings.map(finding => [finding.id, finding]));
}

function ruleIds(overrides: Partial<InsightsContext> = {}): string[] {
  return Object.keys(findingsById(overrides));
}

describe('rulesProvider', () => {
  it('is synchronous, so the panel can render its findings without waiting', () => {
    expect(Array.isArray(rulesProvider.getFindings(context()))).toBe(true);
  });

  it('finds nothing to report on a healthy, backed-up, highly-available cluster', () => {
    expect(ruleIds()).toEqual([]);
  });

  it('never throws on a cluster that reports no status at all', () => {
    const bare: InsightsContext = {
      cluster: {},
      backups: [],
      scheduledBackups: [],
      now: NOW,
    };

    expect(() => rulesProvider.getFindings(bare)).not.toThrow();
  });

  it('gives every finding a message and at least one piece of evidence', () => {
    const findings = rulesProvider.getFindings({
      cluster: {},
      backups: [],
      scheduledBackups: [],
      now: NOW,
    }) as Finding[];

    expect(findings.length).toBeGreaterThan(0);
    findings.forEach(finding => {
      expect(finding.message).not.toBe('');
      expect(finding.evidence.length).toBeGreaterThan(0);
    });
  });
});

describe('rule: stale backup relative to its schedule', () => {
  it('warns when one scheduled run has been missed', () => {
    const finding = findingsById({ backups: [completedBackup(30 * HOUR)] })['stale-backup'];

    expect(finding.severity).toBe('warning');
    expect(finding.message).toContain('30 hours');
    expect(finding.evidence.join(' ')).toContain('every 24 hours');
  });

  it('escalates to critical once two scheduled runs have been missed', () => {
    expect(findingsById({ backups: [completedBackup(50 * HOUR)] })['stale-backup'].severity).toBe(
      'critical'
    );
  });

  it('stays quiet while the last backup is within the schedule', () => {
    expect(ruleIds({ backups: [completedBackup(20 * HOUR)] })).not.toContain('stale-backup');
  });

  it('measures against the last successful backup, not the last attempt', () => {
    const failedRecently: BackupRecord = {
      ...completedBackup(1 * HOUR, 'failed-1'),
      phase: 'failed',
    };

    expect(
      findingsById({ backups: [completedBackup(50 * HOUR), failedRecently] })['stale-backup']
        .severity
    ).toBe('critical');
  });

  it('is critical when a schedule exists but no backup has ever succeeded', () => {
    const finding = findingsById({ backups: [] })['stale-backup'];

    expect(finding.severity).toBe('critical');
    expect(finding.message).toContain('never');
  });

  it('reports unknown when the schedule is too complex to estimate an interval from', () => {
    const finding = findingsById({
      scheduledBackups: [nightlySchedule({ schedule: '0 0 2,14 * * *' })],
      backups: [completedBackup(50 * HOUR)],
    })['stale-backup'];

    expect(finding.severity).toBe('unknown');
    expect(finding.evidence.join(' ')).toContain('0 0 2,14 * * *');
  });

  it('warns that a suspended schedule is not running at all', () => {
    const finding = findingsById({ scheduledBackups: [nightlySchedule({ suspended: true })] })[
      'stale-backup'
    ];

    expect(finding.severity).toBe('warning');
    expect(finding.message).toContain('suspended');
  });

  it('surfaces an error the operator reported against the schedule', () => {
    const finding = findingsById({
      scheduledBackups: [nightlySchedule({ error: 'cannot parse schedule' })],
    })['stale-backup'];

    expect(finding.severity).toBe('critical');
    expect(finding.evidence.join(' ')).toContain('cannot parse schedule');
  });

  it('says nothing about staleness when no schedule targets the cluster', () => {
    // Whether that is a problem is the recoverability rule's question, not this
    // rule's: there is no schedule to be late against.
    expect(ruleIds({ scheduledBackups: [], backups: [completedBackup(500 * HOUR)] })).not.toContain(
      'stale-backup'
    );
  });
});

describe('rule: no recoverability point', () => {
  it('is critical when the cluster has no backup destination configured', () => {
    const cluster = healthyCluster();
    cluster.spec = { instances: 3 };
    cluster.status!.firstRecoverabilityPoint = undefined;

    const finding = findingsById({ cluster, backups: [], scheduledBackups: [] })[
      'no-recoverability-point'
    ];

    expect(finding.severity).toBe('critical');
    expect(finding.message).toContain('point-in-time recovery');
  });

  it('is critical when a destination is configured but nothing has ever been backed up', () => {
    const cluster = healthyCluster();
    cluster.status!.firstRecoverabilityPoint = undefined;

    expect(
      findingsById({ cluster, backups: [], scheduledBackups: [] })['no-recoverability-point']
        .severity
    ).toBe('critical');
  });

  it('stays quiet when the cluster reports a recoverability point', () => {
    expect(ruleIds()).not.toContain('no-recoverability-point');
  });

  it('counts a single Backup object in readable English', () => {
    const cluster = healthyCluster();
    cluster.spec = { instances: 3 };
    cluster.status!.firstRecoverabilityPoint = undefined;

    const finding = findingsById({
      cluster,
      backups: [{ ...completedBackup(1 * HOUR, 'failed-1'), phase: 'failed' }],
      scheduledBackups: [],
    })['no-recoverability-point'];

    expect(finding.evidence).toContain('1 Backup object targets this cluster');
  });

  // Volume snapshots are a backup destination the plugin used not to recognise,
  // so a snapshot-configured cluster that had not yet produced a backup was told
  // nothing was configured at all — a false statement about its own spec.
  it('does not claim nothing is configured when the cluster backs up to volume snapshots', () => {
    const cluster = healthyCluster();
    cluster.spec = {
      instances: 3,
      backup: { volumeSnapshot: { className: 'csi-azuredisk' } },
    };
    cluster.status!.firstRecoverabilityPoint = undefined;

    const finding = findingsById({ cluster, backups: [], scheduledBackups: [] })[
      'no-recoverability-point'
    ];

    expect(finding.evidence.join(' ')).not.toContain('neither');
  });

  it('reports the recovery window as unknown, not absent, for plugin-based backups', () => {    // Plugin-backed clusters never populate firstRecoverabilityPoint, so a
    // completed backup with no point is a gap in the data, not a missing backup.
    const cluster = healthyCluster();
    cluster.spec = {
      instances: 3,
      plugins: [{ name: 'barman-cloud.cloudnative-pg.io', enabled: true, isWALArchiver: true }],
    };
    cluster.status!.firstRecoverabilityPoint = undefined;

    const finding = findingsById({ cluster })['no-recoverability-point'];

    expect(finding.severity).toBe('unknown');
    expect(finding.evidence.join(' ')).toContain('plugin');
  });
});

describe('rule: cluster phase unhealthy', () => {
  it('is critical for a phase that needs a human', () => {
    const cluster = healthyCluster();
    cluster.status!.phase = 'Cluster is unrecoverable and needs manual intervention';

    const finding = findingsById({ cluster })['cluster-phase-unhealthy'];

    expect(finding.severity).toBe('critical');
    expect(finding.evidence.join(' ')).toContain(
      'Cluster is unrecoverable and needs manual intervention'
    );
  });

  it('is informational while the operator is still working', () => {
    const cluster = healthyCluster();
    cluster.status!.phase = 'Setting up primary';

    expect(findingsById({ cluster })['cluster-phase-unhealthy'].severity).toBe('info');
  });

  it('reports a phase this build does not recognise as unknown rather than healthy', () => {
    const cluster = healthyCluster();
    cluster.status!.phase = 'Doing something invented in a later release';

    expect(findingsById({ cluster })['cluster-phase-unhealthy'].severity).toBe('unknown');
  });

  it('reports a missing phase as unknown', () => {
    const cluster = healthyCluster();
    cluster.status!.phase = undefined;

    expect(findingsById({ cluster })['cluster-phase-unhealthy'].severity).toBe('unknown');
  });
});

describe('rule: ready instances below spec', () => {
  it('warns when an instance is down but a primary is still serving', () => {
    const cluster = healthyCluster();
    cluster.status!.readyInstances = 2;

    const finding = findingsById({ cluster })['ready-instances-below-spec'];

    expect(finding.severity).toBe('warning');
    expect(finding.message).toContain('2 of 3');
  });

  it('is critical when no instance is ready', () => {
    const cluster = healthyCluster();
    cluster.status!.readyInstances = 0;

    expect(findingsById({ cluster })['ready-instances-below-spec'].severity).toBe('critical');
  });

  it('reports unknown when the operator has not published a ready count', () => {
    const cluster = healthyCluster();
    cluster.status!.readyInstances = undefined;

    expect(findingsById({ cluster })['ready-instances-below-spec'].severity).toBe('unknown');
  });

  it('stays quiet when every instance is ready', () => {
    expect(ruleIds()).not.toContain('ready-instances-below-spec');
  });
});

describe('rule: WAL archiving failing', () => {
  it('is critical when the operator reports the condition as false', () => {
    const cluster = healthyCluster();
    cluster.status!.conditions = [
      {
        type: 'ContinuousArchiving',
        status: 'False',
        reason: 'ContinuousArchivingFailing',
        message: 'unable to upload WAL',
      },
    ];

    const finding = findingsById({ cluster })['wal-archiving-failing'];

    expect(finding.severity).toBe('critical');
    expect(finding.evidence.join(' ')).toContain('unable to upload WAL');
  });

  it('reports unknown when a backup destination is configured but no condition exists yet', () => {
    const cluster = healthyCluster();
    cluster.status!.conditions = [];

    expect(findingsById({ cluster })['wal-archiving-failing'].severity).toBe('unknown');
  });

  it('says nothing when the cluster has no backup destination to archive to', () => {
    // The absence of archiving is already stated by the recoverability rule;
    // repeating it here would double-count the same problem.
    const cluster = healthyCluster();
    cluster.spec = { instances: 3 };
    cluster.status!.conditions = [];

    expect(ruleIds({ cluster })).not.toContain('wal-archiving-failing');
  });

  it('stays quiet when archiving is working', () => {
    expect(ruleIds()).not.toContain('wal-archiving-failing');
  });
});

describe('rule: single-instance cluster', () => {
  it('warns that a one-instance cluster has no high availability', () => {
    const cluster = healthyCluster();
    cluster.spec!.instances = 1;
    cluster.status!.instances = 1;
    cluster.status!.readyInstances = 1;

    const finding = findingsById({ cluster })['single-instance'];

    expect(finding.severity).toBe('warning');
    expect(finding.message).toContain('high availability');
  });

  it('stays quiet for a multi-instance cluster', () => {
    expect(ruleIds()).not.toContain('single-instance');
  });

  it('reports unknown when the spec does not say how many instances are wanted', () => {
    const cluster = healthyCluster();
    cluster.spec!.instances = undefined;

    expect(findingsById({ cluster })['single-instance'].severity).toBe('unknown');
  });
});

describe('rule: recent primary change', () => {
  it('is critical while the operator reports the primary as failing', () => {
    const cluster = healthyCluster();
    cluster.status!.currentPrimaryFailingSinceTimestamp = at(5 * 60 * 1000);

    const finding = findingsById({ cluster })['recent-primary-change'];

    expect(finding.severity).toBe('critical');
    expect(finding.message).toContain('failing');
  });

  it('warns while the primary is being moved', () => {
    const cluster = healthyCluster();
    cluster.status!.targetPrimary = 'pg-1-2';

    const finding = findingsById({ cluster })['recent-primary-change'];

    expect(finding.severity).toBe('warning');
    expect(finding.evidence.join(' ')).toContain('pg-1-2');
  });

  it('warns about a primary that changed within the last day', () => {
    const cluster = healthyCluster();
    cluster.status!.currentPrimaryTimestamp = at(3 * HOUR);

    const finding = findingsById({ cluster })['recent-primary-change'];

    expect(finding.severity).toBe('warning');
    expect(finding.message).toContain('3 hours');
  });

  it('says plainly that CRD data cannot tell planned from unplanned', () => {
    const cluster = healthyCluster();
    cluster.status!.currentPrimaryTimestamp = at(3 * HOUR);

    expect(findingsById({ cluster })['recent-primary-change'].evidence.join(' ')).toMatch(
      /planned/i
    );
  });

  it('does not flag the first primary of a cluster that was just created', () => {
    // Every new cluster elects a primary; that is not an event worth reporting.
    const cluster = healthyCluster();
    cluster.metadata!.creationTimestamp = at(2 * HOUR);
    cluster.status!.currentPrimaryTimestamp = at(2 * HOUR);

    expect(ruleIds({ cluster })).not.toContain('recent-primary-change');
  });

  it('stays quiet for a primary that has been stable for weeks', () => {
    expect(ruleIds()).not.toContain('recent-primary-change');
  });

  it('stays quiet rather than guessing when no primary timestamp is reported', () => {
    const cluster = healthyCluster();
    cluster.status!.currentPrimaryTimestamp = undefined;

    expect(ruleIds({ cluster })).not.toContain('recent-primary-change');
  });
});
