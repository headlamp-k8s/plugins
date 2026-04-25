import { K8s } from '@kinvolk/headlamp-plugin/lib';

export const PodResource = K8s.ResourceClasses.Pod;

/**
 * Runtime issue extracted from a single Pod created by a Volcano Job.
 */
export interface JobPodIssue {
  /** Pod object that exposed the issue. */
  pod: InstanceType<typeof PodResource>;
  /** Pod name shown in the UI. */
  podName: string;
  /** Container name associated with the issue when one can be identified. */
  containerName?: string;
  /** User-visible reason associated with the Pod issue. */
  reason: string;
  /** Detailed message associated with the Pod issue. */
  message?: string;
}

/**
 * Repeated Pod issues grouped by reason and message.
 */
export interface GroupedJobPodIssue {
  /** Pods that share the same grouped issue. */
  pods: Array<{
    /** Pod object that exposed the issue. */
    pod: InstanceType<typeof PodResource>;
    /** Pod name shown in the grouped UI. */
    podName: string;
  }>;
  /** Unique container names affected by the grouped issue. */
  containerNames: string[];
  /** Shared user-visible reason for the grouped issue. */
  reason: string;
  /** Shared detailed message for the grouped issue. */
  message?: string;
}

const nonActionablePodReasons = new Set([
  'Pending',
  'ContainerCreating',
  'PodInitializing',
  'Running',
  'Completed',
  'Succeeded',
  'Terminating',
  'NotReady',
  'Unknown',
  'ContainersNotReady',
  'Init:ContainerCreating',
  'Init:PodInitializing',
]);

/**
 * Checks whether an init-container reason only reflects startup progress.
 *
 * @param reason Pod status reason.
 * @returns `true` when the reason is an init progress marker like `Init:1/2`.
 */
function isInitProgressReason(reason: string) {
  return /^Init:\d+\/\d+$/.test(reason);
}

/**
 * Expands a reason into equivalent candidates that may appear on init container states.
 *
 * @param reason Pod status reason.
 * @returns Reason candidates used when matching container waiting or terminated states.
 */
function getReasonCandidates(reason: string) {
  if (reason.startsWith('Init:') && !isInitProgressReason(reason)) {
    return [reason, reason.slice('Init:'.length)];
  }

  return [reason];
}

/**
 * Reports whether a Pod reason should be surfaced as an actionable issue.
 *
 * @param reason Pod status reason.
 * @returns `true` when the reason represents a user-actionable runtime problem.
 */
function isActionablePodReason(reason?: string) {
  if (!reason) {
    return false;
  }

  if (nonActionablePodReasons.has(reason) || isInitProgressReason(reason)) {
    return false;
  }

  return true;
}

/**
 * Resolves the most specific container name and message for a Pod issue reason.
 *
 * @param pod Pod whose statuses are inspected.
 * @param reason User-visible Pod reason.
 * @param message Fallback Pod message from the detailed status helper.
 * @returns Container-specific issue details when a matching container state is found.
 */
function getIssueReasonDetails(
  pod: InstanceType<typeof PodResource>,
  reason: string,
  message?: string
) {
  const containerStatuses = [
    ...(pod.status?.containerStatuses ?? []),
    ...(pod.status?.initContainerStatuses ?? []),
  ];

  const reasonCandidates = getReasonCandidates(reason);

  const matchingContainer = containerStatuses.find(status => {
    return (
      reasonCandidates.includes(status.state?.waiting?.reason || '') ||
      reasonCandidates.includes(status.state?.terminated?.reason || '')
    );
  });

  if (!matchingContainer) {
    return {
      containerName: undefined,
      reason,
      message,
    };
  }

  return {
    containerName: matchingContainer.name,
    reason,
    message:
      matchingContainer.state?.waiting?.message ||
      matchingContainer.state?.terminated?.message ||
      message,
  };
}

/**
 * Extracts user-visible runtime issues from Pods created by a Volcano Job.
 *
 * @param pods Pods related to a Volcano Job.
 * @returns Pod issues derived from waiting and failed container states.
 */
export function getJobPodIssues(pods: InstanceType<typeof PodResource>[]): JobPodIssue[] {
  return pods.flatMap(pod => {
    const { reason, message } = pod.getDetailedStatus();

    if (!isActionablePodReason(reason)) {
      return [];
    }

    const issueDetails = getIssueReasonDetails(pod, reason, message);

    return [
      {
        pod,
        podName: pod.getName(),
        containerName: issueDetails.containerName,
        reason: issueDetails.reason,
        message: issueDetails.message,
      },
    ];
  });
}

/**
 * Groups repeated Pod issues by reason and message to reduce duplicate output.
 *
 * @param podIssues Pod issues derived from Job-owned Pods.
 * @returns Grouped issues with Pod links and unique container names.
 */
export function groupJobPodIssues(podIssues: JobPodIssue[]): GroupedJobPodIssue[] {
  const groupedIssues = new Map<string, GroupedJobPodIssue>();

  podIssues.forEach(issue => {
    const key = `${issue.reason} ${issue.message || ''}`;
    const existingIssue = groupedIssues.get(key);

    if (existingIssue) {
      if (!existingIssue.pods.some(pod => pod.podName === issue.podName)) {
        existingIssue.pods.push({ pod: issue.pod, podName: issue.podName });
      }

      if (issue.containerName && !existingIssue.containerNames.includes(issue.containerName)) {
        existingIssue.containerNames.push(issue.containerName);
      }

      return;
    }

    groupedIssues.set(key, {
      pods: [{ pod: issue.pod, podName: issue.podName }],
      containerNames: issue.containerName ? [issue.containerName] : [],
      reason: issue.reason,
      message: issue.message,
    });
  });

  return Array.from(groupedIssues.values());
}
