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

/** Model of a Helm release, projected from the record Helm keeps in its storage Secret. */

export type ValuesMap = Record<string, unknown>;

/** What `helm ls` shows for a release: one row of the list. */
export interface HelmReleaseSummary {
  namespace: string;
  name: string;
  revision: number;
  /** Helm status: deployed, superseded, failed, uninstalled, pending-install... */
  status: string;
  /** Last deployment date, ISO 8601. */
  updated?: string;
  /** First deployment date of the release, ISO 8601. */
  firstDeployed?: string;
  chartName: string;
  chartVersion: string;
  appVersion: string;
  /** Address of the icon the chart declares, when it is one a browser can safely load. */
  chartIcon?: string;
  /** Helm description of the revision, such as "Upgrade complete". */
  description: string;
}

/** One revision of a release, with everything the detail view explores. */
export interface HelmRevision extends HelmReleaseSummary {
  chartDescription: string;
  /** Values given by the user at install or upgrade time (`helm get values`). */
  userValues: ValuesMap;
  /** Default values shipped by the chart. */
  defaultValues: ValuesMap;
  /** Manifest rendered by Helm for this revision. */
  manifest: string;
  /** Rendered NOTES.txt of the chart. */
  notes: string;
}

/** Identity read on the Secret itself, used when the payload does not give it. */
export interface ReleaseIdentity {
  namespace: string;
  name?: string;
  revision?: number;
  status?: string;
}

const UNKNOWN_STATUS = 'unknown';
const STATUS_PATTERN = /^[a-z][a-z-]{0,31}$/;
const MAX_TEXT_LENGTH = 512;
const MAX_ICON_URL_LENGTH = 2048;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, limit: number = MAX_TEXT_LENGTH): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > limit ? `${trimmed.slice(0, limit - 1)}…` : trimmed;
}

function positiveInteger(value: unknown): number | undefined {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  return typeof number === 'number' && Number.isInteger(number) && number > 0 ? number : undefined;
}

export function normalizeStatus(value: unknown): string {
  return typeof value === 'string' && STATUS_PATTERN.test(value) ? value : UNKNOWN_STATUS;
}

/**
 * Normalizes a Helm timestamp to ISO 8601 with milliseconds.
 *
 * Helm writes nanoseconds, which not every browser parses, and uses the year 1 for unset dates.
 */
export function normalizeTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const milliseconds = Date.parse(value.trim().replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(milliseconds) || milliseconds <= 0) return undefined;
  return new Date(milliseconds).toISOString();
}

/**
 * Keeps the `icon` of a chart only when it is a plain HTTPS address.
 *
 * The address is written by the chart author and ends up in an `<img>`: anything else (another
 * scheme, embedded credentials, an oversized value) is dropped rather than handed to the browser.
 */
export function chartIconUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.length > MAX_ICON_URL_LENGTH) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

/**
 * Builds a revision from a decoded Helm release.
 *
 * The namespace always comes from the Secret: it is the one the user was authorised on.
 *
 * @returns undefined when the record does not identify a release revision.
 */
export function parseRevision(raw: unknown, identity: ReleaseIdentity): HelmRevision | undefined {
  if (!isPlainObject(raw)) return undefined;

  const info = isPlainObject(raw.info) ? raw.info : {};
  const chart = isPlainObject(raw.chart) ? raw.chart : {};
  const metadata = isPlainObject(chart.metadata) ? chart.metadata : {};

  const name = text(raw.name, 253) || identity.name;
  const revision = positiveInteger(raw.version) ?? identity.revision;
  if (!name || revision === undefined) return undefined;

  const status = normalizeStatus(info.status);

  return {
    namespace: identity.namespace,
    name,
    revision,
    status: status === UNKNOWN_STATUS ? normalizeStatus(identity.status) : status,
    updated: normalizeTimestamp(info.last_deployed),
    firstDeployed: normalizeTimestamp(info.first_deployed),
    chartName: text(metadata.name, 253),
    chartVersion: text(metadata.version, 128),
    appVersion: text(metadata.appVersion, 128),
    chartIcon: chartIconUrl(metadata.icon),
    description: text(info.description),
    chartDescription: text(metadata.description),
    userValues: isPlainObject(raw.config) ? raw.config : {},
    defaultValues: isPlainObject(chart.values) ? chart.values : {},
    manifest: typeof raw.manifest === 'string' ? raw.manifest : '',
    notes: typeof info.notes === 'string' ? info.notes : '',
  };
}

/** Keeps the list row of a revision and drops its heavy content (values, manifest, notes). */
export function toSummary(revision: HelmRevision): HelmReleaseSummary {
  return {
    namespace: revision.namespace,
    name: revision.name,
    revision: revision.revision,
    status: revision.status,
    updated: revision.updated,
    firstDeployed: revision.firstDeployed,
    chartName: revision.chartName,
    chartVersion: revision.chartVersion,
    appVersion: revision.appVersion,
    chartIcon: revision.chartIcon,
    description: revision.description,
  };
}

/** `chart-version`, as shown by `helm ls`. */
export function chartLabel(release: Pick<HelmReleaseSummary, 'chartName' | 'chartVersion'>) {
  return [release.chartName, release.chartVersion].filter(Boolean).join('-');
}

export type StatusSeverity = 'success' | 'warning' | 'error' | '';

/** Maps a Helm status to the severity of the Headlamp status label. */
export function statusSeverity(status: string): StatusSeverity {
  if (status === 'deployed') return 'success';
  if (status === 'failed') return 'error';
  if (status.startsWith('pending-') || status === 'uninstalling') return 'warning';
  return '';
}

const HEALTHY_STATUS = 'deployed';

/**
 * Severity of a status in the summary of the list, where the point is to spot what is not
 * deployed: `deployed` stays neutral and every other status stands out.
 */
export function attentionSeverity(status: string): StatusSeverity {
  if (status === HEALTHY_STATUS) return '';
  return status === 'failed' ? 'error' : 'warning';
}

export interface StatusCount {
  status: string;
  count: number;
}

/** Counts the releases of each status, those needing attention first and `deployed` last. */
export function countByStatus(releases: Pick<HelmReleaseSummary, 'status'>[]): StatusCount[] {
  const counts = new Map<string, number>();
  for (const { status } of releases) counts.set(status, (counts.get(status) ?? 0) + 1);

  const rank = (status: string) =>
    status === 'failed' ? 0 : attentionSeverity(status) === 'warning' ? 1 : 2;
  return [...counts]
    .map(([status, count]) => ({ status, count }))
    .sort(
      (left, right) =>
        rank(left.status) - rank(right.status) || left.status.localeCompare(right.status)
    );
}
