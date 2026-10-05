import { describe, expect, it } from 'vitest';
import {
  getWaypointNodeStatus,
  isWaypointEnrolled,
  resolveEffectiveWaypointName,
  USE_WAYPOINT_LABEL,
} from './mapUtils';

describe('getWaypointNodeStatus', () => {
  it('returns success for Programmed', () => {
    expect(getWaypointNodeStatus('Programmed')).toBe('success');
  });

  it('returns success for Accepted', () => {
    expect(getWaypointNodeStatus('Accepted')).toBe('success');
  });

  it('returns error for Not Programmed', () => {
    expect(getWaypointNodeStatus('Not Programmed')).toBe('error');
  });

  it('returns error for Not Accepted', () => {
    expect(getWaypointNodeStatus('Not Accepted')).toBe('error');
  });

  it('returns warning for Unknown', () => {
    expect(getWaypointNodeStatus('Unknown')).toBe('warning');
  });
});

describe('resolveEffectiveWaypointName', () => {
  it('prefers the resource label over the namespace label', () => {
    expect(
      resolveEffectiveWaypointName(
        { [USE_WAYPOINT_LABEL]: 'service-waypoint' },
        { [USE_WAYPOINT_LABEL]: 'namespace-waypoint' }
      )
    ).toBe('service-waypoint');
  });

  it('falls back to the namespace label', () => {
    expect(
      resolveEffectiveWaypointName(undefined, { [USE_WAYPOINT_LABEL]: 'namespace-waypoint' })
    ).toBe('namespace-waypoint');
  });

  it('returns undefined when neither is set', () => {
    expect(resolveEffectiveWaypointName({}, {})).toBeUndefined();
    expect(resolveEffectiveWaypointName(undefined, undefined)).toBeUndefined();
  });
});

describe('isWaypointEnrolled', () => {
  it('is true when a waypoint name resolves', () => {
    expect(isWaypointEnrolled({ [USE_WAYPOINT_LABEL]: 'wp' }, undefined)).toBe(true);
  });

  it('is false when no waypoint name resolves', () => {
    expect(isWaypointEnrolled(undefined, undefined)).toBe(false);
  });
});
