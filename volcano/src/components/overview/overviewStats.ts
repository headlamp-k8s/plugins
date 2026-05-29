import { JobPhase, VolcanoJob } from '../../resources/job';
import { PodGroupPhase, VolcanoPodGroup } from '../../resources/podgroup';
import { QueueState, VolcanoQueue } from '../../resources/queue';
import { getJobStatusColor, getPodGroupStatusColor, getQueueStatusColor } from '../../utils/status';

export type ResourceError = { status?: number; message?: string } | null | undefined;

export type AttentionRow =
  | { type: 'Job'; name: string; namespace: string; status: JobPhase; resource: VolcanoJob }
  | {
      type: 'PodGroup';
      name: string;
      namespace: string;
      status: PodGroupPhase;
      resource: VolcanoPodGroup;
    }
  | { type: 'Queue'; name: string; status: QueueState; resource: VolcanoQueue };

export const visibleSchedulingIssuesLimit = 5;

export function getErrorText(error: ResourceError) {
  if (!error) {
    return null;
  }

  if (error.status === 403) {
    return 'Not authorized';
  }

  if (error.status === 404) {
    return 'Not installed';
  }

  return error.message || 'Unavailable';
}

export function countBy<T extends string>(items: T[]) {
  return items.reduce<Partial<Record<T, number>>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {});
}

export function getAttentionRows(
  jobs: VolcanoJob[] | null,
  queues: VolcanoQueue[] | null,
  podGroups: VolcanoPodGroup[] | null
): AttentionRow[] {
  return [
    ...(jobs || [])
      .filter(job => ['Failed', 'Aborted', 'Terminated', 'Pending'].includes(job.phase))
      .map(job => ({
        type: 'Job' as const,
        name: job.getName(),
        namespace: job.getNamespace(),
        status: job.phase,
        resource: job,
      })),
    ...(podGroups || [])
      .filter(podGroup => ['Pending', 'Inqueue', 'Unknown'].includes(podGroup.phase))
      .map(podGroup => ({
        type: 'PodGroup' as const,
        name: podGroup.getName(),
        namespace: podGroup.getNamespace(),
        status: podGroup.phase,
        resource: podGroup,
      })),
    ...(queues || [])
      .filter(queue => queue.state !== 'Open')
      .map(queue => ({
        type: 'Queue' as const,
        name: queue.getName(),
        status: queue.state,
        resource: queue,
      })),
  ];
}

export function getAttentionStatus(row: AttentionRow) {
  if (row.type === 'Job') {
    return getJobStatusColor(row.status);
  }

  if (row.type === 'PodGroup') {
    return getPodGroupStatusColor(row.status);
  }

  return getQueueStatusColor(row.status);
}

export function getAttentionReason(row: AttentionRow) {
  if (row.type === 'Job') {
    const detail = row.resource.status?.state?.reason || row.resource.status?.state?.message;
    return detail && detail !== row.status ? detail : '-';
  }

  if (row.type === 'PodGroup') {
    const conditions = row.resource.status?.conditions;
    const latestCondition =
      conditions && conditions.length > 0 ? conditions[conditions.length - 1] : undefined;
    const detail = latestCondition?.reason || latestCondition?.message;
    return detail && detail !== row.status ? detail : '-';
  }

  return row.status === 'Closed' ? 'Queue is closed' : row.status;
}
