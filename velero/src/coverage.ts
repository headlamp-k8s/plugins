import { formatNextScheduledRun } from './cron';
import type {
  LabelSelector,
  LabelSelectorRequirement,
  VeleroBackupTemplate,
} from './resources/velero';

/** Label Velero uses to skip an individual resource from backup. */
export const VELERO_EXCLUDE_FROM_BACKUP_LABEL = 'velero.io/exclude-from-backup';

/** A Headlamp workload whose Velero schedule coverage should be evaluated. */
export interface WorkloadTarget {
  namespace: string;
  labels: Record<string, string>;
  resourceKind: 'deployments' | 'statefulsets' | 'persistentvolumeclaims';
}

/** Normalized Velero Schedule fields used for coverage matching. */
export interface ScheduleCoverageInput {
  name: string;
  /** Headlamp cluster id — required so multi-cluster lookups do not cross wires. */
  cluster?: string;
  template: VeleroBackupTemplate;
  cronSchedule?: string;
  /** When true, the schedule does not create new backups. */
  paused?: boolean;
  /** Velero Schedule status.phase (e.g. FailedValidation). */
  phase?: string;
  /** Schedule metadata.creationTimestamp — fallback anchor for `@every` next-run. */
  creationTimestamp?: string;
  /** Schedule status.lastBackup timestamp — preferred `@every` next-run anchor. */
  lastBackupTime?: string;
  /** Schedule status.lastSkipped — Velero uses max(lastBackup, lastSkipped) as cron anchor. */
  lastSkippedTime?: string;
}

/** Normalized Velero Backup fields joined onto schedule coverage results. */
export interface BackupCoverageInput {
  name: string;
  /** Headlamp cluster id — paired with scheduleName for multi-cluster lookups. */
  cluster?: string;
  scheduleName?: string;
  phase?: string;
  startTimestamp?: string;
  completionTimestamp?: string;
  /** Fallback when status timestamps are unset (e.g. New / Queued / ReadyToStart). */
  creationTimestamp?: string;
}

/** Map key for latest-Backup lookups: cluster + schedule name (cluster may be empty). */
export function scheduleBackupLookupKey(cluster: string | undefined, scheduleName: string): string {
  return `${cluster ?? ''}\0${scheduleName}`;
}

/** Schedule coverage shown in the backup coverage panel. */
export interface ScheduleCoverageResult {
  scheduleName: string;
  cronSchedule?: string;
  nextScheduledRun?: string;
  lastBackup?: BackupCoverageInput;
  /** True when the schedule is paused and will not create new backups. */
  paused?: boolean;
  /** Operator-facing status: FailedValidation, Paused, Active, New, or Unknown. */
  statusDisplay?: string;
}

// Include Velero/kubectl short names (ShortcutExpander) so includedResources like
// "deploy", "sts", and "pvc" match the same kinds as the plural/group forms.
const DEPLOYMENT_ALIASES = new Set([
  'deployments',
  'deployment',
  'deploy',
  'deployments.apps',
  'deployment.apps',
]);
const STATEFULSET_ALIASES = new Set([
  'statefulsets',
  'statefulset',
  'sts',
  'statefulsets.apps',
  'statefulset.apps',
]);
// Only discovery short names: persistentvolumeclaims / persistentvolumeclaim / pvc.
// Do not include "pvcs" — it is not a Kubernetes short name and Velero leaves it unresolved.
const PVC_ALIASES = new Set(['persistentvolumeclaims', 'persistentvolumeclaim', 'pvc']);

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

/**
 * True when a Velero included/excluded resource name refers to this workload kind.
 * Only known short names and apps/core aliases match — do not strip arbitrary
 * API groups (e.g. deployments.example.com must not match apps Deployments).
 */
function resourceNameMatchesKind(
  resourceName: string,
  kind: WorkloadTarget['resourceKind']
): boolean {
  return resourceAliases(kind).has(resourceName.toLowerCase());
}

/**
 * True when include/exclude resource lists allow this namespaced workload kind.
 * Honors both legacy `includedResources`/`excludedResources` and Velero's
 * `includedNamespaceScopedResources`/`excludedNamespaceScopedResources`.
 */
function resourceIncluded(
  template: VeleroBackupTemplate,
  kind: WorkloadTarget['resourceKind']
): boolean {
  // Namespace-scoped `*` means exclude every namespaced kind (Velero BackupSpec).
  const nsExcluded = template.excludedNamespaceScopedResources ?? [];
  if (
    nsExcluded.some(name => name === '*') ||
    nsExcluded.some(name => resourceNameMatchesKind(name, kind))
  ) {
    return false;
  }

  // Legacy excludedResources: match known kind aliases only (do not treat `*` as exclude-all).
  const legacyExcluded = template.excludedResources ?? [];
  if (legacyExcluded.some(name => resourceNameMatchesKind(name, kind))) {
    return false;
  }

  const included = template.includedResources ?? [];
  const nsIncluded = template.includedNamespaceScopedResources ?? [];

  const legacyAllows =
    included.length === 0 ||
    included.some(name => name === '*') ||
    included.some(name => resourceNameMatchesKind(name, kind));

  // When the newer namespace-scoped include list is set, the kind must appear there
  // (or the list must be `*`). Empty means "no extra filter" and legacy rules apply.
  const nsScopedAllows =
    nsIncluded.length === 0 ||
    nsIncluded.some(name => name === '*') ||
    nsIncluded.some(name => resourceNameMatchesKind(name, kind));

  return legacyAllows && nsScopedAllows;
}

/**
 * Matches a Velero namespace glob pattern (`*`, `?`, `[abc]`) against a namespace.
 * See https://velero.io/docs/main/namespace-glob-patterns/
 */
export function matchesNamespaceGlob(pattern: string, namespace: string): boolean {
  if (pattern === '*') {
    return true;
  }

  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      re += '.*';
    } else if (c === '?') {
      re += '.';
    } else if (c === '[') {
      const end = pattern.indexOf(']', i + 1);
      if (end === -1) {
        re += '\\[';
      } else {
        re += pattern.slice(i, end + 1);
        i = end;
      }
    } else if (/[.+^${}()|\\]/.test(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  re += '$';
  try {
    return new RegExp(re).test(namespace);
  } catch {
    // Invalid patterns (e.g. `[z-a]`) must fail closed — never crash coverage panels.
    return false;
  }
}

function namespaceIncluded(template: VeleroBackupTemplate, namespace: string): boolean {
  const excluded = template.excludedNamespaces ?? [];
  if (excluded.some(pattern => matchesNamespaceGlob(pattern, namespace))) {
    return false;
  }

  const included = template.includedNamespaces ?? [];
  // Empty or explicit '*' means all namespaces (Velero default).
  if (included.length === 0 || included.some(pattern => pattern === '*')) {
    return true;
  }

  return included.some(pattern => matchesNamespaceGlob(pattern, namespace));
}

function isExcludedFromBackup(labels: Record<string, string>): boolean {
  return labels[VELERO_EXCLUDE_FROM_BACKUP_LABEL] === 'true';
}

function hasSelectorTerms(selector: LabelSelector | undefined): boolean {
  if (!selector) {
    return false;
  }
  return (
    Object.keys(selector.matchLabels ?? {}).length > 0 ||
    (selector.matchExpressions ?? []).length > 0
  );
}

/**
 * Evaluates one Kubernetes label selector.
 * Unknown operators fail closed (do not treat as "match all").
 */
function matchesLabelSelector(
  selector: LabelSelector | undefined,
  labels: Record<string, string>
): boolean {
  if (!hasSelectorTerms(selector)) {
    return true;
  }

  const matchLabels = selector!.matchLabels ?? {};
  for (const [key, value] of Object.entries(matchLabels)) {
    if (labels[key] !== value) {
      return false;
    }
  }

  for (const expression of selector!.matchExpressions ?? []) {
    if (!matchesExpression(expression, labels)) {
      return false;
    }
  }

  return true;
}

function matchesExpression(
  expression: LabelSelectorRequirement,
  labels: Record<string, string>
): boolean {
  const values = expression.values ?? [];
  const hasKey = Object.prototype.hasOwnProperty.call(labels, expression.key);
  const labelValue = labels[expression.key];

  switch (expression.operator) {
    case 'In':
      return hasKey && values.includes(labelValue);
    case 'NotIn':
      return !hasKey || !values.includes(labelValue);
    case 'Exists':
      return hasKey;
    case 'DoesNotExist':
      return !hasKey;
    default:
      // Unknown operator: fail closed so we never report false coverage.
      return false;
  }
}

/**
 * Velero uses `orLabelSelectors` when set (match if any selector matches),
 * otherwise `labelSelector`. Empty / missing selectors match all resources.
 */
function labelsMatch(template: VeleroBackupTemplate, labels: Record<string, string>): boolean {
  const orSelectors = template.orLabelSelectors ?? [];
  if (orSelectors.length > 0) {
    return orSelectors.some(selector => matchesLabelSelector(selector, labels));
  }

  return matchesLabelSelector(template.labelSelector, labels);
}

/**
 * Returns whether a Velero schedule template covers the given workload.
 * Matches included/excluded namespaces (with Velero globs) and resources,
 * label selectors (`matchLabels`, `matchExpressions`, `orLabelSelectors`),
 * and the `velero.io/exclude-from-backup` label.
 *
 * FailedValidation schedules never cover (Velero will not create backups).
 * Paused schedules still "match" the template so they can be shown as paused;
 * callers decide how to present them via {@link ScheduleCoverageResult.paused}.
 */
export function scheduleCoversWorkload(
  schedule: ScheduleCoverageInput,
  target: WorkloadTarget
): boolean {
  if (schedule.phase === 'FailedValidation') {
    return false;
  }

  if (isExcludedFromBackup(target.labels)) {
    return false;
  }

  const template = schedule.template ?? {};
  return (
    namespaceIncluded(template, target.namespace) &&
    resourceIncluded(template, target.resourceKind) &&
    labelsMatch(template, target.labels)
  );
}

function backupTimestamp(backup: BackupCoverageInput): number {
  // Prefer start time so a newer in-progress backup outranks an older completed one.
  // Fall back to creationTimestamp for pre-execution phases without status times.
  const value = backup.startTimestamp ?? backup.completionTimestamp ?? backup.creationTimestamp;
  return value ? Date.parse(value) : 0;
}

/**
 * One-pass map of (cluster, schedule name) → latest Backup (O(backups)).
 * Keys use {@link scheduleBackupLookupKey} so same-named schedules on different
 * clusters do not share a latest Backup.
 */
export function buildLatestBackupBySchedule(
  backups: BackupCoverageInput[]
): Map<string, BackupCoverageInput> {
  const latest = new Map<string, BackupCoverageInput>();
  for (const backup of backups) {
    const scheduleName = backup.scheduleName;
    if (!scheduleName) {
      continue;
    }
    const key = scheduleBackupLookupKey(backup.cluster, scheduleName);
    const prev = latest.get(key);
    if (!prev || backupTimestamp(backup) > backupTimestamp(prev)) {
      latest.set(key, backup);
    }
  }
  return latest;
}

/** Returns the most recent backup created by the given schedule (and cluster), if any. */
export function getLatestBackupForSchedule(
  backups: BackupCoverageInput[],
  scheduleName: string,
  cluster?: string
): BackupCoverageInput | undefined {
  return buildLatestBackupBySchedule(backups).get(scheduleBackupLookupKey(cluster, scheduleName));
}

function scheduleStatusDisplay(schedule: ScheduleCoverageInput): string {
  if (schedule.phase === 'FailedValidation') {
    return 'FailedValidation';
  }
  if (schedule.paused) {
    return 'Paused';
  }
  if (schedule.phase === 'Enabled') {
    return 'Active';
  }
  if (schedule.phase === 'New') {
    return 'New';
  }
  return schedule.phase || 'Unknown';
}

/** True when Velero will create backups from this schedule (Enabled + not paused). */
function isActivelyScheduling(schedule: ScheduleCoverageInput): boolean {
  return schedule.phase === 'Enabled' && !schedule.paused;
}

function parseValidDate(raw?: string): Date | undefined {
  if (!raw) {
    return undefined;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Anchor for `@every` next-run: later of status.lastBackup / status.lastSkipped
 * (Velero controller behavior), else latest Backup timestamps, else schedule
 * creationTimestamp.
 */
export function resolveEveryRunAnchor(opts: {
  lastBackupTime?: string;
  lastSkippedTime?: string;
  creationTimestamp?: string;
  lastBackup?: BackupCoverageInput;
}): Date | undefined {
  const lastBackupStatus = parseValidDate(opts.lastBackupTime);
  const lastSkipped = parseValidDate(opts.lastSkippedTime);
  if (lastBackupStatus && lastSkipped) {
    return lastBackupStatus.getTime() >= lastSkipped.getTime() ? lastBackupStatus : lastSkipped;
  }
  if (lastBackupStatus) {
    return lastBackupStatus;
  }
  if (lastSkipped) {
    return lastSkipped;
  }

  return (
    parseValidDate(opts.lastBackup?.completionTimestamp) ??
    parseValidDate(opts.lastBackup?.startTimestamp) ??
    parseValidDate(opts.lastBackup?.creationTimestamp) ??
    parseValidDate(opts.creationTimestamp)
  );
}

function toScheduleCoverageResult(
  schedule: ScheduleCoverageInput,
  lastBackup: BackupCoverageInput | undefined
): ScheduleCoverageResult {
  const paused = !!schedule.paused;
  const activelyScheduling = isActivelyScheduling(schedule);
  return {
    scheduleName: schedule.name,
    cronSchedule: schedule.cronSchedule,
    paused,
    statusDisplay: scheduleStatusDisplay(schedule),
    // Only Enabled schedules get a next-run; New/Unknown must not look Active.
    nextScheduledRun: activelyScheduling
      ? formatNextScheduledRun(
          schedule.cronSchedule,
          new Date(),
          resolveEveryRunAnchor({
            lastBackupTime: schedule.lastBackupTime,
            lastSkippedTime: schedule.lastSkippedTime,
            creationTimestamp: schedule.creationTimestamp,
            lastBackup,
          })
        )
      : undefined,
    lastBackup,
  };
}

/** Returns schedules that cover a workload, each with cron and last-backup metadata. */
export function getCoveringSchedules(
  schedules: ScheduleCoverageInput[],
  backups: BackupCoverageInput[],
  target: WorkloadTarget
): ScheduleCoverageResult[] {
  const latestBySchedule = buildLatestBackupBySchedule(backups);
  return schedules
    .filter(schedule => scheduleCoversWorkload(schedule, target))
    .map(schedule =>
      toScheduleCoverageResult(
        schedule,
        latestBySchedule.get(scheduleBackupLookupKey(schedule.cluster, schedule.name))
      )
    );
}

/**
 * Returns schedules whose backup template *targets* the namespace (include/exclude
 * namespace filters only). This is not object-level coverage: resource includes and
 * label selectors are not evaluated against objects in the namespace.
 */
export function getSchedulesForNamespace(
  schedules: ScheduleCoverageInput[],
  backups: BackupCoverageInput[],
  namespace: string
): ScheduleCoverageResult[] {
  const latestBySchedule = buildLatestBackupBySchedule(backups);
  return schedules
    .filter(
      schedule =>
        schedule.phase !== 'FailedValidation' &&
        namespaceIncluded(schedule.template ?? {}, namespace)
    )
    .map(schedule =>
      toScheduleCoverageResult(
        schedule,
        latestBySchedule.get(scheduleBackupLookupKey(schedule.cluster, schedule.name))
      )
    );
}
