import { describe, expect, it } from 'vitest';
import { getMongoPhaseStatus } from './status';

describe('getMongoPhaseStatus', () => {
  it('maps "Running" (case-insensitive) to "success"', () => {
    expect(getMongoPhaseStatus('Running')).toBe('success');
    expect(getMongoPhaseStatus('running')).toBe('success');
  });

  it('maps pending, creating, and updating phases to "warning"', () => {
    expect(getMongoPhaseStatus('Pending')).toBe('warning');
    expect(getMongoPhaseStatus('pending')).toBe('warning');
    expect(getMongoPhaseStatus('Creating')).toBe('warning');
    expect(getMongoPhaseStatus('Updating')).toBe('warning');
  });

  it('maps failed and error phases to "error"', () => {
    expect(getMongoPhaseStatus('Failed')).toBe('error');
    expect(getMongoPhaseStatus('failed')).toBe('error');
    expect(getMongoPhaseStatus('Error')).toBe('error');
  });

  it('maps undefined or empty phase to "warning"', () => {
    expect(getMongoPhaseStatus(undefined)).toBe('warning');
    expect(getMongoPhaseStatus('')).toBe('warning');
  });

  it('maps unknown phases to empty string for neutral styling', () => {
    expect(getMongoPhaseStatus('CustomPhase')).toBe('');
    expect(getMongoPhaseStatus('Degraded')).toBe('');
  });
});
