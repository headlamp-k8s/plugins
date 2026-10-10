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

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** How far past a published time still reads as "about to happen". */
const DUE_NOW_GRACE = 2 * MINUTE;

/**
 * Describes a time in the future, for values the operator publishes ahead of
 * the event — currently ScheduledBackup.status.nextScheduleTime.
 *
 * Headlamp's Utils.timeAgo cannot be used for these. It is past-only: it
 * computes `now - timestamp` and passes the result to shortHumanDuration,
 * which returns the literal string '<invalid>' once the value drops below -1
 * seconds. Rendering a future timestamp through it puts '<invalid>' on screen
 * for every cluster with an active schedule.
 *
 * Returns null when there is nothing truthful to say, so callers render their
 * own placeholder rather than being handed a guess.
 */
export function describeTimeUntil(
  timestamp: string | null | undefined,
  now: number
): string | null {
  if (!timestamp) {
    return null;
  }

  const target = Date.parse(timestamp);
  if (Number.isNaN(target)) {
    return null;
  }

  const remaining = target - now;

  // The operator republishes nextScheduleTime after a run, so a value a little
  // way in the past is a normal race rather than a missed backup. Past that
  // grace period it is worth saying the run has not happened.
  if (remaining < -DUE_NOW_GRACE) {
    return 'overdue';
  }

  if (remaining <= 0) {
    return 'due now';
  }

  const units: Array<[number, string]> = [
    [DAY, 'day'],
    [HOUR, 'hour'],
    [MINUTE, 'minute'],
  ];

  for (const [size, label] of units) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      return `in ${count} ${label}${count === 1 ? '' : 's'}`;
    }
  }

  return 'in less than a minute';
}
