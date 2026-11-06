import { describe, expect, it } from 'vitest';
import { Condition, ConditionStatus, getConditionStatus, isConditionTrue } from './conditions';

const cond = (type: string, status: ConditionStatus): Condition => ({ type, status });

describe('getConditionStatus', () => {
  it('returns the status of the matching condition', () => {
    expect(getConditionStatus([cond('Ready', 'True')], 'Ready')).toBe('True');
    expect(getConditionStatus([cond('Deleted', 'False')], 'Deleted')).toBe('False');
  });

  it('returns undefined when the condition type is absent or conditions is undefined', () => {
    expect(getConditionStatus([cond('Ready', 'True')], 'Deleted')).toBeUndefined();
    expect(getConditionStatus([], 'Ready')).toBeUndefined();
    expect(getConditionStatus(undefined, 'Ready')).toBeUndefined();
  });
});

describe('isConditionTrue', () => {
  it('is true only when the condition status is exactly True', () => {
    expect(isConditionTrue([cond('Ready', 'True')], 'Ready')).toBe(true);
  });

  it('is false for False, Unknown, absent, and undefined conditions', () => {
    expect(isConditionTrue([cond('Ready', 'False')], 'Ready')).toBe(false);
    expect(isConditionTrue([cond('Ready', 'Unknown')], 'Ready')).toBe(false);
    expect(isConditionTrue([], 'Ready')).toBe(false);
    expect(isConditionTrue(undefined, 'Ready')).toBe(false);
  });
});
