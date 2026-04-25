interface PodLike {
  metadata?: {
    name?: string;
  };
  spec?: {
    containers?: Array<{
      name: string;
    }>;
  };
  status?: {
    containerStatuses?: Array<{
      name: string;
      restartCount?: number;
    }>;
  };
}

interface PodWithPhase extends PodLike {
  status?: PodLike['status'] & {
    phase?: string;
  };
}

export const JOB_NAME_LABEL = 'volcano.sh/job-name';

const NO_PODS_MESSAGE =
  'No pods have been created for this Job yet. It may still be pending or unschedulable. Check Pod Issues and Events.';
const NO_LOGS_MESSAGE =
  'No logs available yet. The selected container may not have started or may not have emitted output. Check Pod Issues and Events.';

const timestampPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/;

/**
 * Returns containers that are available across the selected pod set.
 *
 * @param pods Pods currently selected in the logs viewer.
 * @returns Container names in the first pod's order.
 */
export function getContainerNames(pods: PodLike[]): string[] {
  const firstPodContainers = pods[0]?.spec?.containers?.map(container => container.name) || [];

  if (pods.length <= 1) {
    return firstPodContainers;
  }

  return firstPodContainers.filter(containerName =>
    pods.every(pod =>
      (pod.spec?.containers || []).some(container => container.name === containerName)
    )
  );
}

/**
 * Picks the default container shown when logs are first opened.
 *
 * @param pods Pods currently selected in the logs viewer.
 * @returns First compatible container name or an empty string.
 */
export function getDefaultContainerName(pods: PodLike[]): string {
  return getContainerNames(pods)[0] || '';
}

/**
 * Reports whether the selected container has previous logs available.
 *
 * @param pods Pods currently selected in the logs viewer.
 * @param containerName Selected container name.
 * @returns `true` when any selected pod restarted that container.
 */
export function hasRestartedContainer(pods: PodLike[], containerName: string): boolean {
  return pods.some(pod =>
    (pod.status?.containerStatuses || []).some(
      status => status.name === containerName && (status.restartCount || 0) > 0
    )
  );
}

/**
 * Prefixes log lines with pod and container identity for multi-pod views.
 *
 * @param podName Pod name shown in the log prefix.
 * @param containerName Container name shown in the log prefix.
 * @param fragment Raw log fragment returned by the Pod log stream.
 * @returns Fragment with a prefix applied to each line.
 */
export function formatPrefixedLogFragment(
  podName: string,
  containerName: string,
  fragment: string
): string {
  const prefix = `[${podName}/${containerName}] `;
  const normalized = fragment.endsWith('\n') ? fragment : `${fragment}\n`;

  return normalized
    .split('\n')
    .map((line, index, lines) => {
      const isTrailingEmpty = index === lines.length - 1 && line === '';
      if (isTrailingEmpty) {
        return '';
      }
      return `${prefix}${line}`;
    })
    .join('\n');
}

/**
 * Sorts aggregated log lines by RFC3339-like timestamp when one is present.
 *
 * @param logs Aggregated log lines across selected pods.
 * @returns Sorted logs for deterministic rendering.
 */
export function sortLogsByTimestamp(logs: string[]): string[] {
  return logs
    .map((log, index) => ({ log, index }))
    .sort((left, right) => {
      const leftTimestamp = left.log.match(timestampPattern)?.[0] || '';
      const rightTimestamp = right.log.match(timestampPattern)?.[0] || '';

      if (!leftTimestamp && rightTimestamp) {
        return 1;
      }

      if (leftTimestamp && !rightTimestamp) {
        return -1;
      }

      const timestampComparison = leftTimestamp.localeCompare(rightTimestamp);

      if (timestampComparison !== 0) {
        return timestampComparison;
      }

      const logComparison = left.log.localeCompare(right.log);

      if (logComparison !== 0) {
        return logComparison;
      }

      return left.index - right.index;
    })
    .map(entry => entry.log);
}

/**
 * Returns the selected pod subset for the current logs view.
 *
 * @param pods Pods discovered for the Volcano Job.
 * @param selectedPodName Selected pod name or `all`.
 * @returns Matching pod subset.
 */
export function getSelectedPods<T extends PodLike>(
  pods: T[],
  selectedPodName: 'all' | string
): T[] {
  if (selectedPodName === 'all') {
    return pods;
  }

  return pods.filter(pod => pod.metadata?.name === selectedPodName);
}

/**
 * Reports whether a pod is already in a terminal phase.
 *
 * @param pod Pod selected in the logs viewer.
 * @returns `true` when the pod already succeeded or failed.
 */
export function isTerminalPod(pod: PodWithPhase): boolean {
  return pod.status?.phase === 'Succeeded' || pod.status?.phase === 'Failed';
}

/**
 * Resolves the helper text shown above the log viewer for loading and empty states.
 *
 * @param options Derived log viewer state.
 * @returns User-facing helper text or `null` when no helper should be shown.
 */
export function getLogsHelperMessage({
  logs,
  podError,
  pods,
  podsLoading,
  isInitializingSelection,
  shouldShowNoLogsMessage,
  shouldShowNoPodsMessage,
  selectedContainer,
  selectedPods,
}: {
  logs: string[];
  podError: unknown;
  pods: PodLike[] | null;
  podsLoading: boolean;
  isInitializingSelection: boolean;
  shouldShowNoLogsMessage: boolean;
  shouldShowNoPodsMessage: boolean;
  selectedContainer: string;
  selectedPods: PodLike[];
}): string | null {
  if (podError) {
    return `Failed to load Job pods: ${
      podError instanceof Error ? podError.message : String(podError)
    }`;
  }

  if (logs.length > 0) {
    return null;
  }

  if (podsLoading || isInitializingSelection) {
    return 'Loading logs...';
  }

  if (!pods?.length) {
    return shouldShowNoPodsMessage ? NO_PODS_MESSAGE : null;
  }

  if (!selectedContainer || !selectedPods.length) {
    return null;
  }

  if (logs.length === 0) {
    return shouldShowNoLogsMessage ? NO_LOGS_MESSAGE : null;
  }

  return null;
}
