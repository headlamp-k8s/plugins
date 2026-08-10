/*
 * Copyright 2026 The Kubernetes Authors
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

import { estimateScheduleIntervalMs } from './cron';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('estimateScheduleIntervalMs', () => {
  it('reads a nightly backup as daily', () => {
    // The schedule CloudNativePG's own documentation uses as its example.
    expect(estimateScheduleIntervalMs('0 0 3 * * *')).toBe(DAY);
  });

  it('reads a step in the hours field as that many hours', () => {
    expect(estimateScheduleIntervalMs('0 0 */6 * * *')).toBe(6 * HOUR);
  });

  it('reads a step in the minutes field as that many minutes', () => {
    expect(estimateScheduleIntervalMs('0 */30 * * * *')).toBe(30 * MINUTE);
  });

  it('reads a fixed minute with a wildcard hour as hourly', () => {
    expect(estimateScheduleIntervalMs('0 15 * * * *')).toBe(HOUR);
  });

  it('reads a weekday-pinned schedule as weekly', () => {
    expect(estimateScheduleIntervalMs('0 0 2 * * 0')).toBe(7 * DAY);
  });

  it('reads a day-of-month-pinned schedule as roughly monthly', () => {
    expect(estimateScheduleIntervalMs('0 0 2 1 * *')).toBe(30 * DAY);
  });

  it('supports the shorthand descriptors the cron library accepts', () => {
    expect(estimateScheduleIntervalMs('@daily')).toBe(DAY);
    expect(estimateScheduleIntervalMs('@midnight')).toBe(DAY);
    expect(estimateScheduleIntervalMs('@hourly')).toBe(HOUR);
    expect(estimateScheduleIntervalMs('@weekly')).toBe(7 * DAY);
  });

  it('supports @every durations', () => {
    expect(estimateScheduleIntervalMs('@every 90m')).toBe(90 * MINUTE);
    expect(estimateScheduleIntervalMs('@every 1h30m')).toBe(HOUR + 30 * MINUTE);
  });

  it('gives up on lists and ranges rather than guessing wrongly', () => {
    // A staleness threshold derived from a wrong interval is worse than no
    // threshold, so anything beyond a step or a fixed value is unknown.
    expect(estimateScheduleIntervalMs('0 0 2,14 * * *')).toBeNull();
    expect(estimateScheduleIntervalMs('0 0 2-6 * * *')).toBeNull();
  });

  it('gives up on expressions that are not six fields', () => {
    // Five-field cron is the Unix form; CloudNativePG expects six and the
    // operator itself rejects the rest, so this is not ours to interpret.
    expect(estimateScheduleIntervalMs('0 3 * * *')).toBeNull();
    expect(estimateScheduleIntervalMs('nonsense')).toBeNull();
  });

  it('returns null for an absent or empty schedule instead of throwing', () => {
    expect(estimateScheduleIntervalMs(null)).toBeNull();
    expect(estimateScheduleIntervalMs(undefined)).toBeNull();
    expect(estimateScheduleIntervalMs('   ')).toBeNull();
  });
});
