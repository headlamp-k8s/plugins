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

import { describeTimeUntil } from './futureTime';

const NOW = Date.parse('2026-08-10T12:00:00Z');
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function inFuture(ms: number): string {
  return new Date(NOW + ms).toISOString();
}

describe('describeTimeUntil', () => {
  it('describes a time a few hours away', () => {
    expect(describeTimeUntil(inFuture(3 * HOUR), NOW)).toBe('in 3 hours');
  });

  it('uses the singular for exactly one unit', () => {
    expect(describeTimeUntil(inFuture(1 * HOUR), NOW)).toBe('in 1 hour');
  });

  it('describes a time days away', () => {
    expect(describeTimeUntil(inFuture(5 * DAY), NOW)).toBe('in 5 days');
  });

  it('describes a time minutes away', () => {
    expect(describeTimeUntil(inFuture(20 * MINUTE), NOW)).toBe('in 20 minutes');
  });

  it('describes an imminent time without pretending to precision', () => {
    expect(describeTimeUntil(inFuture(10 * 1000), NOW)).toBe('in less than a minute');
  });

  // The operator publishes nextScheduleTime and updates it after the run, so a
  // moment either side of the boundary it is legitimately in the past. "Due
  // now" is the honest reading; a negative duration is not.
  it('says a run is due when the published time has just passed', () => {
    expect(describeTimeUntil(inFuture(-30 * 1000), NOW)).toBe('due now');
  });

  it('says a run is overdue when the published time is well past', () => {
    expect(describeTimeUntil(inFuture(-2 * HOUR), NOW)).toBe('overdue');
  });

  it('returns null for a timestamp it cannot parse, rather than guessing', () => {
    expect(describeTimeUntil('not a date', NOW)).toBeNull();
  });

  it('returns null for an absent timestamp', () => {
    expect(describeTimeUntil(null, NOW)).toBeNull();
    expect(describeTimeUntil(undefined, NOW)).toBeNull();
  });

  /*
   * The bug this module exists to prevent.
   *
   * Headlamp's Utils.timeAgo is past-only: it computes now - timestamp and
   * hands the negative result to shortHumanDuration, which returns the literal
   * string '<invalid>' below -1 seconds. The "Next run" column rendered every
   * active schedule through it, so every healthy cluster displayed '<invalid>'.
   *
   * A unit test on timeAgo could not have caught it — vitest sets
   * import.meta.env.UNDER_TEST, which makes timeAgo pretend "now" is 90 days
   * after any timestamp, so past and future both return "90d".
   */
  it('never produces the placeholder a past-only formatter emits for future times', () => {
    for (const offset of [1000, MINUTE, HOUR, DAY, 30 * DAY]) {
      expect(describeTimeUntil(inFuture(offset), NOW)).not.toContain('invalid');
    }
  });
});
