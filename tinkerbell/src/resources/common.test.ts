import { normalizeState } from './common';

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
