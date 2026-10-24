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

const EMPTY = '—';

/** Formats a PipeCD unix timestamp (seconds) as an absolute local date and time. */
export function formatTimestamp(unix: number | undefined): string {
  if (!unix || unix === 0) return EMPTY;
  return new Date(unix * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Formats a PipeCD unix timestamp (seconds) as a short relative time, e.g. "3h ago". */
export function relativeTime(unix: number | undefined): string {
  if (!unix || unix === 0) return EMPTY;
  const diffMin = Math.floor((Date.now() - unix * 1000) / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

/** Formats the gap between two PipeCD unix timestamps (seconds) as a duration. */
export function duration(startedAt: number | undefined, completedAt: number | undefined): string {
  if (!startedAt || !completedAt || completedAt < startedAt) return EMPTY;
  const seconds = completedAt - startedAt;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * Formats a PipeCD unix timestamp (seconds) the way the PipeCD console prints
 * log lines: `2026-05-28 14:51:43 +05:30`, in the viewer's local zone.
 */
export function logTimestamp(unix: number | undefined): string {
  if (!unix) return '';
  const date = new Date(unix * 1000);
  const pad = (value: number): string => String(value).padStart(2, '0');

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;

  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${day} ${time} ${offset}`;
}
