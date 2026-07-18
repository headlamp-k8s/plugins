import type { WorkflowTaskStatus } from '../../resources/workflow';
import { getTaskState } from './helpers';

describe('getTaskState', () => {
  it('uses the task state when it is available', () => {
    expect(getTaskState({ state: 'STATE_RUNNING' })).toBe('Running');
  });

  it('returns Running when any action is running', () => {
    const task: WorkflowTaskStatus = {
      actions: [{ state: 'SUCCESS' }, { state: 'RUNNING' }],
    };

    expect(getTaskState(task)).toBe('Running');
  });

  it('returns Failed when any action failed and none are running', () => {
    const task: WorkflowTaskStatus = {
      actions: [{ state: 'SUCCESS' }, { state: 'FAILED' }],
    };

    expect(getTaskState(task)).toBe('Failed');
  });

  it('returns Success when all actions succeeded', () => {
    const task: WorkflowTaskStatus = {
      actions: [{ state: 'SUCCESS' }, { state: 'SUCCESS' }],
    };

    expect(getTaskState(task)).toBe('Success');
  });

  it('returns Unknown when no task or action state is available', () => {
    expect(getTaskState({ actions: [] })).toBe('Unknown');
  });
});
