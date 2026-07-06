import { formatNextScheduledRun } from './cron';
import type { VeleroBackupTemplate } from './resources/velero';

/** A Headlamp workload whose Velero schedule coverage should be evaluated. */
export interface WorkloadTarget {
  namespace: string;
  labels: Record<string, string>;
  resourceKind: 'deployments' | 'statefulsets' | 'persistentvolumeclaims';
}

/** Normalized Velero Schedule fields used for coverage matching. */
export interface ScheduleCoverageInput {
  name: string;
  template: VeleroBackupTemplate;
  cronSchedule?: string;
}

/** Normalized Velero Backup fields joined onto schedule coverage results. */
export interface BackupCoverageInput {
  name: string;
  scheduleName?: string;
  phase?: string;
  startTimestamp?: string;
  completionTimestamp?: string;
}

/** Schedule coverage shown in the backup coverage panel. */
export interface ScheduleCoverageResult {
  scheduleName: string;
  cronSchedule?: string;
  nextScheduledRun?: string;
  lastBackup?: BackupCoverageInput;
}

const DEPLOYMENT_ALIASES = new Set(['deployments', 'deployments.apps']);
const STATEFULSET_ALIASES = new Set(['statefulsets', 'statefulsets.apps']);
const PVC_ALIASES = new Set(['persistentvolumeclaims', 'persistentvolumeclaims', 'pvcs']);

function normalizeResourceName(name: string): string {
  return name.split('.')[0].toLowerCase();
}

function resourceAliases(kind: WorkloadTarget['resourceKind']): Set<string> {
  switch (kind) {
    case 'deployments':
      return DEPLOYMENT_ALIASES;
    case 'statefulsets':
      return STATEFULSET_ALIASES;
    case 'persistentvolumeclaims':
      return PVC_ALIASES;
    default:
      return new Set([kind]);
  }
}

function resourceIncluded(
  template: VeleroBackupTemplate,
  kind: WorkloadTarget['resourceKind']
): boolean {
  const excluded = (template.excludedResources ?? []).map(normalizeResourceName);
  if (excluded.includes(kind)) {
    return false;
  }

  const included = (template.includedResources ?? []).map(normalizeResourceName);
  if (included.length === 0 || included.includes('*')) {
    return true;
  }

  const aliases = resourceAliases(kind);
  return included.some(name => aliases.has(name) || included.includes(kind));
}

function namespaceIncluded(template: VeleroBackupTemplate, namespace: string): boolean {
  const excluded = template.excludedNamespaces ?? [];
  if (excluded.includes(namespace)) {
    return false;
  }

  const included = template.includedNamespaces ?? [];
  if (included.length === 0) {
    return true;
  }

  return included.includes(namespace);
}

function labelsMatch(template: VeleroBackupTemplate, labels: Record<string, string>): boolean {
  const matchLabels = template.labelSelector?.matchLabels;
  if (!matchLabels || Object.keys(matchLabels).length === 0) {
    return true;
  }

  return Object.entries(matchLabels).every(([key, value]) => labels[key] === value);
}

/**
 * Returns whether a Velero schedule template covers the given workload.
 * Matches included/excluded namespaces and resources, then label selectors.
 */
export function scheduleCoversWorkload(
  schedule: ScheduleCoverageInput,
  target: WorkloadTarget
): boolean {
  const template = schedule.template ?? {};
  return (
    namespaceIncluded(template, target.namespace) &&
    resourceIncluded(template, target.resourceKind) &&
    labelsMatch(template, target.labels)
  );
}

/** Returns the most recent backup created by the given schedule, if any. */
export function getLatestBackupForSchedule(
  backups: BackupCoverageInput[],
  scheduleName: string
): BackupCoverageInput | undefined {
  return backups
    .filter(backup => backup.scheduleName === scheduleName)
    .sort((a, b) => backupTimestamp(b) - backupTimestamp(a))[0];
}

function backupTimestamp(backup: BackupCoverageInput): number {
  const value = backup.completionTimestamp ?? backup.startTimestamp;
  return value ? Date.parse(value) : 0;
}

function toScheduleCoverageResult(
  schedule: ScheduleCoverageInput,
  backups: BackupCoverageInput[]
): ScheduleCoverageResult {
  return {
    scheduleName: schedule.name,
    cronSchedule: schedule.cronSchedule,
    nextScheduledRun: formatNextScheduledRun(schedule.cronSchedule),
    lastBackup: getLatestBackupForSchedule(backups, schedule.name),
  };
}

/** Returns schedules that cover a workload, each with cron and last-backup metadata. */
export function getCoveringSchedules(
  schedules: ScheduleCoverageInput[],
  backups: BackupCoverageInput[],
  target: WorkloadTarget
): ScheduleCoverageResult[] {
  return schedules
    .filter(schedule => scheduleCoversWorkload(schedule, target))
    .map(schedule => toScheduleCoverageResult(schedule, backups));
}

/** Returns schedules whose template includes the namespace, with last-backup metadata. */
export function getSchedulesForNamespace(
  schedules: ScheduleCoverageInput[],
  backups: BackupCoverageInput[],
  namespace: string
): ScheduleCoverageResult[] {
  return schedules
    .filter(schedule => namespaceIncluded(schedule.template ?? {}, namespace))
    .map(schedule => toScheduleCoverageResult(schedule, backups));
}
