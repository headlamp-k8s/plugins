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
});
