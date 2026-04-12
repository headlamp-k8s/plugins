/**
 * Copyright 2025 The Headlamp Authors.
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

import { StatusLabelProps } from '@kinvolk/headlamp-plugin/lib/components/common';
import { formatDuration } from '@kinvolk/headlamp-plugin/lib/Utils';
import { KubeflowResourceCondition } from '../../resources/common';

/**
 * Minimal status-bearing shape used by Pipeline and PipelineVersion UI helpers.
 */
export interface PipelineStatusResource {
  status?: {
    phase?: string;
    conditions?: KubeflowResourceCondition[];
  };
}

/**
 * Minimal Run resource shape used for run-specific helpers.
 */
export interface PipelineRunResource {
  spec?: {
    runtimeConfig?: { pipelineRoot?: string };
    pipelineRoot?: string;
  };
  status?: {
    startTime?: string;
    completionTime?: string;
    lastTransitionTime?: string;
  };
}

/**
 * Minimal RecurringRun resource shape used for schedule helpers.
 */
export interface PipelineRecurringRunResource {
  spec?: {
    trigger?: { cronSchedule?: string; intervalSecond?: number };
    cronSchedule?: string;
    intervalSecond?: number;
  };
}

/**
 * Minimal PipelineVersion reference shape used for version counting.
 */
export interface PipelineVersionReference {
  metadata?: {
    name?: string;
    namespace?: string;
    creationTimestamp?: string;
  };
  pipelineName?: string;
}

/**
 * UI metadata derived from a Kubeflow Pipelines family resource.
 */
export interface PipelineResourceStatus {
  label: string;
  status: StatusLabelProps['status'];
  icon: string;
  reason?: string;
}

function getStatusVariant(value: string): StatusLabelProps['status'] {
  const normalizedValue = value.toLowerCase();

  if (
    normalizedValue.includes('failed') ||
    normalizedValue.includes('error') ||
    normalizedValue.includes('invalid')
  ) {
    return 'error';
  }

  if (
    normalizedValue.includes('ready') ||
    normalizedValue.includes('running') ||
    normalizedValue.includes('succeeded') ||
    normalizedValue.includes('available') ||
    normalizedValue.includes('complete')
  ) {
    return 'success';
  }

  return '';
}

function getStatusIcon(status: StatusLabelProps['status']): string {
  if (status === 'error') {
    return 'mdi:alert-circle';
  }
  if (status === 'success') {
    return 'mdi:check-circle';
  }
  return 'mdi:clock-outline';
}

/**
 * Derives a consistent user-facing status badge for Pipeline and PipelineVersion resources.
 */
export function getPipelineResourceStatus(
  resource: PipelineStatusResource | null | undefined
): PipelineResourceStatus {
  const conditions = resource?.status?.conditions ?? [];
  const phase = resource?.status?.phase ?? '';

  const failedCondition = conditions.find(condition => {
    return condition.type === 'Failed' && condition.status === 'True';
  });
  if (failedCondition) {
    return {
      label: 'Failed',
      status: 'error',
      icon: 'mdi:alert-circle',
      reason: failedCondition.reason ?? failedCondition.message,
    };
  }

  const positiveCondition = conditions.find(condition => {
    return (
      (condition.type === 'Ready' ||
        condition.type === 'Running' ||
        condition.type === 'Succeeded' ||
        condition.type === 'Available') &&
      condition.status === 'True'
    );
  });
  if (positiveCondition?.type) {
    return {
      label: positiveCondition.type,
      status: 'success',
      icon: 'mdi:check-circle',
      reason: positiveCondition.reason ?? positiveCondition.message,
    };
  }

  if (phase) {
    const phaseStatus = getStatusVariant(phase);
    return {
      label: phase,
      status: phaseStatus,
      icon: getStatusIcon(phaseStatus),
    };
  }

  const latestTrueCondition = [...conditions].reverse().find(condition => {
    return condition.status === 'True' && Boolean(condition.type);
  });
  if (latestTrueCondition?.type) {
    const conditionStatus = getStatusVariant(latestTrueCondition.type);
    return {
      label: latestTrueCondition.type,
      status: conditionStatus,
      icon: getStatusIcon(conditionStatus),
      reason: latestTrueCondition.reason ?? latestTrueCondition.message,
    };
  }

  const latestCondition = conditions[conditions.length - 1];
  if (latestCondition?.type) {
    const conditionStatus = getStatusVariant(latestCondition.type);
    return {
      label: latestCondition.type,
      status: conditionStatus,
      icon: getStatusIcon(conditionStatus),
      reason: latestCondition.reason ?? latestCondition.message,
    };
  }

  return {
    label: 'Pending',
    status: '',
    icon: 'mdi:clock-outline',
  };
}

/**
 * Counts PipelineVersion resources that belong to the given Pipeline name and namespace.
 */
export function countPipelineVersionsForPipeline(
  versions: PipelineVersionReference[],
  pipelineName: string,
  namespace?: string
): number {
  if (!pipelineName) {
    return 0;
  }

  return versions.filter(version => {
    if (version.pipelineName !== pipelineName) {
      return false;
    }
    if (namespace) {
      return version.metadata?.namespace === namespace;
    }
    return true;
  }).length;
}

/**
 * Returns the pipeline root configured for a resource, if available.
 * Supports both individual Runs and Recurring Runs.
 */
export function getPipelineRunRoot(
  resource:
    | { spec?: { runtimeConfig?: { pipelineRoot?: string }; pipelineRoot?: string } }
    | null
    | undefined
): string {
  return resource?.spec?.runtimeConfig?.pipelineRoot ?? resource?.spec?.pipelineRoot ?? '';
}

/**
 * Returns the run duration in milliseconds.
 */
export function getPipelineRunDurationMs(resource: PipelineRunResource | null | undefined): number {
  const startTime = resource?.status?.startTime;
  const completionTime = resource?.status?.completionTime ?? resource?.status?.lastTransitionTime;

  if (!startTime || !completionTime) {
    return 0;
  }

  const start = Date.parse(startTime);
  const end = Date.parse(completionTime);

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }

  return end - start;
}

/**
 * Returns a human-friendly run duration label.
 */
export function getPipelineRunDurationLabel(
  resource: PipelineRunResource | null | undefined
): string {
  const durationMs = getPipelineRunDurationMs(resource);
  if (durationMs <= 0) {
    return '-';
  }

  return formatDuration(durationMs, { format: 'mini' });
}

/**
 * Returns a displayable schedule label for a RecurringRun.
 */
export function getRecurringRunSchedule(
  resource: PipelineRecurringRunResource | null | undefined
): string {
  const cronValue = resource?.spec?.trigger?.cronSchedule ?? resource?.spec?.cronSchedule ?? '';

  const cron = typeof cronValue === 'object' ? (cronValue as any).cron : cronValue;

  if (cron) {
    return cron;
  }

  const intervalSeconds =
    resource?.spec?.trigger?.intervalSecond ?? resource?.spec?.intervalSecond ?? 0;
  if (intervalSeconds > 0) {
    return `Every ${formatDuration(intervalSeconds * 1000, { format: 'mini' })}`;
  }

  return '-';
}

/**
 * Returns the Headlamp route name for the Pipeline detail page.
 */
export function getPipelineDetailsPath(): string {
  return 'kubeflow-pipelines-detail';
}

/**
 * Returns the Headlamp route name for the PipelineVersion detail page.
 */
export function getPipelineVersionDetailsPath(): string {
  return 'kubeflow-pipeline-versions-detail';
}

/**
 * Returns the Headlamp route name for the Pipeline Run detail page.
 */
export function getPipelineRunDetailsPath(): string {
  return 'kubeflow-pipeline-runs-detail';
}

/**
 * Returns the Headlamp route name for the Recurring Run detail page.
 */
export function getPipelineRecurringRunDetailsPath(): string {
  return 'kubeflow-pipeline-recurring-detail';
}

/**
 * Returns the Headlamp route name for the Experiment detail page.
 */
export function getPipelineExperimentDetailsPath(): string {
  return 'kubeflow-pipeline-experiments-detail';
}

/**
 * Returns related PipelineVersions for a Pipeline, scoped to the same namespace.
 */
export function getPipelineVersionsForPipeline<T extends PipelineVersionReference>(
  versions: T[],
  pipelineName: string,
  namespace?: string
): T[] {
  return versions.filter(version => {
    if (version.pipelineName !== pipelineName) {
      return false;
    }
    if (namespace) {
      return version.metadata?.namespace === namespace;
    }
    return true;
  });
}

/**
 * Returns the most recently created PipelineVersion for a Pipeline.
 */
export function getLatestPipelineVersionForPipeline<T extends PipelineVersionReference>(
  versions: T[],
  pipelineName: string,
  namespace?: string
): T | null {
  const relatedVersions = getPipelineVersionsForPipeline(versions, pipelineName, namespace);

  if (relatedVersions.length === 0) {
    return null;
  }

  return [...relatedVersions].sort((left, right) => {
    const leftTimestamp = Date.parse(left.metadata?.creationTimestamp ?? '');
    const rightTimestamp = Date.parse(right.metadata?.creationTimestamp ?? '');
    return rightTimestamp - leftTimestamp;
  })[0];
}

/**
 * Returns whether a PipelineVersion exposes any source-specific fields worth rendering.
 */
export function hasPipelineVersionSource(resource: {
  spec?: {
    pipelineSpecURI?: string;
    codeSourceURL?: string;
    pipelineSpec?: unknown;
  };
}): boolean {
  return Boolean(
    resource.spec?.pipelineSpecURI || resource.spec?.codeSourceURL || resource.spec?.pipelineSpec
  );
}
