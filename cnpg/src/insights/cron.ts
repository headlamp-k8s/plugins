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

/**
 * Approximate interval between runs of a CloudNativePG backup schedule.
 *
 * This is deliberately not a cron implementation. The only question the rules
 * engine asks is "roughly how often should this have run", so the estimator
 * handles the shapes a backup schedule actually takes — a step or a fixed
 * value per field — and returns null for anything else. Null means "unknown",
 * which suppresses the staleness rule; a wrong interval would instead produce
 * a confident and wrong alert, which is worse than no alert.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Fixed-period descriptors accepted by the cron library CloudNativePG uses. */
const DESCRIPTORS: Record<string, number> = {
  '@yearly': 365 * DAY,
  '@annually': 365 * DAY,
  '@monthly': 30 * DAY,
  '@weekly': 7 * DAY,
  '@daily': DAY,
  '@midnight': DAY,
  '@hourly': HOUR,
};

const DURATION_UNITS: Record<string, number> = { h: HOUR, m: MINUTE, s: SECOND };

/** Parses a Go-style duration such as "1h30m". Returns null if unrecognised. */
function parseEveryDuration(text: string): number | null {
  const parts = text.trim().match(/^(\d+[hms])+$/) ? text.trim().match(/\d+[hms]/g) : null;
  if (!parts) {
    return null;
  }

  const total = parts.reduce((sum, part) => {
    const unit = part.slice(-1);
    return sum + Number(part.slice(0, -1)) * DURATION_UNITS[unit];
  }, 0);

  // Zero is not an interval: callers divide by it to count missed runs, so it
  // would produce Infinity rather than a number. Unknown is the honest answer.
  return total > 0 ? total : null;
}

/** A field is either a wildcard, a step such as "every 6", or a fixed number. */
type Field = { kind: 'wildcard' } | { kind: 'step'; every: number } | { kind: 'fixed' } | null;

function parseField(field: string): Field {
  if (field === '*') {
    return { kind: 'wildcard' };
  }

  const step = field.match(/^\*\/(\d+)$/);
  if (step) {
    const every = Number(step[1]);
    return every > 0 ? { kind: 'step', every } : null;
  }

  if (/^\d+$/.test(field)) {
    return { kind: 'fixed' };
  }

  // Lists, ranges, names, and step-over-range are all beyond this estimator.
  return null;
}

/**
 * Returns the approximate milliseconds between runs, or null if unknown.
 *
 * The interval is decided by the finest-grained field that is not pinned to a
 * single value, which is how often the schedule repeats.
 */
export function estimateScheduleIntervalMs(schedule: string | null | undefined): number | null {
  const expression = schedule?.trim();
  if (!expression) {
    return null;
  }

  if (expression.startsWith('@')) {
    if (expression.startsWith('@every ')) {
      return parseEveryDuration(expression.slice('@every '.length));
    }

    return DESCRIPTORS[expression] ?? null;
  }

  const fields = expression.split(/\s+/);
  // CloudNativePG schedules are six fields, seconds first. A five-field Unix
  // expression is rejected by the operator, so it is not ours to interpret.
  if (fields.length !== 6) {
    return null;
  }

  const parsed = fields.map(parseField);
  if (parsed.some(field => field === null)) {
    return null;
  }

  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = parsed as Exclude<Field, null>[];

  const unitFor = (field: Exclude<Field, null>, unit: number): number | null => {
    if (field.kind === 'wildcard') {
      return unit;
    }

    return field.kind === 'step' ? field.every * unit : null;
  };

  const sub = unitFor(second, SECOND) ?? unitFor(minute, MINUTE) ?? unitFor(hour, HOUR);
  if (sub !== null) {
    return sub;
  }

  // Every time-of-day field is pinned, so the schedule runs at most once a day
  // and the calendar fields decide how often that day comes round.
  if (month.kind !== 'wildcard') {
    return 365 * DAY;
  }

  const dayOfMonthConstrained = dayOfMonth.kind !== 'wildcard';
  const dayOfWeekConstrained = dayOfWeek.kind !== 'wildcard';

  // Cron ORs the two day fields rather than intersecting them: "the 1st" and
  // "every Monday" together fire on the union, five or six times a month at
  // uneven gaps. There is no interval to report, and guessing one from whichever
  // field is tested first overstates it several-fold — which makes the staleness
  // rule lenient without saying so.
  if (dayOfMonthConstrained && dayOfWeekConstrained) {
    return null;
  }

  if (dayOfWeekConstrained) {
    // A single weekday repeats weekly. A step over weekdays does not: */2 fires
    // on days 0, 2, 4 and 6, so the gap alternates and there is no one cadence.
    return dayOfWeek.kind === 'fixed' ? 7 * DAY : null;
  }

  if (dayOfMonthConstrained) {
    return dayOfMonth.kind === 'fixed' ? 30 * DAY : unitFor(dayOfMonth, DAY);
  }

  // Every calendar field is a wildcard, so the pinned time of day comes round
  // once every day.
  return DAY;
}
