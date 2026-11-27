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
 * Read-only access to the releases Helm keeps in its storage Secrets
 * (`sh.helm.release.v1.<name>.v<revision>`, type `helm.sh/release.v1`).
 *
 * The transport is a port: the host gives the one bound to the user session and to the selected
 * cluster. Nothing here writes to the cluster.
 */
import { decodeReleasePayload } from './decode';
import {
  HelmReleaseSummary,
  HelmRevision,
  isPlainObject,
  parseRevision,
  ReleaseIdentity,
  toSummary,
} from './release';

export const HELM_SECRET_TYPE = 'helm.sh/release.v1';
const HELM_SECRET_PREFIX = 'sh.helm.release.v1.';

/** Every record written by Helm, whatever its revision. */
const OWNED_BY_HELM = 'owner=helm';
/**
 * Helm marks the revisions replaced by a newer one as `superseded`. Leaving them out gives the
 * current revision of each release without downloading its whole history.
 */
const CURRENT_REVISIONS = `${OWNED_BY_HELM},status!=superseded`;

/** A release record weighs up to 1 MiB: small pages keep each response bounded. */
const LIST_PAGE_SIZE = 10;
const HISTORY_PAGE_SIZE = 5;
const MAX_PAGES = 500;
const NAMESPACE_CONCURRENCY = 4;

const NAMESPACE_PATTERN = /^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?$/;
const RELEASE_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const MAX_RELEASE_NAME_LENGTH = 63;

export interface ListSecretsRequest {
  cluster: string;
  /** Lists across the whole cluster when undefined. */
  namespace?: string;
  labelSelector: string;
  limit: number;
  continueToken?: string;
}

export interface HelmTransport {
  /** Resolves to a Kubernetes SecretList; rejects with an error carrying the HTTP `status`. */
  listSecrets(request: ListSecretsRequest): Promise<unknown>;
}

export type AccessErrorKind =
  | 'forbidden'
  | 'unauthorized'
  | 'not-found'
  | 'timeout'
  | 'unavailable'
  | 'unknown';

const ACCESS_MESSAGES: Record<AccessErrorKind, string> = {
  forbidden: 'Access denied.',
  unauthorized: 'The session is not authorised. Sign in again.',
  'not-found': 'Not found.',
  timeout: 'The cluster did not answer in time.',
  unavailable: 'The cluster API is unavailable.',
  unknown: 'The request failed.',
};

/**
 * Failure of a read, reduced to its kind.
 *
 * The body of an API error can hold sensitive details: it is never kept nor displayed.
 */
export class HelmAccessError extends Error {
  readonly kind: AccessErrorKind;

  constructor(kind: AccessErrorKind) {
    super(ACCESS_MESSAGES[kind]);
    this.name = 'HelmAccessError';
    this.kind = kind;
  }
}

/** Classifies a transport failure from its HTTP status only. */
export function accessErrorKind(error: unknown): AccessErrorKind {
  if (error instanceof HelmAccessError) return error.kind;
  const status = isPlainObject(error) ? error.status : undefined;
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not-found';
    case 408:
    case 504:
      return 'timeout';
    case 502:
    case 503:
      return 'unavailable';
    default:
      return 'unknown';
  }
}

export function describeAccessError(kind: AccessErrorKind): string {
  return ACCESS_MESSAGES[kind];
}

export function isValidNamespace(namespace: unknown): namespace is string {
  return typeof namespace === 'string' && NAMESPACE_PATTERN.test(namespace);
}

export function isValidReleaseName(name: unknown): name is string {
  return (
    typeof name === 'string' &&
    name.length <= MAX_RELEASE_NAME_LENGTH &&
    RELEASE_NAME_PATTERN.test(name)
  );
}

interface SecretScope {
  cluster: string;
  namespace?: string;
  labelSelector: string;
  pageSize: number;
}

interface RevisionBatch<T> {
  items: T[];
  /** Records that look like Helm releases but could not be decoded. */
  unreadable: number;
}

function secretIdentity(secret: unknown): ReleaseIdentity | undefined {
  if (!isPlainObject(secret) || secret.type !== HELM_SECRET_TYPE) return undefined;
  const metadata = isPlainObject(secret.metadata) ? secret.metadata : {};
  if (typeof metadata.name !== 'string' || !metadata.name.startsWith(HELM_SECRET_PREFIX)) {
    return undefined;
  }
  if (!isValidNamespace(metadata.namespace)) return undefined;

  const labels = isPlainObject(metadata.labels) ? metadata.labels : {};
  const revision = typeof labels.version === 'string' ? Number(labels.version) : NaN;
  return {
    namespace: metadata.namespace,
    name: isValidReleaseName(labels.name) ? labels.name : undefined,
    revision: Number.isInteger(revision) && revision > 0 ? revision : undefined,
    status: typeof labels.status === 'string' ? labels.status : undefined,
  };
}

async function decodeSecret(secret: unknown): Promise<HelmRevision | 'unreadable' | undefined> {
  const identity = secretIdentity(secret);
  if (!identity) return undefined;
  try {
    const data = isPlainObject(secret) && isPlainObject(secret.data) ? secret.data : {};
    return parseRevision(await decodeReleasePayload(data.release), identity) ?? 'unreadable';
  } catch {
    return 'unreadable';
  }
}

/**
 * Reads every Helm record of a scope, page after page, and keeps a projection of each revision
 * so that the decoded payloads can be released as soon as a page is processed.
 */
async function readRevisions<T>(
  transport: HelmTransport,
  scope: SecretScope,
  project: (revision: HelmRevision) => T
): Promise<RevisionBatch<T>> {
  const batch: RevisionBatch<T> = { items: [], unreadable: 0 };
  let continueToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    let list: unknown;
    try {
      list = await transport.listSecrets({
        cluster: scope.cluster,
        namespace: scope.namespace,
        labelSelector: scope.labelSelector,
        limit: scope.pageSize,
        continueToken,
      });
    } catch (error) {
      throw new HelmAccessError(accessErrorKind(error));
    }

    const items = isPlainObject(list) && Array.isArray(list.items) ? list.items : [];
    for (const decoded of await Promise.all(items.map(decodeSecret))) {
      if (decoded === 'unreadable') batch.unreadable += 1;
      else if (decoded) batch.items.push(project(decoded));
    }

    const metadata = isPlainObject(list) && isPlainObject(list.metadata) ? list.metadata : {};
    continueToken =
      typeof metadata.continue === 'string' && metadata.continue !== ''
        ? metadata.continue
        : undefined;
    if (!continueToken) break;
  }

  return batch;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

/** Keeps the highest revision of each release, sorted by namespace then name. */
function latestRevisions(summaries: HelmReleaseSummary[]): HelmReleaseSummary[] {
  const latest = new Map<string, HelmReleaseSummary>();
  for (const summary of summaries) {
    const key = `${summary.namespace}/${summary.name}`;
    const known = latest.get(key);
    if (!known || summary.revision > known.revision) latest.set(key, summary);
  }
  return [...latest.values()].sort(
    (left, right) =>
      left.namespace.localeCompare(right.namespace) || left.name.localeCompare(right.name)
  );
}

export interface ReleaseListResult {
  releases: HelmReleaseSummary[];
  /** The user asked for every namespace and is not allowed to list Secrets cluster-wide. */
  clusterWideDenied: boolean;
  /** Requested namespaces in which the user cannot list Secrets. */
  deniedNamespaces: string[];
  /** Requested namespaces whose read failed for another reason. */
  failedNamespaces: string[];
  /** Helm records that could not be decoded, hence not listed. */
  unreadable: number;
}

/**
 * Lists the current revision of the releases, as `helm ls -A` does.
 *
 * @param namespaces - Namespaces to read; empty to read the whole cluster in one request.
 * @throws HelmAccessError when nothing could be read for a reason other than a missing permission.
 */
export async function listReleases(
  transport: HelmTransport,
  cluster: string,
  namespaces: string[]
): Promise<ReleaseListResult> {
  const result: ReleaseListResult = {
    releases: [],
    clusterWideDenied: false,
    deniedNamespaces: [],
    failedNamespaces: [],
    unreadable: 0,
  };

  if (namespaces.length === 0) {
    try {
      const batch = await readRevisions(
        transport,
        { cluster, labelSelector: CURRENT_REVISIONS, pageSize: LIST_PAGE_SIZE },
        toSummary
      );
      result.releases = latestRevisions(batch.items);
      result.unreadable = batch.unreadable;
    } catch (error) {
      if (accessErrorKind(error) !== 'forbidden') throw error;
      result.clusterWideDenied = true;
    }
    return result;
  }

  const requested = [...new Set(namespaces)].filter(isValidNamespace).sort();
  const summaries: HelmReleaseSummary[] = [];
  const outcomes = await mapWithConcurrency(requested, NAMESPACE_CONCURRENCY, async namespace => {
    try {
      return await readRevisions(
        transport,
        { cluster, namespace, labelSelector: CURRENT_REVISIONS, pageSize: LIST_PAGE_SIZE },
        toSummary
      );
    } catch (error) {
      return accessErrorKind(error);
    }
  });

  outcomes.forEach((outcome, index) => {
    if (typeof outcome !== 'string') {
      summaries.push(...outcome.items);
      result.unreadable += outcome.unreadable;
    } else if (outcome === 'unauthorized') {
      // The session itself is refused: no namespace can answer.
      throw new HelmAccessError(outcome);
    } else if (outcome === 'forbidden') {
      result.deniedNamespaces.push(requested[index]);
    } else {
      result.failedNamespaces.push(requested[index]);
    }
  });

  result.releases = latestRevisions(summaries);
  return result;
}

export interface ReleaseHistoryResult {
  /** Revisions of the release, the most recent first. */
  revisions: HelmRevision[];
  unreadable: number;
}

/**
 * Reads every revision Helm kept for a release, as `helm history` does.
 *
 * @throws HelmAccessError when the release cannot be read or the reference is invalid.
 */
export async function listRevisions(
  transport: HelmTransport,
  cluster: string,
  namespace: string,
  name: string
): Promise<ReleaseHistoryResult> {
  // Both values end up in the request: an invalid reference cannot designate a release.
  if (!isValidNamespace(namespace) || !isValidReleaseName(name)) {
    throw new HelmAccessError('not-found');
  }

  const batch = await readRevisions(
    transport,
    {
      cluster,
      namespace,
      labelSelector: `${OWNED_BY_HELM},name=${name}`,
      pageSize: HISTORY_PAGE_SIZE,
    },
    revision => revision
  );

  return {
    revisions: batch.items
      .filter(revision => revision.name === name && revision.namespace === namespace)
      .sort((left, right) => right.revision - left.revision),
    unreadable: batch.unreadable,
  };
}
