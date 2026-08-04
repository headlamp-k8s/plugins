import { describe, expect, it } from 'vitest';
import { joinOrDash, phaseToStatus } from './common';

describe('phaseToStatus', () => {
  it('treats finished and available phases as success', () => {
    expect(phaseToStatus('Completed')).toBe('success');
    expect(phaseToStatus('Available')).toBe('success');
    expect(phaseToStatus('Enabled')).toBe('success');
  });

  it('treats failures and partial failures as errors', () => {
    expect(phaseToStatus('Failed')).toBe('error');
    expect(phaseToStatus('FailedValidation')).toBe('error');
    expect(phaseToStatus('PartiallyFailed')).toBe('error');
    expect(phaseToStatus('Unavailable')).toBe('error');
  });

  it('treats in flight phases as warnings', () => {
    expect(phaseToStatus('New')).toBe('warning');
    expect(phaseToStatus('InProgress')).toBe('warning');
    expect(phaseToStatus('Deleting')).toBe('warning');
  });

  it('returns no status for a missing or unknown phase', () => {
    expect(phaseToStatus(undefined)).toBe('');
    expect(phaseToStatus('SomethingNew')).toBe('');
  });
});

describe('joinOrDash', () => {
  it('joins the values with a comma', () => {
    expect(joinOrDash(['default', 'kube-system'])).toBe('default, kube-system');
    expect(joinOrDash(['default'])).toBe('default');
  });

  it('shows a dash when there is nothing to list', () => {
    expect(joinOrDash([])).toBe('-');
    expect(joinOrDash(undefined)).toBe('-');
  });
});
