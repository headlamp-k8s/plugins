/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { vi } from 'vitest';
import { getAge } from './time';

describe('getAge', () => {
  const MOCK_NOW = 1704067200000; // 2024-01-01T00:00:00.000Z

  beforeAll(() => {
    vi.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should return empty string for undefined timestamp', () => {
    expect(getAge(undefined)).toBe('');
  });

  it('should return empty string for empty string input', () => {
    expect(getAge('')).toBe('');
  });

  it('should treat current time as 0m', () => {
    const nowStr = new Date(MOCK_NOW).toISOString();
    expect(getAge(nowStr)).toBe('0m');
  });

  it('should return minutes for duration < 60 mins', () => {
    const fiftyNineMinsAgo = MOCK_NOW - 59 * 60 * 1000;
    expect(getAge(new Date(fiftyNineMinsAgo).toISOString())).toBe('59m');
  });

  it('should return hours for duration >= 60 mins and < 48 hours', () => {
    const sixtyMinsAgo = MOCK_NOW - 60 * 60 * 1000;
    expect(getAge(new Date(sixtyMinsAgo).toISOString())).toBe('1h');

    const fortySevenHoursAgo = MOCK_NOW - 47 * 60 * 60 * 1000;
    expect(getAge(new Date(fortySevenHoursAgo).toISOString())).toBe('47h');
  });

  it('should return days for duration >= 48 hours', () => {
    const fortyEightHoursAgo = MOCK_NOW - 48 * 60 * 60 * 1000;
    expect(getAge(new Date(fortyEightHoursAgo).toISOString())).toBe('2d');

    const fiveDaysAgo = MOCK_NOW - 5 * 24 * 60 * 60 * 1000;
    expect(getAge(new Date(fiveDaysAgo).toISOString())).toBe('5d');
  });

  it('should handle edge case: 1 minute duration', () => {
    const oneMinAgo = MOCK_NOW - 60 * 1000;
    expect(getAge(new Date(oneMinAgo).toISOString())).toBe('1m');
  });

  it('should handle edge case: 59 minutes duration', () => {
    const fiftyNineMinsAgo = MOCK_NOW - 59 * 60 * 1000;
    expect(getAge(new Date(fiftyNineMinsAgo).toISOString())).toBe('59m');
  });

  it('should handle boundary: 60 minutes (1 hour)', () => {
    const sixtyMinsAgo = MOCK_NOW - 60 * 60 * 1000;
    expect(getAge(new Date(sixtyMinsAgo).toISOString())).toBe('1h');
  });

  it('should handle boundary: 47 hours (just before 48h cutoff)', () => {
    const fortySevenHoursAgo = MOCK_NOW - 47 * 60 * 60 * 1000;
    expect(getAge(new Date(fortySevenHoursAgo).toISOString())).toBe('47h');
  });

  it('should handle boundary: 48 hours (day cutoff)', () => {
    const fortyEightHoursAgo = MOCK_NOW - 48 * 60 * 60 * 1000;
    expect(getAge(new Date(fortyEightHoursAgo).toISOString())).toBe('2d');
  });

  it('should handle very large durations (100+ days)', () => {
    const hundredDaysAgo = MOCK_NOW - 100 * 24 * 60 * 60 * 1000;
    expect(getAge(new Date(hundredDaysAgo).toISOString())).toBe('100d');
  });

  it('should handle very large durations (1 year)', () => {
    const oneYearAgo = MOCK_NOW - 365 * 24 * 60 * 60 * 1000;
    expect(getAge(new Date(oneYearAgo).toISOString())).toBe('365d');
  });

  it('should handle future timestamps (returns negative minutes)', () => {
    const futureTimestamp = MOCK_NOW + 1000; // 1 second in the future
    const result = getAge(new Date(futureTimestamp).toISOString());
    // The function returns negative minutes for future timestamps
    expect(result).toMatch(/^-\d+m$/);
  });

  it('should handle malformed ISO string (returns NaN days)', () => {
    const result = getAge('not-a-valid-timestamp');
    // When parsing fails, new Date() returns Invalid Date,
    // which leads to NaN arithmetic resulting in 'NaNd'
    expect(result).toBe('NaNd');
  });

  it('should handle null timestamp', () => {
    expect(getAge(null as any)).toBe('');
  });

  it('should be deterministic with mocked time', () => {
    const timestamp = new Date(MOCK_NOW - 30 * 60 * 1000).toISOString();
    expect(getAge(timestamp)).toBe('30m');
    expect(getAge(timestamp)).toBe('30m');
    expect(getAge(timestamp)).toBe('30m');
  });

  it('should correctly handle sub-second precision', () => {
    const almostOneMinAgo = MOCK_NOW - 59999; // 59.999 seconds
    expect(getAge(new Date(almostOneMinAgo).toISOString())).toBe('0m');
  });

  it('should round down minute calculations', () => {
    const oneMinThirtySecsAgo = MOCK_NOW - 90 * 1000; // 1m 30s
    expect(getAge(new Date(oneMinThirtySecsAgo).toISOString())).toBe('1m');
  });

  it('should handle ISO timestamps with different formats', () => {
    const isoString1 = new Date(MOCK_NOW - 2 * 60 * 1000).toISOString();
    const isoString2 = new Date(MOCK_NOW - 2 * 60 * 1000).toISOString().replace('Z', '+00:00');
    expect(getAge(isoString1)).toBe('2m');
    expect(getAge(isoString2)).toBe('2m');
  });
});
