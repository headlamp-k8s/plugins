import { KubeflowResourceCondition } from '../../resources/common';
import type { KatibExperimentClass, KatibParameterSpec } from '../../resources/katibExperiment';
import type { KatibTrialClass } from '../../resources/katibTrial';
import type { KubeflowStatusBadgeInfo } from './KubeflowStatusBadge';

/**
 * Best trial match returned for a Katib experiment.
 */
export interface KatibBestTrialMatch {
  trial: KatibTrialClass;
  value: number;
}

/**
 * Determines if a Katib condition type represents an error or failure state.
 * @param type The Katib condition type string.
 * @see {@link https://www.kubeflow.org/docs/components/katib/experiment/#experiment-status Katib Experiment Status}
 */
function isKatibErrorConditionType(type?: string): boolean {
  const normalizedType = type?.toLowerCase() ?? '';
  return (
    normalizedType.includes('failed') ||
    normalizedType.includes('error') ||
    normalizedType.includes('invalid')
  );
}

/**
 * Returns the Headlamp badge metadata for a Katib condition.
 */
export function getKatibConditionStatus(
  condition: KubeflowResourceCondition | null
): KubeflowStatusBadgeInfo {
  if (!condition) {
    return {
      label: 'Pending',
      status: '',
      reason: null,
    };
  }

  if (isKatibErrorConditionType(condition.type) && condition.status === 'True') {
    return {
      label: condition.type ?? 'Failed',
      status: 'error',
      reason: condition.reason ?? condition.message ?? null,
    };
  }

  if (condition.status === 'True') {
    return {
      label: condition.type ?? 'Ready',
      status: 'success',
      reason: condition.reason ?? condition.message ?? null,
    };
  }

  return {
    label: condition.type ?? 'Unknown',
    status: '',
    reason: condition.reason ?? condition.message ?? null,
  };
}

/**
 * Formats a Katib search-space parameter into a compact user-facing label.
 */
export function formatKatibFeasibleSpace(parameter: KatibParameterSpec): string {
  const space = parameter.feasibleSpace ?? {};

  if ((space.list?.length ?? 0) > 0) {
    return space.list?.join(', ') ?? '-';
  }

  const minMax = [space.min, space.max].filter(Boolean).join(' - ');
  return space.step ? `${minMax} (step ${space.step})` : minMax || '-';
}

/**
 * Returns the metric value used to score a Katib trial.
 */
export function getKatibTrialMetricValue(
  trial: KatibTrialClass,
  metricName?: string | null
): string {
  if (!metricName) {
    return trial.objectiveMetricValue || '-';
  }

  const metric = trial.status.observation?.metrics?.find(item => item.name === metricName);
  return metric?.value ?? '-';
}

/**
 * Returns trials that belong to the given Katib experiment.
 */
export function getKatibRelatedTrials(
  experiment: KatibExperimentClass,
  trials: KatibTrialClass[]
): KatibTrialClass[] {
  return trials.filter(trial => {
    const labels = trial.metadata.labels ?? {};
    return (
      trial.metadata.namespace === experiment.metadata.namespace &&
      (trial.ownerExperiment === experiment.metadata.name ||
        labels['katib.kubeflow.org/experiment'] === experiment.metadata.name ||
        labels['katib.kubeflow.org/experiment-name'] === experiment.metadata.name)
    );
  });
}

/**
 * Finds the current best trial for a Katib experiment objective.
 */
export function getKatibBestTrial(
  trials: KatibTrialClass[],
  metricName: string,
  objectiveType: string
): KatibBestTrialMatch | null {
  const scoredTrials = trials
    .map(trial => ({
      trial,
      value: Number(getKatibTrialMetricValue(trial, metricName)),
    }))
    .filter(item => Number.isFinite(item.value));

  if (scoredTrials.length === 0) {
    return null;
  }

  return scoredTrials.sort((left, right) => {
    return objectiveType === 'minimize' ? left.value - right.value : right.value - left.value;
  })[0];
}

/**
 * Counts trials that are no longer running because they reached a terminal Katib condition.
 */
export function getKatibTerminalTrialCount(trials: KatibTrialClass[]): number {
  return trials.filter(trial => {
    const conditionType = trial.latestCondition?.type;
    return (
      conditionType === 'Succeeded' ||
      conditionType === 'Failed' ||
      conditionType === 'EarlyStopped'
    );
  }).length;
}
