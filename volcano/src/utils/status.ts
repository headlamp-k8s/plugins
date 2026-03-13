import { JobPhase } from '../resources/job';
import { PodGroupPhase } from '../resources/podgroup';
import { QueueState } from '../resources/queue';

type StatusColor = 'success' | 'warning' | 'error' | undefined;

const JOB_STATUS_COLORS: Record<JobPhase, StatusColor> = {
  Running: 'success',
  Completing: 'success',
  Completed: 'success',
  Pending: 'warning',
  Restarting: 'warning',
  Aborting: 'warning',
  Terminating: 'warning',
  Failed: 'error',
  Aborted: 'error',
  Terminated: 'error',
};

const QUEUE_STATUS_COLORS: Record<QueueState, StatusColor> = {
  Open: 'success',
  Closing: 'warning',
  Closed: 'error',
  Unknown: 'warning',
};

const PODGROUP_STATUS_COLORS: Record<PodGroupPhase, StatusColor> = {
  Running: 'success',
  Completed: 'success',
  Pending: 'warning',
  Inqueue: 'warning',
  Unknown: 'warning',
};

export function getJobStatusColor(phase: JobPhase): StatusColor {
  return JOB_STATUS_COLORS[phase];
}

export function getQueueStatusColor(state: QueueState): StatusColor {
  return QUEUE_STATUS_COLORS[state];
}

export function getPodGroupStatusColor(phase: PodGroupPhase): StatusColor {
  return PODGROUP_STATUS_COLORS[phase];
}
