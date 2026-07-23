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

  const actionStates = task.actions?.map(action => action.state).filter(Boolean) ?? [];
  if (actionStates.some(state => state === 'RUNNING')) {
    return normalizeState('RUNNING');
  }
  if (actionStates.some(state => state === 'FAILED')) {
    return normalizeState('FAILED');
  }
  if (actionStates.length && actionStates.every(state => state === 'SUCCESS')) {
    return normalizeState('SUCCESS');
  }

  return normalizeState(undefined);
}
