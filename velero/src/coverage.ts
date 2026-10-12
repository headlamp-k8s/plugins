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
  /** Velero Schedule status.phase (e.g. FailedValidation). */
  phase?: string;
  /** Schedule metadata.creationTimestamp — fallback anchor for `@every` next-run. */
  creationTimestamp?: string;
  /** Schedule status.lastBackup timestamp — preferred `@every` next-run anchor. */
  lastBackupTime?: string;
  /** Schedule status.lastSkipped — preferred over lastBackup when newer (e.g. skipImmediately). */
  lastSkippedTime?: string;
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
  /** Operator-facing status: FailedValidation, Paused, or Active. */
  statusDisplay?: string;
}

// Include Velero/kubectl short names (ShortcutExpander) so includedResources like
// "deploy", "sts", and "pvc" match the same kinds as the plural/group forms.
// Include plural, singular, short names, and qualified forms Velero resolves via discovery
// (e.g. deployment.apps — qualified singular is valid in includedResources).
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
// Only discovery names: persistentvolumeclaims / persistentvolumeclaim / pvc.
// Do not include "pvcs" — it is not a Kubernetes short name and Velero leaves it unresolved.
const PVC_ALIASES = new Set(['persistentvolumeclaims', 'persistentvolumeclaim', 'pvc']);

/** Known cluster-scoped resource names (not Deployments/STS/PVCs in a namespace). */
const CLUSTER_SCOPED_RESOURCE_ALIASES = new Set([
  'nodes',
  'node',
  'persistentvolumes',
  'persistentvolume',
  'pv',
  'storageclasses',
  'storageclass',
  'sc',
  'storageclasses.storage.k8s.io',
  'storageclass.storage.k8s.io',
  'namespaces',
  'namespace',
  'ns',
  'clusterroles',
  'clusterrole',
  'clusterrolebindings',
  'clusterrolebinding',
  'customresourcedefinitions',
  'customresourcedefinition',
  'crd',
  'crds',
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

function scheduleStatusDisplay(schedule: ScheduleCoverageInput): string {
  if (schedule.phase === 'FailedValidation') {
    return 'FailedValidation';
  }
  if (schedule.paused) {
    return 'Paused';
  }
  return 'Active';
}

/** Later of two ISO timestamps (invalid/missing ignored). */
function laterTimestamp(a?: string, b?: string): string | undefined {
  const aMs = a ? Date.parse(a) : Number.NaN;
  const bMs = b ? Date.parse(b) : Number.NaN;
  const aOk = !Number.isNaN(aMs);
  const bOk = !Number.isNaN(bMs);
  if (aOk && bOk) {
    return aMs >= bMs ? a : b;
  }
  if (aOk) {
    return a;
  }
  if (bOk) {
    return b;
  }
  return undefined;
}

/**
 * Anchor for `@every` next-run: later of status.lastBackup / status.lastSkipped,
 * else latest Backup timestamps, else schedule creation.
 */
function everyRunAnchor(
  schedule: ScheduleCoverageInput,
  lastBackup: BackupCoverageInput | undefined
): Date | undefined {
  const raw =
    laterTimestamp(schedule.lastBackupTime, schedule.lastSkippedTime) ??
    lastBackup?.completionTimestamp ??
    lastBackup?.startTimestamp ??
    schedule.creationTimestamp;
  if (!raw) {
    return undefined;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * True when the backup template can include namespaced objects.
 * Used by the namespace panel so schedules that only select cluster-scoped
 * kinds (or exclude all namespaced kinds) are not listed as targeting the namespace.
 */
function mayCoverNamespacedObjects(template: VeleroBackupTemplate): boolean {
  const nsExcluded = template.excludedNamespaceScopedResources ?? [];
  if (nsExcluded.some(name => name === '*')) {
    return false;
  }

  // Explicit namespace-scoped include list means the schedule intends namespaced kinds.
  const nsIncluded = template.includedNamespaceScopedResources ?? [];
  if (nsIncluded.length > 0) {
    return true;
  }

  const included = template.includedResources ?? [];
  if (included.length === 0 || included.some(name => name === '*')) {
    return true;
  }

  return included.some(name => !CLUSTER_SCOPED_RESOURCE_ALIASES.has(name.toLowerCase()));
}

function toScheduleCoverageResult(
  schedule: ScheduleCoverageInput,
  backups: BackupCoverageInput[]
): ScheduleCoverageResult {
  const paused = !!schedule.paused;
  const failedValidation = schedule.phase === 'FailedValidation';
  const lastBackup = getLatestBackupForSchedule(backups, schedule.name);
  return {
    scheduleName: schedule.name,
    cronSchedule: schedule.cronSchedule,
    paused,
    statusDisplay: scheduleStatusDisplay(schedule),
    // Paused / invalid schedules do not create new backups; do not show a misleading next run.
    nextScheduledRun:
      paused || failedValidation
        ? undefined
        : formatNextScheduledRun(
            schedule.cronSchedule,
            new Date(),
            everyRunAnchor(schedule, lastBackup)
          ),
    lastBackup,
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

/**
 * Returns schedules whose backup template *targets* the namespace.
 * Checks namespace include/exclude and filters out templates that cannot cover any
 * namespaced objects (e.g. nodes-only or excludedNamespaceScopedResources: ['*']).
 * Does not evaluate label selectors against live objects in the namespace.
 */
export function getSchedulesForNamespace(
  schedules: ScheduleCoverageInput[],
  backups: BackupCoverageInput[],
  namespace: string
): ScheduleCoverageResult[] {
  return schedules
    .filter(schedule => {
      if (schedule.phase === 'FailedValidation') {
        return false;
      }
      const template = schedule.template ?? {};
      return namespaceIncluded(template, namespace) && mayCoverNamespacedObjects(template);
    })
    .map(schedule => toScheduleCoverageResult(schedule, backups));
}
