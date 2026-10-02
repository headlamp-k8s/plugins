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
  template: VeleroBackupTemplate;
  cronSchedule?: string;
  /** When true, the schedule does not create new backups. */
  paused?: boolean;
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
  /** True when the schedule is paused and will not create new backups. */
  paused?: boolean;
}

// Include Velero/kubectl short names (ShortcutExpander) so includedResources like
// "deploy", "sts", and "pvc" match the same kinds as the plural/group forms.
const DEPLOYMENT_ALIASES = new Set([
  'deployments',
  'deployment',
  'deploy',
  'deployments.apps',
]);
const STATEFULSET_ALIASES = new Set([
  'statefulsets',
  'statefulset',
  'sts',
  'statefulsets.apps',
]);
const PVC_ALIASES = new Set([
  'persistentvolumeclaims',
  'persistentvolumeclaim',
  'pvc',
  'pvcs',
]);

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

function resourceIncluded(
  template: VeleroBackupTemplate,
  kind: WorkloadTarget['resourceKind']
): boolean {
  const excluded = template.excludedResources ?? [];
  if (excluded.some(name => resourceNameMatchesKind(name, kind))) {
    return false;
  }

  const included = template.includedResources ?? [];
  if (included.length === 0 || included.some(name => name === '*')) {
    return true;
  }

  return included.some(name => resourceNameMatchesKind(name, kind));
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
  return new RegExp(re).test(namespace);
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
 * Paused schedules still "match" the template so they can be shown as paused;
 * callers decide how to present them via {@link ScheduleCoverageResult.paused}.
 */
export function scheduleCoversWorkload(
  schedule: ScheduleCoverageInput,
  target: WorkloadTarget
): boolean {
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
  // Prefer start time so a newer in-progress backup outranks an older completed one.
  const value = backup.startTimestamp ?? backup.completionTimestamp;
  return value ? Date.parse(value) : 0;
}

function toScheduleCoverageResult(
  schedule: ScheduleCoverageInput,
  backups: BackupCoverageInput[]
): ScheduleCoverageResult {
  const paused = !!schedule.paused;
  return {
    scheduleName: schedule.name,
    cronSchedule: schedule.cronSchedule,
    paused,
    // Paused schedules do not create new backups; do not show a misleading next run.
    nextScheduledRun: paused ? undefined : formatNextScheduledRun(schedule.cronSchedule),
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
