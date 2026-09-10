import { activeConditionType, normalizeState } from './common';

describe('normalizeState', () => {
  it('returns Unknown when no state is available', () => {
    expect(normalizeState(undefined)).toBe('Unknown');
  });

  it('returns Unknown when state is not a string', () => {
    expect(normalizeState({ state: 'SUCCESS' })).toBe('Unknown');
  });

  it('humanizes Tinkerbell workflow state constants', () => {
    expect(normalizeState('STATE_RUNNING')).toBe('Running');
    expect(normalizeState('STATE_TIMED_OUT')).toBe('Timed Out');
  });

  it('humanizes plain underscore-separated states', () => {
    expect(normalizeState('PREPARING_WORKER')).toBe('Preparing Worker');
  });
});

describe('activeConditionType', () => {
  it('returns undefined when there are no conditions', () => {
    expect(activeConditionType(undefined)).toBeUndefined();
    expect(activeConditionType([])).toBeUndefined();
  });

  it('returns the type of a condition that is true', () => {
    expect(activeConditionType([{ type: 'Completed', status: 'True' }])).toBe('Completed');
  });

  // The bug this guards against: reading the type alone reports a failure that the
  // condition explicitly denies.
  it('ignores a condition whose status is False', () => {
    expect(activeConditionType([{ type: 'Failed', status: 'False' }])).toBeUndefined();
  });

  it('ignores a condition whose status is Unknown', () => {
    expect(activeConditionType([{ type: 'Failed', status: 'Unknown' }])).toBeUndefined();
  });

  it('ignores a condition carrying no status at all', () => {
    expect(activeConditionType([{ type: 'Failed' }])).toBeUndefined();
  });

  it('skips false conditions to find the true one, wherever it sits', () => {
    expect(
      activeConditionType([
        { type: 'Completed', status: 'True' },
        { type: 'Failed', status: 'False' },
      ])
    ).toBe('Completed');
  });

  it('takes the last true condition when several are asserted', () => {
    expect(
      activeConditionType([
        { type: 'Running', status: 'True' },
        { type: 'Completed', status: 'True' },
      ])
    ).toBe('Completed');
  });
});
