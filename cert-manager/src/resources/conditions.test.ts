import { describe, expect, it } from 'vitest';
import { Condition, ConditionStatus } from './common';
import { getConditionStatus, isConditionTrue } from './conditions';

const cond = (type: string, status: ConditionStatus): Condition => ({ type, status });

describe('getConditionStatus', () => {
  it('returns the status of the matching condition', () => {
    expect(getConditionStatus([cond('Ready', 'True')], 'Ready')).toBe('True');
    expect(getConditionStatus([cond('Approved', 'False')], 'Approved')).toBe('False');
  });

  it('returns undefined when the condition type is absent', () => {
    expect(getConditionStatus([cond('Ready', 'True')], 'Approved')).toBeUndefined();
    expect(getConditionStatus([], 'Ready')).toBeUndefined();
  });

  it('returns undefined when conditions is undefined', () => {
    expect(getConditionStatus(undefined, 'Ready')).toBeUndefined();
  });

  it('returns the first match when a type repeats', () => {
    expect(getConditionStatus([cond('Ready', 'False'), cond('Ready', 'True')], 'Ready')).toBe(
      'False'
    );
  });
});

describe('isConditionTrue', () => {
  it('is true only when the condition status is exactly True', () => {
    expect(isConditionTrue([cond('Ready', 'True')], 'Ready')).toBe(true);
  });

  // Regression: a 'False'/'Unknown' status is a truthy string, so reading it
  // directly made a not-ready resource render as "Ready".
  it('is false for a False or Unknown status', () => {
    expect(isConditionTrue([cond('Ready', 'False')], 'Ready')).toBe(false);
    expect(isConditionTrue([cond('Ready', 'Unknown')], 'Ready')).toBe(false);
  });

  it('is false when the condition is absent or conditions is undefined', () => {
    expect(isConditionTrue([], 'Ready')).toBe(false);
    expect(isConditionTrue(undefined, 'Ready')).toBe(false);
  });
});
