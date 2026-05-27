/**
 * Copyright 2026 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { KubeContainer } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { KubePod } from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import type { TFunction } from 'i18next';
import type {
  KubeflowTrainingRuntime,
  MLPolicy,
  RuntimePatch,
  TrainerMetric,
  TrainingRuntimeSpecPatch,
} from '../../resources/trainerCommon';
import type {
  ClusterTrainingRuntimeClass,
  TrainingRuntimeClass,
} from '../../resources/trainingRuntime';
import type { TrainJobClass } from '../../resources/trainJob';
import type { KubeflowStatusBadgeInfo } from '../common/KubeflowStatusBadge';
import { parseCpuQuantity, parseMemoryQuantity } from '../common/notebookUtils';

const GPU_RESOURCE_KEYS = ['nvidia.com/gpu', 'amd.com/gpu', 'gpu'];

/**
 * Warning message surfaced when a TrainJob or runtime has an operator-relevant issue.
 */
export interface TrainerWarning {
  severity: 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

/**
 * Aggregated CPU and memory usage strings for a pod or pod group.
 */
export interface PodMetricSummary {
  cpu: string;
  memory: string;
}

function findTrueCondition(job: TrainJobClass) {
  return (
    job.conditions.find(condition => condition.status === 'True' && condition.type === 'Failed') ??
    job.conditions.find(
      condition => condition.status === 'True' && condition.type === 'Succeeded'
    ) ??
    job.conditions.find(
      condition => condition.status === 'True' && condition.type === 'Suspended'
    ) ??
    job.conditions.find(condition => condition.status === 'True') ??
    job.latestCondition
  );
}

/**
 * Maps a TrainJob's condition state to the shared Kubeflow status badge metadata.
 */
export function getTrainJobStatusInfo(job: TrainJobClass): KubeflowStatusBadgeInfo {
  if (job.suspended) {
    return {
      label: 'Suspended',
      status: 'warning',
      icon: 'mdi:pause-circle-outline',
      reason: 'spec.suspend=true',
    };
  }

  const condition = findTrueCondition(job);
  const type = condition?.type ?? job.phase;

  if (type === 'Succeeded') {
    return {
      label: 'Succeeded',
      status: 'success',
      icon: 'mdi:check-circle',
      reason: condition?.reason ?? null,
    };
  }

  if (type === 'Failed') {
    return {
      label: 'Failed',
      status: 'error',
      icon: 'mdi:alert-circle',
      reason: condition?.reason ?? condition?.message ?? null,
    };
  }

  if (type === 'Suspended') {
    return {
      label: 'Suspended',
      status: 'warning',
      icon: 'mdi:pause-circle-outline',
      reason: condition?.reason ?? null,
    };
  }

  if (type) {
    return {
      label: type,
      status: 'warning',
      icon: 'mdi:progress-clock',
      reason: condition?.reason ?? condition?.message ?? null,
    };
  }

  return {
    label: 'Pending',
    status: 'warning',
    icon: 'mdi:clock-outline',
    reason: 'Waiting for runtime reconciliation',
  };
}

/**
 * Type guard for namespace-scoped runtime instances.
 */
export function isNamespacedRuntime(
  runtime: TrainingRuntimeClass | ClusterTrainingRuntimeClass | null
): runtime is TrainingRuntimeClass {
  return !!runtime && runtime.kind === 'TrainingRuntime';
}

/**
 * Type guard for cluster-scoped runtime instances.
 */
export function isClusterRuntime(
  runtime: TrainingRuntimeClass | ClusterTrainingRuntimeClass | null
): runtime is ClusterTrainingRuntimeClass {
  return !!runtime && runtime.kind === 'ClusterTrainingRuntime';
}

/**
 * Type guard for any supported Trainer runtime object.
 */
export function isRuntimeObject(
  runtime: unknown
): runtime is TrainingRuntimeClass | ClusterTrainingRuntimeClass {
  return (
    !!runtime &&
    typeof runtime === 'object' &&
    'kind' in runtime &&
    ((runtime as any).kind === 'TrainingRuntime' ||
      (runtime as any).kind === 'ClusterTrainingRuntime')
  );
}

/**
 * Returns the display scope for a runtime resource.
 */
export function getRuntimeScopeLabel(
  runtime: TrainingRuntimeClass | ClusterTrainingRuntimeClass,
  t: TFunction
) {
  return isNamespacedRuntime(runtime) ? t('Namespace') : t('Cluster');
}

/**
 * Infers the training framework name from a runtime definition.
 */
export function getRuntimeFamily(runtime: {
  framework?: string;
  mlPolicy?: MLPolicy;
  metadata?: { labels?: Record<string, string> };
}) {
  if (runtime.framework) {
    return runtime.framework;
  }

  if (runtime.mlPolicy?.torch) return 'torch';
  if (runtime.mlPolicy?.mpi) return 'mpi';
  if (runtime.mlPolicy?.flux) return 'flux';
  if (runtime.mlPolicy?.jax) return 'jax';
  if (runtime.mlPolicy?.xgboost) return 'xgboost';

  return 'plain';
}

/**
 * Formats a TrainJob runtime reference as `Kind/Name`.
 */
export function formatRuntimeRef(job: TrainJobClass, t?: TFunction) {
  if (!job.runtimeName) {
    return t ? t('Unspecified') : 'Unspecified';
  }
  return `${job.runtimeKind}/${job.runtimeName}`;
}

/**
 * Formats per-node resource requests and limits into a compact summary string.
 */
export function formatResourcesSummary(resources?: {
  requests?: Record<string, string>;
  limits?: Record<string, string>;
}) {
  if (!resources) {
    return '-';
  }

  const requests = resources.requests ?? {};
  const limits = resources.limits ?? {};
  const cpu = requests.cpu || limits.cpu || '-';
  const memory = requests.memory || limits.memory || '-';
  const gpu = GPU_RESOURCE_KEYS.map(key => requests[key] || limits[key]).find(Boolean) ?? undefined;

  return gpu ? `${cpu} / ${memory} / GPU ${gpu}` : `${cpu} / ${memory}`;
}

/**
 * Returns the requested or limited GPU quantity from a resource block.
 */
export function getGpuQuantity(resources?: {
  requests?: Record<string, string>;
  limits?: Record<string, string>;
}) {
  if (!resources) {
    return '';
  }

  const requests = resources.requests ?? {};
  const limits = resources.limits ?? {};

  return GPU_RESOURCE_KEYS.map(key => requests[key] || limits[key]).find(Boolean) ?? '';
}

/**
 * Summarizes aggregated child job state for a TrainJob row.
 */
export function summarizeJobsStatus(job: TrainJobClass, t?: TFunction) {
  if (job.jobsStatus.length === 0) {
    return '-';
  }

  const totals = job.jobsStatus.reduce(
    (acc, status) => {
      acc.ready += status.ready ?? 0;
      acc.active += status.active ?? 0;
      acc.failed += status.failed ?? 0;
      acc.succeeded += status.succeeded ?? 0;
      acc.suspended += status.suspended ?? 0;
      return acc;
    },
    { ready: 0, active: 0, failed: 0, succeeded: 0, suspended: 0 }
  );

  if (t) {
    return t('ready:{{ready}} active:{{active}} ok:{{succeeded}} failed:{{failed}}', totals as any);
  }

  return `ready:${totals.ready} active:${totals.active} ok:${totals.succeeded} failed:${totals.failed}`;
}

/**
 * Formats a percentage-like value for display.
 */
export function formatPercent(value?: string) {
  if (!value) {
    return '-';
  }

  return value.endsWith('%') ? value : `${value}%`;
}

/**
 * Formats seconds into a short human-readable duration.
 */
export function formatDurationSeconds(seconds?: number | null, t?: TFunction) {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return '-';
  }

  if (seconds < 60) {
    return t ? t('{{seconds}}s', { seconds }) : `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return t ? t('{{hours}}h {{minutes}}m', { hours, minutes }) : `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return t ? t('{{minutes}}m {{seconds}}s', { minutes, seconds: secs }) : `${minutes}m ${secs}s`;
  }
  return t ? t('{{seconds}}s', { seconds: secs }) : `${secs}s`;
}

/**
 * Normalizes trainer metrics into name/value rows.
 */
export function formatMetrics(metrics?: TrainerMetric[] | null) {
  if (!metrics || metrics.length === 0) {
    return [];
  }

  return metrics.map(metric => ({
    name: metric.name ?? 'metric',
    value: metric.value ?? '-',
  }));
}

/**
 * Aggregates CPU and memory usage across pod metrics objects.
 */
export function inferPodMetricSummary(
  metrics: Array<{ containers?: Array<{ usage?: Record<string, string> }> }>,
  t?: TFunction
) {
  const totalCpu = metrics.reduce((sum, metric) => {
    return (
      sum +
      (metric.containers ?? []).reduce((containerSum, container) => {
        return containerSum + parseCpuQuantity(container.usage?.cpu);
      }, 0)
    );
  }, 0);

  const totalMemory = metrics.reduce((sum, metric) => {
    return (
      sum +
      (metric.containers ?? []).reduce((containerSum, container) => {
        return containerSum + parseMemoryQuantity(container.usage?.memory);
      }, 0)
    );
  }, 0);

  return {
    cpu: totalCpu > 0 ? formatCpuCores(totalCpu, t) : '-',
    memory: totalMemory > 0 ? formatMemoryGiB(totalMemory, t) : '-',
  };
}

function formatCpuCores(cores: number, t?: TFunction) {
  if (cores >= 1) {
    const val = cores.toFixed(cores % 1 === 0 ? 0 : 1);
    return t ? t('{{val}} cores', { val }) : `${val} cores`;
  }
  return `${Math.round(cores * 1000)}m`;
}

function formatMemoryGiB(gib: number, t?: TFunction) {
  if (gib >= 1) {
    const val = gib.toFixed(gib >= 10 ? 0 : 1);
    return t ? t('{{val}} Gi', { val }) : `${val} Gi`;
  }
  const mib = gib * 1024;
  const val = mib.toFixed(mib >= 10 ? 0 : 1);
  return t ? t('{{val}} Mi', { val }) : `${val} Mi`;
}

/**
 * Builds warning banners for invalid TrainJob runtime references and scheduling gaps.
 */
export function buildTrainJobWarnings(args: {
  job: TrainJobClass;
  namespacedRuntime: TrainingRuntimeClass | null;
  clusterRuntime: ClusterTrainingRuntimeClass | null;
  runtimeError?: { status?: number; message?: string } | null;
}) {
  const { job, namespacedRuntime, clusterRuntime, runtimeError } = args;
  const warnings: TrainerWarning[] = [];

  const runtimeKind = job.runtimeKind;
  const runtime =
    runtimeKind === 'TrainingRuntime'
      ? namespacedRuntime
      : runtimeKind === 'ClusterTrainingRuntime'
      ? clusterRuntime
      : null;

  if (job.runtimeApiGroup && job.runtimeApiGroup !== 'trainer.kubeflow.org') {
    warnings.push({
      severity: 'error',
      title: 'Unsupported runtime API group',
      message: `Runtime refs must point to trainer.kubeflow.org, but this TrainJob references ${job.runtimeApiGroup}.`,
    });
  }

  if (!job.runtimeName) {
    warnings.push({
      severity: 'error',
      title: 'Missing runtime reference',
      message: 'TrainJob spec.runtimeRef.name is required to resolve the TrainingRuntime.',
    });
  } else if (!runtime && runtimeError && runtimeError.status !== 404) {
    warnings.push({
      severity: 'warning',
      title: 'Runtime resolution issue',
      message: runtimeError.message || 'Unable to fetch the referenced runtime.',
    });
  } else if (runtimeKind === 'TrainingRuntime' && !runtime) {
    warnings.push({
      severity: 'error',
      title: 'TrainingRuntime not found in namespace',
      message:
        namespacedRuntime === null && clusterRuntime
          ? 'A ClusterTrainingRuntime with the same name exists, but this TrainJob references a namespace-scoped TrainingRuntime.'
          : 'Namespace-scoped TrainingRuntime refs must exist in the same namespace as the TrainJob.',
    });
  } else if (runtimeKind === 'ClusterTrainingRuntime' && !runtime) {
    warnings.push({
      severity: 'error',
      title: 'ClusterTrainingRuntime not found',
      message:
        clusterRuntime === null && namespacedRuntime
          ? 'A namespace-scoped TrainingRuntime with the same name exists, but this TrainJob references a cluster-scoped runtime.'
          : 'The referenced ClusterTrainingRuntime could not be found.',
    });
  } else if (runtimeKind !== 'TrainingRuntime' && runtimeKind !== 'ClusterTrainingRuntime') {
    warnings.push({
      severity: 'error',
      title: 'Unsupported runtime kind',
      message: `Unsupported runtime kind ${runtimeKind}. Only TrainingRuntime and ClusterTrainingRuntime are supported.`,
    });
  }

  if (runtime) {
    if (!runtime.framework) {
      warnings.push({
        severity: 'warning',
        title: 'Missing framework label',
        message:
          'Runtime is missing the trainer.kubeflow.org/framework label, which makes framework detection and SDK integration harder.',
      });
    }

    const requestedNodes = job.numNodes ?? runtime.defaultNumNodes ?? 1;
    if (requestedNodes > 1 && !runtime.schedulingMode) {
      warnings.push({
        severity: 'warning',
        title: 'Distributed job without gang scheduling',
        message:
          'This TrainJob requests multiple nodes, but the referenced runtime does not define a PodGroupPolicy for gang scheduling or queueing.',
      });
    }
  }

  return warnings;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function mergeNamedArray(baseValue: unknown[], patchValue: unknown[]) {
  const merged = [...baseValue];

  patchValue.forEach(patchEntry => {
    const patchRecord = patchEntry as Record<string, unknown>;
    const patchName = typeof patchRecord.name === 'string' ? patchRecord.name : null;
    if (!patchName) {
      merged.push(patchEntry);
      return;
    }

    const existingIndex = merged.findIndex(entry => {
      const record = entry as Record<string, unknown>;
      return typeof record?.name === 'string' && record.name === patchName;
    });

    if (existingIndex === -1) {
      merged.push(patchEntry);
      return;
    }

    merged[existingIndex] = mergeRuntimeObjects(merged[existingIndex], patchEntry);
  });

  return merged;
}

/**
 * Deep-merges runtime patch content into a base runtime structure.
 */
export function mergeRuntimeObjects(baseValue: unknown, patchValue: unknown): unknown {
  if (patchValue === undefined) {
    return baseValue;
  }

  if (Array.isArray(baseValue) && Array.isArray(patchValue)) {
    const baseNamed = baseValue.every(
      entry => entry && typeof entry === 'object' && 'name' in entry
    );
    const patchNamed = patchValue.every(
      entry => entry && typeof entry === 'object' && 'name' in entry
    );
    if (baseNamed && patchNamed) {
      return mergeNamedArray(baseValue, patchValue);
    }
    return patchValue;
  }

  if (
    baseValue &&
    patchValue &&
    typeof baseValue === 'object' &&
    typeof patchValue === 'object' &&
    !Array.isArray(baseValue) &&
    !Array.isArray(patchValue)
  ) {
    const result: Record<string, unknown> = { ...(baseValue as Record<string, unknown>) };
    Object.entries(patchValue as Record<string, unknown>).forEach(([key, value]) => {
      result[key] = mergeRuntimeObjects(result[key], value);
    });
    return result;
  }

  return patchValue;
}

/**
 * Produces base and merged runtime specs for the runtime patch preview view.
 */
export function buildRuntimePatchPreview(
  runtime: TrainingRuntimeClass | ClusterTrainingRuntimeClass | null,
  runtimePatches: RuntimePatch[]
) {
  const baseSpec = deepClone(runtime?.spec ?? {});
  const mergedSpec = runtimePatches.reduce((current, patch) => {
    if (!patch.trainingRuntimeSpec) {
      return current;
    }
    return mergeRuntimeObjects(current, patch.trainingRuntimeSpec) as Record<string, unknown>;
  }, baseSpec as Record<string, unknown>);

  return {
    baseSpec,
    mergedSpec,
  };
}

/**
 * Returns TrainJobs that reference the provided runtime.
 */
export function getRelatedTrainJobsForRuntime(
  runtime: TrainingRuntimeClass | ClusterTrainingRuntimeClass,
  trainJobs: TrainJobClass[]
) {
  return trainJobs.filter(trainJob => {
    if (
      trainJob.runtimeKind !== runtime.kind ||
      trainJob.runtimeName !== (runtime as any).getName?.()
    ) {
      return false;
    }

    if (isNamespacedRuntime(runtime)) {
      return trainJob.getNamespace() === (runtime as any).getNamespace?.();
    }

    return true;
  });
}

/**
 * Returns pod containers paired with their runtime statuses.
 */
export function getPodContainers(pod: KubePod) {
  const allContainers = pod.spec?.containers ?? [];
  const statuses = pod.status?.containerStatuses ?? [];

  return allContainers.map(container => {
    const status = statuses.find(item => item.name === container.name);
    return {
      container,
      status,
    };
  });
}

/**
 * Formats a single container's resource requirements for display.
 */
export function getContainerResourceSummary(container?: KubeContainer) {
  if (!container?.resources) {
    return '-';
  }

  return formatResourcesSummary({
    requests: container.resources.requests,
    limits: container.resources.limits,
  });
}

/**
 * Summarizes the runtime scheduling policy for list and detail views.
 */
export function getSchedulingSummary(
  runtime: {
    podGroupPolicy?: {
      volcano?: { queue?: string; priorityClassName?: string };
      coscheduling?: { scheduleTimeoutSeconds?: number };
    };
  },
  t?: TFunction
) {
  if (runtime.podGroupPolicy?.volcano) {
    const queue = runtime.podGroupPolicy.volcano.queue;
    return t
      ? t('Volcano{{queueInfo}}', { queueInfo: queue ? ` / ${queue}` : '' })
      : `Volcano${queue ? ` / ${queue}` : ''}`;
  }
  if (runtime.podGroupPolicy?.coscheduling) {
    return t ? t('Coscheduling') : 'Coscheduling';
  }
  return t ? t('Disabled') : 'Disabled';
}

/**
 * Returns the first trainer metric value whose name matches the given pattern.
 */
export function getMetricValue(metrics: TrainerMetric[] | undefined, pattern: RegExp) {
  return metrics?.find(metric => metric.name && pattern.test(metric.name))?.value ?? '';
}

/**
 * Formats the resolved runtime label for a TrainJob detail page.
 */
export function getRuntimeLabel(
  runtime: TrainingRuntimeClass | ClusterTrainingRuntimeClass | null
) {
  if (!runtime) {
    return '-';
  }

  return `${runtime.kind}/${(runtime as any).getName?.() || 'Unknown'}`;
}

/**
 * Resolves the effective runtime object for a TrainJob based on its runtime kind.
 */
export function getRuntimeForTrainJob(args: {
  job: TrainJobClass;
  namespacedRuntime: TrainingRuntimeClass | null;
  clusterRuntime: ClusterTrainingRuntimeClass | null;
}) {
  const { job, namespacedRuntime, clusterRuntime } = args;
  if (job.runtimeKind === 'TrainingRuntime') {
    return namespacedRuntime;
  }
  if (job.runtimeKind === 'ClusterTrainingRuntime') {
    return clusterRuntime;
  }
  return null;
}

/**
 * Builds a pod-name lookup for CPU and memory usage strings.
 */
export function getPodMetricLookup(
  metrics: Array<{
    metadata?: { name?: string };
    containers?: Array<{ usage?: Record<string, string> }>;
  }>
) {
  return metrics.reduce<Record<string, PodMetricSummary>>((acc, metric) => {
    const name = metric.metadata?.name;
    if (!name) {
      return acc;
    }

    acc[name] = {
      cpu:
        metric.containers
          ?.map(container => container.usage?.cpu)
          .filter(Boolean)
          .join(' + ') || '-',
      memory:
        metric.containers
          ?.map(container => container.usage?.memory)
          .filter(Boolean)
          .join(' + ') || '-',
    };
    return acc;
  }, {});
}

/**
 * Formats runtime patch manager names for display.
 */
export function getRuntimePatchManagers(patches: RuntimePatch[]) {
  return patches
    .map(patch => patch.manager)
    .filter(Boolean)
    .join(', ');
}

/**
 * Returns whether a runtime patch object contains any patch content.
 */
export function hasRuntimePatchContent(patch?: TrainingRuntimeSpecPatch | null) {
  return !!patch && Object.keys(patch).length > 0;
}

/**
 * Normalizes nullable runtime data to a consistent return shape.
 */
export function asKubeflowRuntimeObject<T extends KubeflowTrainingRuntime>(
  runtime: T | null | undefined
) {
  return runtime ?? null;
}

/**
 * Returns the Kubernetes phase for a child pod.
 */
export function getPodPhase(pod: KubePod) {
  return pod.status?.phase ?? 'Unknown';
}

/**
 * Extracts the unschedulable scheduling message from a pod, if present.
 */
export function getUnschedulableMessage(pod: KubePod) {
  const condition = pod.status?.conditions?.find(
    condition => condition.type === 'PodScheduled' && condition.status === 'False'
  );

  if (condition?.reason === 'Unschedulable') {
    return condition.message ?? condition.reason ?? '';
  }

  return '';
}

/**
 * Returns the configured replicated job names from a runtime template.
 */
export function getRuntimeTemplateJobNames(
  runtime: TrainingRuntimeClass | ClusterTrainingRuntimeClass | null
) {
  const jobs = runtime?.template?.spec?.replicatedJobs ?? [];
  return jobs
    .map(job => (typeof job.name === 'string' ? job.name : ''))
    .filter(Boolean)
    .join(', ');
}

/**
 * Returns `job:container` identifiers from a runtime template for display.
 */
export function getRuntimeTemplateContainers(
  runtime: TrainingRuntimeClass | ClusterTrainingRuntimeClass | null
) {
  const replicatedJobs = runtime?.template?.spec?.replicatedJobs ?? [];
  return replicatedJobs.flatMap(job => {
    const containers = (
      ((job as Record<string, unknown>).template as Record<string, unknown>)?.spec as Record<
        string,
        unknown
      >
    )?.template as Record<string, unknown>;
    return (
      ((containers?.spec as Record<string, unknown>)?.containers as Array<
        Record<string, unknown>
      >) ?? []
    ).map(
      container =>
        `${String((job as Record<string, unknown>).name ?? 'job')}:${String(
          container.name ?? 'container'
        )}`
    );
  });
}
