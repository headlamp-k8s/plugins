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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export const DISCOVERY_CACHE_TTL_MS = 30_000;
export const DISCOVERY_CONCURRENCY = 6;
export const AGGREGATED_DISCOVERY_ACCEPT =
  'application/json;v=v2;g=apidiscovery.k8s.io;as=APIGroupDiscoveryList,application/json';

export interface ApiDescriptor {
  group: string;
  version: string;
  kind: string;
}

export interface DiscoveredApiResource {
  group: string;
  kind: string;
  versions: Set<string>;
  namespaced?: boolean;
  resourceNames: Set<string>;
}

/** Normalized Kubernetes API catalogue used by availability evaluation. */
export interface ApiCatalog {
  resources: Map<string, DiscoveredApiResource>;
  preferredVersions: Map<string, string>;
  knownGroups: Set<string>;
  completeGroups: Set<string>;
  failedGroups: Set<string>;
  coreRootComplete: boolean;
  groupedRootComplete: boolean;
}

interface CachedRequest {
  promise: Promise<unknown>;
  expiresAt: number;
}

interface AggregatedVersion {
  version?: unknown;
  freshness?: unknown;
  resources?: unknown;
}

interface AggregatedGroup {
  metadata?: { name?: unknown };
  versions?: unknown;
}

interface AggregatedResource {
  resource?: unknown;
  scope?: unknown;
  responseKind?: { group?: unknown; version?: unknown; kind?: unknown };
}

interface GroupDiscovery {
  name?: unknown;
  versions?: unknown;
  preferredVersion?: { version?: unknown };
}

const requestCache = new Map<string, CachedRequest>();

function newCatalog(): ApiCatalog {
  return {
    resources: new Map(),
    preferredVersions: new Map(),
    knownGroups: new Set(),
    completeGroups: new Set(),
    failedGroups: new Set(),
    coreRootComplete: false,
    groupedRootComplete: false,
  };
}

export function apiResourceKey(group: string, kind: string): string {
  return `${group}/${kind}`;
}

function groupVersionKey(group: string, version: string): string {
  return `${group}/${version}`;
}

function isSafeApiSegment(value: string): boolean {
  return /^[a-z0-9][a-z0-9.-]*$/i.test(value);
}

function normalizeGroup(group: unknown): string {
  return group === 'core' || group === undefined || group === null ? '' : String(group);
}

function cachedRequest(path: string, cluster: string, aggregated = false): Promise<unknown> {
  const key = `${cluster}|${aggregated ? 'aggregated' : 'standard'}|${path}`;
  const now = Date.now();
  const cached = requestCache.get(key);
  if (cached && (cached.expiresAt === 0 || cached.expiresAt > now)) {
    return cached.promise;
  }

  const params: RequestInit & { cluster: string } = { cluster };
  if (aggregated) {
    params.headers = { Accept: AGGREGATED_DISCOVERY_ACCEPT };
  }

  const entry: CachedRequest = {
    expiresAt: 0,
    promise: Promise.resolve(),
  };
  entry.promise = ApiProxy.request(path, params, false)
    .then(result => {
      entry.expiresAt = Date.now() + DISCOVERY_CACHE_TTL_MS;
      return result;
    })
    .catch(error => {
      requestCache.delete(key);
      throw error;
    });
  requestCache.set(key, entry);
  return entry.promise;
}

/** Clears discovery request state. Exported only to keep tests deterministic. */
export function resetApiDiscoveryCache(): void {
  requestCache.clear();
}

function isAggregatedDiscovery(value: unknown): value is {
  kind?: string;
  apiVersion?: string;
  items?: unknown[];
} {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return data.kind === 'APIGroupDiscoveryList' || data.apiVersion === 'apidiscovery.k8s.io/v2';
}

function addResource(
  catalog: ApiCatalog,
  group: string,
  version: string,
  kind: string,
  resourceName: string,
  namespaced?: boolean
): void {
  if (!version || !kind || !resourceName || resourceName.includes('/')) return;
  const key = apiResourceKey(group, kind);
  const existing = catalog.resources.get(key) ?? {
    group,
    kind,
    versions: new Set<string>(),
    resourceNames: new Set<string>(),
  };
  existing.versions.add(version);
  existing.resourceNames.add(resourceName);
  if (namespaced !== undefined) existing.namespaced = namespaced;
  catalog.resources.set(key, existing);
}

function parseAggregatedDiscovery(
  value: unknown,
  catalog: ApiCatalog,
  source: 'core' | 'grouped'
): void {
  if (!isAggregatedDiscovery(value)) return;
  if (source === 'core') catalog.coreRootComplete = true;
  else catalog.groupedRootComplete = true;

  const items = Array.isArray(value.items) ? value.items : [];
  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const item = rawItem as AggregatedGroup;
    const metadataGroup = normalizeGroup(item.metadata?.name);
    const versions = Array.isArray(item.versions) ? item.versions : [];
    const firstVersion = versions
      .map(entry => (entry as AggregatedVersion | undefined)?.version)
      .find((version): version is string => typeof version === 'string');
    if (firstVersion) catalog.preferredVersions.set(metadataGroup, firstVersion);
    catalog.knownGroups.add(metadataGroup);

    let complete = true;
    for (const rawVersion of versions) {
      if (!rawVersion || typeof rawVersion !== 'object') continue;
      const versionEntry = rawVersion as AggregatedVersion;
      const version = typeof versionEntry.version === 'string' ? versionEntry.version : '';
      if (versionEntry.freshness && versionEntry.freshness !== 'Current') {
        complete = false;
        continue;
      }
      for (const rawResource of Array.isArray(versionEntry.resources)
        ? versionEntry.resources
        : []) {
        if (!rawResource || typeof rawResource !== 'object') continue;
        const resource = rawResource as AggregatedResource;
        const responseKind = resource.responseKind ?? {};
        const group = normalizeGroup(responseKind.group ?? metadataGroup);
        addResource(
          catalog,
          group,
          String(responseKind.version ?? version),
          String(responseKind.kind ?? ''),
          String(resource.resource ?? ''),
          resource.scope === 'Namespaced' ? true : resource.scope === 'Cluster' ? false : undefined
        );
      }
    }

    if (complete) catalog.completeGroups.add(metadataGroup);
    else catalog.failedGroups.add(metadataGroup);
  }
}

function parseCoreRoot(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const versions = (value as Record<string, unknown>).versions;
  return Array.isArray(versions)
    ? versions.filter((version): version is string => typeof version === 'string')
    : [];
}

interface GroupRootResult {
  versions: Map<string, string[]>;
  preferredVersions: Map<string, string>;
}

function parseGroupedRoot(value: unknown): GroupRootResult {
  const result: GroupRootResult = { versions: new Map(), preferredVersions: new Map() };
  if (!value || typeof value !== 'object') return result;
  const groups = (value as Record<string, unknown>).groups;
  if (!Array.isArray(groups)) return result;

  for (const rawGroup of groups) {
    if (!rawGroup || typeof rawGroup !== 'object') continue;
    const group = rawGroup as GroupDiscovery;
    if (typeof group.name !== 'string' || !group.name) continue;
    const versions = (Array.isArray(group.versions) ? group.versions : [])
      .map(entry => (entry as { version?: unknown } | undefined)?.version)
      .filter((version: unknown): version is string => typeof version === 'string');
    result.versions.set(group.name, versions);
    if (typeof group.preferredVersion?.version === 'string') {
      result.preferredVersions.set(group.name, group.preferredVersion.version);
    }
  }
  return result;
}

function parseApiResourceList(value: unknown, catalog: ApiCatalog, group: string, version: string) {
  if (!value || typeof value !== 'object') return;
  const resources = (value as Record<string, unknown>).resources;
  if (!Array.isArray(resources)) return;
  for (const rawResource of resources) {
    if (!rawResource || typeof rawResource !== 'object') continue;
    const resource = rawResource as Record<string, unknown>;
    addResource(
      catalog,
      group,
      version,
      typeof resource.kind === 'string' ? resource.kind : '',
      typeof resource.name === 'string' ? resource.name : '',
      typeof resource.namespaced === 'boolean' ? resource.namespaced : undefined
    );
  }
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit = DISCOVERY_CONCURRENCY
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

interface VersionRequest {
  group: string;
  version: string;
  path: string;
}

function apiVersionPath(group: string, version: string): string | null {
  if (!isSafeApiSegment(version) || (group && !isSafeApiSegment(group))) return null;
  return group
    ? `/apis/${encodeURIComponent(group)}/${encodeURIComponent(version)}`
    : `/api/${encodeURIComponent(version)}`;
}

/**
 * Discovers the APIs relevant to an Application's managed resources.
 *
 * Aggregated discovery is preferred. Older clusters fall back to fetching only
 * the groups used by the supplied descriptors.
 */
export async function discoverApiCatalog(
  cluster: string,
  descriptors: ApiDescriptor[]
): Promise<ApiCatalog> {
  const catalog = newCatalog();
  const relevantGroups = new Set(descriptors.map(descriptor => descriptor.group || ''));

  const [coreResult, groupedResult] = await Promise.allSettled([
    cachedRequest('/api', cluster, true),
    cachedRequest('/apis', cluster, true),
  ]);

  const coreAggregated =
    coreResult.status === 'fulfilled' && isAggregatedDiscovery(coreResult.value);
  const groupedAggregated =
    groupedResult.status === 'fulfilled' && isAggregatedDiscovery(groupedResult.value);

  if (coreAggregated) parseAggregatedDiscovery(coreResult.value, catalog, 'core');
  if (groupedAggregated) parseAggregatedDiscovery(groupedResult.value, catalog, 'grouped');

  const versionsByGroup = new Map<string, string[]>();

  if (!coreAggregated && relevantGroups.has('')) {
    if (coreResult.status === 'fulfilled') {
      const versions = parseCoreRoot(coreResult.value);
      catalog.coreRootComplete = true;
      catalog.knownGroups.add('');
      versionsByGroup.set('', versions);
      if (versions[0]) catalog.preferredVersions.set('', versions[0]);
    } else {
      catalog.failedGroups.add('');
    }
  }

  if (!groupedAggregated && [...relevantGroups].some(group => group !== '')) {
    if (groupedResult.status === 'fulfilled') {
      const parsed = parseGroupedRoot(groupedResult.value);
      catalog.groupedRootComplete = true;
      for (const [group, versions] of parsed.versions) {
        catalog.knownGroups.add(group);
        if (relevantGroups.has(group)) versionsByGroup.set(group, versions);
      }
      for (const [group, preferred] of parsed.preferredVersions) {
        catalog.preferredVersions.set(group, preferred);
      }
    } else {
      for (const group of relevantGroups) {
        if (group) catalog.failedGroups.add(group);
      }
    }
  }

  const requests: VersionRequest[] = [];
  for (const [group, versions] of versionsByGroup) {
    for (const version of new Set(versions)) {
      const path = apiVersionPath(group, version);
      if (path) requests.push({ group, version, path });
      else catalog.failedGroups.add(group);
    }
  }

  const failures = new Set<string>();
  await runWithConcurrency(
    requests.map(requestInfo => async () => {
      try {
        const response = await cachedRequest(requestInfo.path, cluster);
        parseApiResourceList(response, catalog, requestInfo.group, requestInfo.version);
      } catch {
        failures.add(groupVersionKey(requestInfo.group, requestInfo.version));
        catalog.failedGroups.add(requestInfo.group);
      }
    })
  );

  for (const [group, versions] of versionsByGroup) {
    const complete = versions.every(version => !failures.has(groupVersionKey(group, version)));
    if (complete) catalog.completeGroups.add(group);
  }

  return catalog;
}
