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

import {
  BackupConfiguration,
  describeBackupConfiguration,
  getContinuousArchivingStatus,
  getFirstRecoverabilityPoint,
  summarizeBackups,
} from '../utils/backupFacts';
import { getPhaseSeverity } from '../utils/clusterPhase';
import { estimateScheduleIntervalMs } from './cron';
import { Finding, InsightsContext, InsightsProvider } from './types';

/**
 * The deterministic rules engine.
 *
 * Every rule is a pure function of the context, including the current time,
 * which is passed in rather than read from the clock. Rules answer day-2
 * questions from CRD data alone; where the data cannot answer a question, the
 * rule says "unknown" rather than assuming the reassuring case.
 */

export const RULES_PROVIDER_NAME = 'CloudNativePG rules';

/** A rule's output before the registry stamps it with its provider. */
type RuleFinding = Omit<Finding, 'source'>;

type Rule = (context: InsightsContext) => RuleFinding | null;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** How long after a primary change the change is still worth reporting. */
const PRIMARY_CHANGE_WINDOW = DAY;

/**
 * Renders a duration the way an operator would say it out loud.
 *
 * Hours are kept up to three days rather than rounding into days, because
 * "30 hours ago, scheduled every 24 hours" states the problem and
 * "1 day ago, scheduled every 1 day" hides it.
 */
function humanDuration(ms: number): string {
  const units: Array<[number, string]> = [
    [3 * DAY, 'day'],
    [HOUR, 'hour'],
    [MINUTE, 'minute'],
  ];

  for (const [threshold, label] of units) {
    if (ms >= threshold) {
      const size = label === 'day' ? DAY : label === 'hour' ? HOUR : MINUTE;
      const count = Math.floor(ms / size);
      return `${count} ${label}${count === 1 ? '' : 's'}`;
    }
  }

  return 'less than a minute';
}

/** Milliseconds between `timestamp` and now, or null if unusable. */
function ageMs(timestamp: string | null | undefined, now: number): number | null {
  if (!timestamp) {
    return null;
  }

  const parsed = Date.parse(timestamp);

  return Number.isNaN(parsed) ? null : now - parsed;
}

/**
 * Rule 1: is the last successful backup late for its own schedule?
 *
 * Only fires when a schedule exists — with no schedule there is nothing to be
 * late against, and the absence of backups is the recoverability rule's
 * business. One missed run is a warning, because a run can simply be slow; two
 * missed runs is a pattern and is critical.
 */
const staleBackup: Rule = ({
  cluster,
  backups,
  backupsReadable,
  scheduledBackups,
  scheduledBackupsReadable,
  now,
}) => {
  const schedules = scheduledBackups;

  // An unread schedule list is not an absent one: without it there is no
  // cadence to be late against, and saying nothing would read as "on time".
  if (!scheduledBackupsReadable) {
    return {
      id: 'stale-backup',
      severity: 'unknown',
      message: 'Cannot tell whether backups are on time: the backup schedules could not be read.',
      evidence: ['ScheduledBackup objects for this cluster could not be read'],
    };
  }

  if (schedules.length === 0) {
    return null;
  }

  const failing = schedules.find(schedule => schedule.error);
  if (failing) {
    return {
      id: 'stale-backup',
      severity: 'critical',
      message: `Backup schedule "${failing.name}" is not running: the operator reported an error.`,
      evidence: [`ScheduledBackup ${failing.name}: ${failing.error}`],
    };
  }

  const active = schedules.filter(schedule => !schedule.suspended);
  if (active.length === 0) {
    return {
      id: 'stale-backup',
      severity: 'warning',
      message:
        'Every backup schedule for this cluster is suspended, so no backups are being taken.',
      evidence: schedules.map(schedule => `ScheduledBackup ${schedule.name} is suspended`),
    };
  }

  // The shortest interval wins: if any schedule promises hourly backups, a
  // backup older than a few hours is late whatever the other schedules say.
  const intervals = active.map(schedule => ({
    schedule,
    interval: estimateScheduleIntervalMs(schedule.schedule),
  }));
  const known = intervals.filter(entry => entry.interval !== null) as Array<{
    schedule: (typeof intervals)[number]['schedule'];
    interval: number;
  }>;

  const { lastSuccessful } = summarizeBackups(backups);
  const backupAge = ageMs(lastSuccessful?.completedAt, now);

  if (known.length === 0) {
    return {
      id: 'stale-backup',
      severity: 'unknown',
      message: 'Cannot tell whether backups are on time: the schedule is too complex to interpret.',
      evidence: intervals.map(
        entry => `ScheduledBackup ${entry.schedule.name} runs on "${entry.schedule.schedule}"`
      ),
    };
  }

  const shortest = known.reduce((best, entry) => (entry.interval < best.interval ? entry : best));
  const cadence = `every ${humanDuration(shortest.interval)}`;

  if (!lastSuccessful || backupAge === null) {
    // Only a successful read makes "no successful backup" a fact. Otherwise the
    // schedule is known and the backups are not, which is a gap, not a failure.
    if (!backupsReadable) {
      return {
        id: 'stale-backup',
        severity: 'unknown',
        message: 'Cannot tell whether backups are on time: the Backup objects could not be read.',
        evidence: [
          `ScheduledBackup ${shortest.schedule.name} runs on "${shortest.schedule.schedule}", ${cadence}`,
          'Backup objects for this cluster could not be read',
        ],
      };
    }

    return {
      id: 'stale-backup',
      severity: 'critical',
      message: `Backups are scheduled ${cadence} but a backup has never completed successfully.`,
      evidence: [
        `ScheduledBackup ${shortest.schedule.name} runs on "${shortest.schedule.schedule}"`,
        `Cluster ${cluster.metadata?.name ?? ''} has no completed Backup object`.trim(),
      ],
    };
  }

  if (backupAge <= shortest.interval) {
    return null;
  }

  const missed = Math.floor(backupAge / shortest.interval);

  return {
    id: 'stale-backup',
    severity: missed >= 2 ? 'critical' : 'warning',
    message: `Last successful backup was ${humanDuration(
      backupAge
    )} ago, but backups are scheduled ${cadence}.`,
    evidence: [
      `ScheduledBackup ${shortest.schedule.name} runs on "${shortest.schedule.schedule}", ${cadence}`,
      `Backup ${lastSuccessful.name} completed at ${lastSuccessful.completedAt}`,
      `${missed} scheduled run${missed === 1 ? '' : 's'} appear${
        missed === 1 ? 's' : ''
      } to have been missed`,
    ],
  };
};

/** "1 Backup object targets", "2 Backup objects target" — noun and verb agree. */
function backupObjectCount(total: number): string {
  return total === 1 ? '1 Backup object targets' : `${total} Backup objects target`;
}
/**
 * Names the configured destination for evidence lines.
 *
 * Only called once something is known to be configured, so the 'none' case is
 * unreachable in practice and exists to keep the function total.
 */
function describeDestination(configuration: BackupConfiguration): string {
  switch (configuration.kind) {
    case 'plugin':
      return `WAL archiver plugin: ${configuration.walArchiverPlugins.join(', ')}`;
    case 'volumeSnapshot':
      return 'Backup destination: volume snapshots on the cluster spec';
    case 'barmanObjectStore':
      return 'Backup destination: barman object store on the cluster spec';
    default:
      return 'No backup destination is configured';
  }
}

/**
 * Rule 2: could this cluster actually be restored?
 *
 * The three answers are distinct and must not be collapsed: nothing is
 * configured, something is configured but has never produced a backup, or a
 * backup exists but the operator does not publish a recovery window for it.
 */
const noRecoverabilityPoint: Rule = ({ cluster, backups, backupsReadable }) => {
  const configuration = describeBackupConfiguration(cluster);
  const point = getFirstRecoverabilityPoint(cluster);
  const { lastSuccessful, total } = summarizeBackups(backups);

  if (point) {
    return null;
  }

  // A count derived from a list that was never read is not evidence of
  // anything, so it is left out rather than reported as zero.
  const backupCountEvidence = backupsReadable
    ? [`${backupObjectCount(total)} this cluster`]
    : ['Backup objects for this cluster could not be read'];

  if (configuration.kind === 'none') {
    // The spec lives on the Cluster object, which was read. An unreadable
    // Backup list does not make a missing destination any less missing.
    return {
      id: 'no-recoverability-point',
      severity: 'critical',
      message: 'No backup destination is configured, so point-in-time recovery is not possible.',
      evidence: [
        'Cluster spec has no backup.barmanObjectStore, no backup.volumeSnapshot and no enabled WAL archiver plugin',
        ...backupCountEvidence,
      ],
    };
  }

  if (!backupsReadable) {
    return {
      id: 'no-recoverability-point',
      severity: 'unknown',
      message:
        'A backup destination is configured, but whether anything has been backed up could not be determined.',
      evidence: [describeDestination(configuration), ...backupCountEvidence],
    };
  }

  if (!lastSuccessful) {
    return {
      id: 'no-recoverability-point',
      severity: 'critical',
      message:
        'A backup destination is configured but no backup has ever completed, so point-in-time recovery is not possible.',
      evidence: [
        describeDestination(configuration),
        `${backupObjectCount(total)} this cluster, none completed`,
      ],
    };
  }

  return {
    id: 'no-recoverability-point',
    severity: 'unknown',
    message: 'Backups exist, but how far back this cluster can be restored cannot be determined.',
    evidence: [
      `Backup ${lastSuccessful.name} completed at ${lastSuccessful.completedAt}`,
      'CloudNativePG does not set firstRecoverabilityPoint for plugin-based backup methods, and Backup objects carry no equivalent field',
    ],
  };
};

/** Rule 3: the operator's own verdict on the cluster. */
const clusterPhaseUnhealthy: Rule = ({ cluster }) => {
  const phase = cluster.status?.phase;
  const severity = getPhaseSeverity(phase);

  if (severity === 'healthy') {
    return null;
  }

  const evidence = [
    phase ? `Cluster phase: ${phase}` : 'The operator has not reported a cluster phase',
  ];
  if (cluster.status?.phaseReason) {
    evidence.push(cluster.status.phaseReason);
  }

  if (severity === 'failed') {
    return {
      id: 'cluster-phase-unhealthy',
      severity: 'critical',
      message: `The operator cannot make progress: ${phase}`,
      evidence,
    };
  }

  if (severity === 'progressing') {
    return {
      id: 'cluster-phase-unhealthy',
      severity: 'info',
      message: `The operator is still working: ${phase}`,
      evidence,
    };
  }

  return {
    id: 'cluster-phase-unhealthy',
    severity: 'unknown',
    message: phase
      ? `The cluster reports a phase this plugin does not recognise: ${phase}`
      : 'The cluster does not report a phase, so its health cannot be judged.',
    evidence,
  };
};

/** Rule 4: are as many instances ready as the spec asks for? */
const readyInstancesBelowSpec: Rule = ({ cluster }) => {
  const desired = cluster.spec?.instances ?? cluster.status?.instances;
  const ready = cluster.status?.readyInstances;

  if (desired === undefined || ready === undefined) {
    return {
      id: 'ready-instances-below-spec',
      severity: 'unknown',
      message: 'Cannot tell how many instances are ready.',
      evidence: [
        `Desired instances: ${desired ?? 'not reported'}`,
        `Ready instances: ${ready ?? 'not reported'}`,
      ],
    };
  }

  if (ready >= desired) {
    return null;
  }

  return {
    id: 'ready-instances-below-spec',
    severity: ready === 0 ? 'critical' : 'warning',
    message:
      ready === 0
        ? `No instance is ready: 0 of ${desired} instances are serving.`
        : `Only ${ready} of ${desired} instances are ready.`,
    evidence: [
      `Cluster spec asks for ${desired} instance${desired === 1 ? '' : 's'}`,
      `Operator reports ${ready} ready`,
      cluster.status?.currentPrimary
        ? `Current primary: ${cluster.status.currentPrimary}`
        : 'No primary has been elected',
    ],
  };
};

/** Rule 5: the operator's ContinuousArchiving condition. */
const walArchivingFailing: Rule = ({ cluster }) => {
  const archiving = getContinuousArchivingStatus(cluster);
  const configuration = describeBackupConfiguration(cluster);

  if (archiving.state === 'failing') {
    return {
      id: 'wal-archiving-failing',
      severity: 'critical',
      message: 'WAL archiving is failing, so the recovery window is not moving forward.',
      evidence: [
        `ContinuousArchiving condition is False${archiving.reason ? ` (${archiving.reason})` : ''}`,
        archiving.message ?? 'The operator reported no detail',
      ],
    };
  }

  // With nothing configured to archive to, a missing condition is expected and
  // the real problem is already stated by the recoverability rule.
  if (archiving.state === 'unknown' && configuration.kind !== 'none') {
    return {
      id: 'wal-archiving-failing',
      severity: 'unknown',
      message: 'Cannot tell whether WAL archiving is working.',
      evidence: [
        'A backup destination is configured but the operator has not reported a ContinuousArchiving condition',
      ],
    };
  }

  return null;
};

/** Rule 6: a single-instance cluster cannot fail over. */
const singleInstance: Rule = ({ cluster }) => {
  const desired = cluster.spec?.instances;

  if (desired === undefined) {
    return {
      id: 'single-instance',
      severity: 'unknown',
      message: 'Cannot tell whether this cluster is highly available.',
      evidence: ['Cluster spec does not state how many instances are wanted'],
    };
  }

  if (desired > 1) {
    return null;
  }

  return {
    id: 'single-instance',
    severity: 'warning',
    message:
      'This cluster runs a single instance, so it has no high availability and cannot fail over.',
    evidence: [
      'Cluster spec asks for 1 instance',
      'Losing the primary means downtime until it is rescheduled and recovered',
    ],
  };
};

/**
 * Rule 7: has the primary moved recently?
 *
 * CloudNativePG records when the primary changed but not why, so this rule
 * cannot distinguish a planned switchover from a failover and says so. A
 * cluster younger than the reporting window is exempt, because electing a
 * first primary is not a primary change.
 */
const recentPrimaryChange: Rule = ({ cluster, now }) => {
  const status = cluster.status ?? {};

  const failingFor = ageMs(status.currentPrimaryFailingSinceTimestamp, now);
  if (failingFor !== null) {
    return {
      id: 'recent-primary-change',
      severity: 'critical',
      message: `The primary has been failing for ${humanDuration(failingFor)}.`,
      evidence: [
        `currentPrimaryFailingSinceTimestamp: ${status.currentPrimaryFailingSinceTimestamp}`,
        status.currentPrimary
          ? `Current primary: ${status.currentPrimary}`
          : 'No primary has been elected',
      ],
    };
  }

  if (
    status.currentPrimary &&
    status.targetPrimary &&
    status.currentPrimary !== status.targetPrimary
  ) {
    return {
      id: 'recent-primary-change',
      severity: 'warning',
      message: 'The primary is being moved right now.',
      evidence: [
        `Current primary: ${status.currentPrimary}`,
        `Target primary: ${status.targetPrimary}`,
        'CRD data does not record whether this was planned',
      ],
    };
  }

  const since = ageMs(status.currentPrimaryTimestamp, now);
  const clusterAge = ageMs(cluster.metadata?.creationTimestamp, now);

  if (since === null || since > PRIMARY_CHANGE_WINDOW) {
    return null;
  }

  // A cluster younger than the window has only ever elected its first primary.
  if (clusterAge !== null && clusterAge <= PRIMARY_CHANGE_WINDOW) {
    return null;
  }

  return {
    id: 'recent-primary-change',
    severity: 'warning',
    message: `The primary changed ${humanDuration(since)} ago.`,
    evidence: [
      `Current primary ${status.currentPrimary ?? 'unknown'} since ${
        status.currentPrimaryTimestamp
      }`,
      'CloudNativePG records when the primary changed but not why, so CRD data cannot say whether this was a planned switchover or a failover',
    ],
  };
};

const RULES: Rule[] = [
  staleBackup,
  noRecoverabilityPoint,
  clusterPhaseUnhealthy,
  readyInstancesBelowSpec,
  walArchivingFailing,
  singleInstance,
  recentPrimaryChange,
];

export const rulesProvider: InsightsProvider = {
  name: RULES_PROVIDER_NAME,
  getFindings(context) {
    return RULES.map(rule => rule(context))
      .filter((finding): finding is RuleFinding => finding !== null)
      .map(finding => ({ ...finding, source: RULES_PROVIDER_NAME }));
  },
};
