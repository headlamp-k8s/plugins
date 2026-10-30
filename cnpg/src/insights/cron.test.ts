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

  /*
   * Cron ORs the two day fields: when both day-of-month and day-of-week are
   * constrained, the schedule fires on the union of them, so "the 1st" and
   * "every Monday" together run five or six times a month at uneven gaps. There
   * is no single interval to report, and the previous reading — 30 days, from
   * whichever field was tested first — was roughly five times too long. A
   * too-long interval makes the staleness rule silently lenient.
   */
  it('gives up when both day fields are constrained, because cron ORs them', () => {
    expect(estimateScheduleIntervalMs('0 0 2 1 * 1')).toBeNull();
    expect(estimateScheduleIntervalMs('0 0 2 */2 * 1')).toBeNull();
  });

  /*
   * The mirror image, and the one that produces false alarms rather than
   * silence: a wildcard day-of-month used to be read as "daily" and returned
   * before the day-of-week field was ever consulted, so a schedule running some
   * days of the week was judged against a one-day threshold.
   */
  it('does not read a stepped day-of-week as daily just because day-of-month is a wildcard', () => {
    expect(estimateScheduleIntervalMs('0 0 2 * * */2')).toBeNull();
  });

  it('still reads an unconstrained daily schedule as daily', () => {
    expect(estimateScheduleIntervalMs('0 0 2 * * *')).toBe(DAY);
  });

  /*
   * The same reasoning as the day fields, one level up. A fixed month comes
   * round once a year, but a step does not divide the year evenly: a quarterly
   * step fires in months 1, 4, 7 and 10, then waits five months for the next
   * January. Reading that as yearly overstates the interval fourfold and makes
   * the staleness rule lenient without saying so.
   */
  it('reads a fixed month as yearly but gives up on a stepped month', () => {
    expect(estimateScheduleIntervalMs('0 0 2 1 1 *')).toBe(365 * DAY);
    expect(estimateScheduleIntervalMs('0 0 2 1 */3 *')).toBeNull();
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

  /*
   * A zero interval is not a very frequent schedule, it is a nonsensical one.
   * Callers divide an age by this value to count missed runs, so returning 0
   * yields Infinity — "Infinity scheduled runs missed" on screen. The step
   * fields already reject zero for the same reason.
   */
  it('treats a zero-length @every duration as unknown rather than as an interval', () => {
    expect(estimateScheduleIntervalMs('@every 0s')).toBeNull();
    expect(estimateScheduleIntervalMs('@every 0h0m0s')).toBeNull();
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
