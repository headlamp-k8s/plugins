import { normalizeState } from '../../resources/common';
import type { WorkflowTaskStatus } from '../../resources/workflow';

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
