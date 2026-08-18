import { describe, expect, it } from 'vitest';
import { sortEventsByAge } from './EventList';

function fakeEvent(lastOccurrence: string) {
  return { lastOccurrence } as any;
}

describe('sortEventsByAge', () => {
  it('sorts newer events before older ones', () => {
    const newer = fakeEvent('2024-06-01T00:00:00Z');
    const older = fakeEvent('2024-01-01T00:00:00Z');
    expect(sortEventsByAge(newer, older)).toBeLessThan(0);
    expect(sortEventsByAge(older, newer)).toBeGreaterThan(0);
  });

  it('treats equal timestamps as equal', () => {
    const a = fakeEvent('2024-01-01T00:00:00Z');
    const b = fakeEvent('2024-01-01T00:00:00Z');
    expect(sortEventsByAge(a, b)).toBe(0);
  });
});
