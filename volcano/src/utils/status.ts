import { JobPhase } from '../resources/job';
import { JobFlowPhase } from '../resources/jobflow';
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

const JOBFLOW_STATUS_COLORS: Record<string, StatusColor> = {
  Running: 'success',
  Succeed: 'success',
  Succeeded: 'success',
  Pending: 'warning',
  Terminating: 'warning',
  Failed: 'error',
};

/**
 * Maps a Volcano Job phase to the UI status color.
 *
 * @param phase Volcano Job phase.
 * @returns Status color token used by `StatusLabel`.
 */
export function getJobStatusColor(phase: JobPhase): StatusColor {
  return JOB_STATUS_COLORS[phase];
}

/**
 * Maps a Volcano Queue state to the UI status color.
 *
 * @param state Volcano Queue state.
 * @returns Status color token used by `StatusLabel`.
 */
export function getQueueStatusColor(state: QueueState): StatusColor {
  return QUEUE_STATUS_COLORS[state];
}

/**
 * Maps a Volcano PodGroup phase to the UI status color.
 *
 * @param phase Volcano PodGroup phase.
 * @returns Status color token used by `StatusLabel`.
 */
export function getPodGroupStatusColor(phase: PodGroupPhase): StatusColor {
  return PODGROUP_STATUS_COLORS[phase];
}

/**
 * Maps a Volcano JobFlow phase to the UI status color.
 *
 * @param phase Volcano JobFlow phase.
 * @returns Status color token used by `StatusLabel`.
 */
export function getJobFlowStatusColor(phase: JobFlowPhase): StatusColor {
  return JOBFLOW_STATUS_COLORS[phase] ?? 'warning';
}
