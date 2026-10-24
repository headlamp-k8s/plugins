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

import { afterEach, describe, expect, it, vi } from 'vitest';
import { duration, formatTimestamp, logTimestamp, relativeTime } from '../utils/time';

const EMPTY = '—';
const NOW = 1_722_000_000_000; // 2024-07-26T12:40:00Z

afterEach(() => {
  vi.useRealTimers();
});

function freezeClock(): void {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
}

describe('formatTimestamp', () => {
  it('returns a placeholder for missing or zero timestamps', () => {
    expect(formatTimestamp(undefined)).toBe(EMPTY);
    expect(formatTimestamp(0)).toBe(EMPTY);
  });

  it('renders a timestamp as an absolute date and time', () => {
    const formatted = formatTimestamp(1_722_000_000);

    expect(formatted).not.toBe(EMPTY);
    expect(formatted).toBe(
      new Date(1_722_000_000_000).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    );
  });
});

describe('relativeTime', () => {
  it('returns a placeholder for missing or zero timestamps', () => {
    expect(relativeTime(undefined)).toBe(EMPTY);
    expect(relativeTime(0)).toBe(EMPTY);
  });

  it('describes a timestamp from seconds ago as "just now"', () => {
    freezeClock();

    expect(relativeTime(NOW / 1000 - 30)).toBe('just now');
  });

  it('describes minutes, hours and days', () => {
    freezeClock();

    expect(relativeTime(NOW / 1000 - 5 * 60)).toBe('5m ago');
    expect(relativeTime(NOW / 1000 - 3 * 60 * 60)).toBe('3h ago');
    expect(relativeTime(NOW / 1000 - 2 * 24 * 60 * 60)).toBe('2d ago');
  });
});

describe('duration', () => {
  it('returns a placeholder when either end is missing', () => {
    expect(duration(undefined, 100)).toBe(EMPTY);
    expect(duration(100, undefined)).toBe(EMPTY);
    expect(duration(0, 0)).toBe(EMPTY);
  });

  it('returns a placeholder when the deployment ended before it started', () => {
    expect(duration(200, 100)).toBe(EMPTY);
  });

  it('formats seconds, minutes and hours', () => {
    expect(duration(1000, 1045)).toBe('45s');
    expect(duration(1000, 1000 + 3 * 60 + 12)).toBe('3m 12s');
    expect(duration(1000, 1000 + 2 * 60 * 60 + 5 * 60)).toBe('2h 5m');
  });
});

describe('logTimestamp', () => {
  it('returns an empty string for missing or zero timestamps', () => {
    expect(logTimestamp(undefined)).toBe('');
    expect(logTimestamp(0)).toBe('');
  });

  it('formats a timestamp the way the PipeCD console does', () => {
    // Local-zone dependent, so assert the shape rather than a fixed instant.
    expect(logTimestamp(1_748_422_903)).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{2}:\d{2}$/
    );
  });

  it('matches the local clock for the given instant', () => {
    const unix = 1_748_422_903;
    const date = new Date(unix * 1000);
    const pad = (value: number): string => String(value).padStart(2, '0');

    expect(logTimestamp(unix).startsWith(`${date.getFullYear()}-${pad(date.getMonth() + 1)}`)).toBe(
      true
    );
    expect(logTimestamp(unix)).toContain(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
  });
});
