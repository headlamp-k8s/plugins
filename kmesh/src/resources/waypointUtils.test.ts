import { describe, expect, it } from 'vitest';
import {
  getWaypointCurrentStatus,
  getWaypointImage,
  WAYPOINT_PROXY_IMAGE_ANNOTATION,
  type WaypointCondition,
} from './waypointUtils';

describe('getWaypointImage', () => {
  it('returns proxy image from annotation when present', () => {
    const annotations = {
      [WAYPOINT_PROXY_IMAGE_ANNOTATION]: 'kmesh-daemon:v1',
    };
    expect(getWaypointImage(annotations)).toBe('kmesh-daemon:v1');
  });

  it('returns "-" when annotation is missing', () => {
    expect(getWaypointImage({})).toBe('-');
  });

  it('returns "-" when annotations are undefined', () => {
    expect(getWaypointImage(undefined)).toBe('-');
  });
});

describe('getWaypointCurrentStatus', () => {
  it('returns "Programmed" when Programmed condition status is True', () => {
    const conditions: WaypointCondition[] = [{ type: 'Programmed', status: 'True' }];
    expect(getWaypointCurrentStatus(conditions)).toBe('Programmed');
  });

  it('returns "Not Programmed" when Programmed condition status is False', () => {
    const conditions: WaypointCondition[] = [{ type: 'Programmed', status: 'False' }];
    expect(getWaypointCurrentStatus(conditions)).toBe('Not Programmed');
  });

  it('returns "Unknown" when Programmed condition status is Unknown', () => {
    const conditions: WaypointCondition[] = [{ type: 'Programmed', status: 'Unknown' }];
    expect(getWaypointCurrentStatus(conditions)).toBe('Unknown');
  });

  it('falls back to "Accepted" when Programmed is absent and Accepted is True', () => {
    const conditions: WaypointCondition[] = [{ type: 'Accepted', status: 'True' }];
    expect(getWaypointCurrentStatus(conditions)).toBe('Accepted');
  });

  it('falls back to "Not Accepted" when Programmed is absent and Accepted is False', () => {
    const conditions: WaypointCondition[] = [{ type: 'Accepted', status: 'False' }];
    expect(getWaypointCurrentStatus(conditions)).toBe('Not Accepted');
  });

  it('returns "Unknown" when Accepted condition status is Unknown', () => {
    const conditions: WaypointCondition[] = [{ type: 'Accepted', status: 'Unknown' }];
    expect(getWaypointCurrentStatus(conditions)).toBe('Unknown');
  });

  it('returns "Unknown" when conditions are undefined', () => {
    expect(getWaypointCurrentStatus(undefined)).toBe('Unknown');
  });

  it('returns "Unknown" when no matching condition type', () => {
    const conditions: WaypointCondition[] = [{ type: 'SomeOtherCondition', status: 'True' }];
    expect(getWaypointCurrentStatus(conditions)).toBe('Unknown');
  });

  it('Programmed takes precedence over Accepted when both are present', () => {
    const conditions: WaypointCondition[] = [
      { type: 'Accepted', status: 'True' },
      { type: 'Programmed', status: 'False' },
    ];
    expect(getWaypointCurrentStatus(conditions)).toBe('Not Programmed');
  });
});
