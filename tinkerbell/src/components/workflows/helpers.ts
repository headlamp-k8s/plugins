import { normalizeState } from '../../resources/common';
import type { Workflow, WorkflowTaskStatus } from '../../resources/workflow';
import { fallback } from '../common/listHelpers';

/**
 * Gets a user-facing workflow state from supported status shapes.
 *
 * @param item - Workflow resource to inspect.
 * @returns Normalized workflow state.
 */
export function getWorkflowState(item: Workflow): string {
  return normalizeState(item.status?.state ?? item.status?.currentState?.state);
}

/**
 * Gets the current task only while the workflow is actively running.
 *
 * Completed and pending workflows may keep stale currentState data, so hiding it
 * outside Running avoids presenting old task names as active progress.
 *
 * @param item - Workflow resource to inspect.
 * @returns Current task while running, or fallback otherwise.
 */
export function getCurrentTask(item: Workflow): string {
  if (getWorkflowState(item) !== 'Running') {
    return fallback(undefined);
  }

  return fallback(item.status?.currentState?.taskName);
}

/**
 * Gets the current action only while the workflow is actively running.
 *
 * Completed and pending workflows may keep stale currentState data, so hiding it
 * outside Running avoids presenting old action names as active progress.
 *
 * @param item - Workflow resource to inspect.
 * @returns Current action while running, or fallback otherwise.
 */
export function getCurrentAction(item: Workflow): string {
  if (getWorkflowState(item) !== 'Running') {
    return fallback(undefined);
  }

  return fallback(item.status?.currentState?.actionName);
}

/**
 * Gets a task state from its actions when the task has no direct state field.
 *
 * @param task - Workflow task status entry.
 * @returns Normalized task state.
 */
export function getTaskState(task: WorkflowTaskStatus): string {
  if (task.state) {
    return normalizeState(task.state);
  }

  const actionStates = task.actions?.map(action => normalizeState(action.state)) ?? [];
  const running = normalizeState('RUNNING');
  const failed = normalizeState('FAILED');
  const success = normalizeState('SUCCESS');

  if (actionStates.includes(running)) {
    return running;
  }
  if (actionStates.includes(failed)) {
    return failed;
  }
  if (actionStates.length && actionStates.every(state => state === success)) {
    return success;
  }

  return normalizeState(undefined);
}
