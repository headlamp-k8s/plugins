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

import type { Application, Deployment, DeploymentStatus } from '../types/pipecd';

export type TimeRange = '24h' | '7d' | '14d' | '30d';

export const TIME_RANGES: TimeRange[] = ['24h', '7d', '14d', '30d'];

export interface RangeSpec {
  /** Size of one bar in the chart. */
  unit: 'hour' | 'day';
  /** Number of bars. */
  count: number;
}

export const RANGE_SPECS: Record<TimeRange, RangeSpec> = {
  '24h': { unit: 'hour', count: 24 },
  '7d': { unit: 'day', count: 7 },
  '14d': { unit: 'day', count: 14 },
  '30d': { unit: 'day', count: 30 },
};

/** How a deployment is counted in the chart. */
export type Outcome = 'success' | 'failure' | 'inProgress' | 'cancelled';

export const OUTCOMES: Outcome[] = ['success', 'failure', 'inProgress', 'cancelled'];

const OUTCOME_OF: Record<DeploymentStatus, Outcome> = {
  DEPLOYMENT_SUCCESS: 'success',
  DEPLOYMENT_FAILURE: 'failure',
  DEPLOYMENT_PENDING: 'inProgress',
  DEPLOYMENT_PLANNED: 'inProgress',
  DEPLOYMENT_RUNNING: 'inProgress',
  DEPLOYMENT_ROLLING_BACK: 'inProgress',
  DEPLOYMENT_CANCELLED: 'cancelled',
};

export type Bucket = Record<Outcome, number> & {
  /** Start of the hour or day, as a unix timestamp in seconds. */
  start: number;
};

const HOUR_MS = 3600 * 1000;

/**
 * Start of the `offset`-th hour or local day after the current one (negative
 * goes back). Hours are counted in real elapsed time, so when clocks go back
 * the repeated hour gets its own bar, and when they go forward no bar is two
 * hours long. Days use the Date constructor, so a day stays a calendar day.
 */
function unitStart(now: Date, unit: RangeSpec['unit'], offset: number): number {
  if (unit === 'hour') {
    // Cut back to the top of the local hour. Local minutes, not UTC ones, so
    // zones with a half-hour offset still start on the hour.
    const top =
      now.getTime() - now.getMinutes() * 60000 - now.getSeconds() * 1000 - now.getMilliseconds();
    return Math.floor((top + offset * HOUR_MS) / 1000);
  }
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return Math.floor(date.getTime() / 1000);
}

/** Start of the first bucket in the range, in unix seconds. */
export function rangeStart(range: TimeRange, now: Date): number {
  const { unit, count } = RANGE_SPECS[range];
  return unitStart(now, unit, -(count - 1));
}

/**
 * Counts deployments per hour or local day, oldest first, by when they were
 * created. Deployments outside the range are ignored.
 */
export function bucketDeployments(
  deployments: Deployment[],
  range: TimeRange,
  now: Date
): Bucket[] {
  const { unit, count } = RANGE_SPECS[range];
  const buckets: Bucket[] = [];
  for (let i = 0; i < count; i++) {
    const start = unitStart(now, unit, i - (count - 1));
    buckets.push({ start, success: 0, failure: 0, inProgress: 0, cancelled: 0 });
  }
  const end = unitStart(now, unit, 1);

  for (const d of deployments) {
    if (d.createdAt < buckets[0].start || d.createdAt >= end) continue;
    let index = buckets.length - 1;
    while (index > 0 && d.createdAt < buckets[index].start) index--;
    buckets[index][OUTCOME_OF[d.status] ?? 'inProgress']++;
  }
  return buckets;
}

function offsetAt(unix: number): number {
  return new Date(unix * 1000).getTimezoneOffset();
}

/** Short zone name at a moment, e.g. "EDT", or "" if the browser has none. */
function zoneName(unix: number): string {
  return (
    new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(new Date(unix * 1000))
      .find(p => p.type === 'timeZoneName')?.value ?? ''
  );
}

/**
 * The hour a bar covers, e.g. "09–10", so it reads as a span, not a moment.
 * Next to a daylight saving change the zone is added, e.g. "01–02 EDT" and
 * "01–02 EST", so a repeated hour does not show the same label twice.
 * Both ends are given in the zone the bar starts in. Bars start on the hour of
 * the current offset, so across a half-hour clock change (Lord Howe Island)
 * the bars on the other side start at half past, and the minutes are kept:
 * "01:30–02:30".
 */
export function hourSpan(unix: number): string {
  const start = new Date(unix * 1000);
  const hour = start.getHours();
  const minute = start.getMinutes();
  const pad = (n: number): string => String(n).padStart(2, '0');
  const end = (hour + 1) % 24;
  const span =
    minute === 0
      ? `${pad(hour)}–${pad(end)}`
      : `${pad(hour)}:${pad(minute)}–${pad(end)}:${pad(minute)}`;
  const offset = offsetAt(unix);
  const nearChange = offset !== offsetAt(unix - 3600) || offset !== offsetAt(unix + 3600);
  const zone = nearChange ? zoneName(unix) : '';
  return zone ? `${span} ${zone}` : span;
}

export function bucketTotal(b: Bucket): number {
  return b.success + b.failure + b.inProgress + b.cancelled;
}

/**
 * Whole-number ticks for a chart axis, from 0 up to at least `max`, spaced
 * 1, 2 or 5 times a power of ten so there are about four of them.
 */
export function axisTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].map(m => m * magnitude).find(s => s >= rough)!);
  const ticks: number[] = [];
  for (let v = 0; v < max + step; v += step) ticks.push(v);
  return ticks;
}

export interface FailureRate {
  failed: number;
  /** Deployments that finished, successfully or not. */
  finished: number;
  /** Between 0 and 1. Zero when nothing has finished. */
  rate: number;
}

/**
 * Share of finished deployments that failed. Running and cancelled
 * deployments have no outcome yet, so they are left out of both counts.
 */
export function failureRate(deployments: Deployment[]): FailureRate {
  let failed = 0;
  let finished = 0;
  for (const d of deployments) {
    if (d.status === 'DEPLOYMENT_FAILURE') {
      failed++;
      finished++;
    } else if (d.status === 'DEPLOYMENT_SUCCESS') {
      finished++;
    }
  }
  return { failed, finished, rate: finished === 0 ? 0 : failed / finished };
}

export interface SyncCounts {
  synced: number;
  outOfSync: number;
}

export function countSync(apps: Application[]): SyncCounts {
  let synced = 0;
  let outOfSync = 0;
  for (const app of apps) {
    if (app.syncState?.status === 'SYNCED') synced++;
    else if (app.syncState?.status === 'OUT_OF_SYNC') outOfSync++;
  }
  return { synced, outOfSync };
}

/**
 * Every piped id referenced by an application or a deployment, with the number
 * of applications on it. On a server without ListPipeds this is the only way to
 * find pipeds with an API key: one with no application and no deployment in the
 * range cannot be found.
 */
export function knownPipeds(apps: Application[], deployments: Deployment[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const app of apps) {
    if (!app.pipedId) continue;
    counts.set(app.pipedId, (counts.get(app.pipedId) ?? 0) + 1);
  }
  for (const d of deployments) {
    if (d.pipedId && !counts.has(d.pipedId)) counts.set(d.pipedId, 0);
  }
  return counts;
}

/** The newest deployments first, by creation time. */
export function recentDeployments(deployments: Deployment[], limit: number): Deployment[] {
  return [...deployments].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
