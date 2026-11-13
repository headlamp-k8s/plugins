export const INITIAL_LIMIT = 200;
export const MAX_LIMIT = 2000;
export const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface Datasource {
  namespace: string;
  service: string;
  port: string;
  clusterValue: string;
  clusterLabel: string;
  namespaceLabel: string;
  podLabel: string;
  containerLabel: string;
}
export const defaults: Datasource = {
  namespace: 'logging',
  service: 'loki-gateway',
  port: '80',
  clusterValue: '',
  clusterLabel: 'cluster',
  namespaceLabel: 'namespace',
  podLabel: 'pod',
  containerLabel: 'container',
};
export interface Search {
  namespace: string;
  pod: string;
  container: string;
  text: string;
  start: number;
  end: number;
}
export interface Entry {
  timestamp: string;
  line: string;
  labels: Record<string, string>;
}
export type Request = (path: string, signal: AbortSignal) => Promise<unknown>;

export function validateDatasource(config: Datasource) {
  for (const key of ['namespace', 'service', 'port'] as const) {
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(config[key])) {
      throw new Error('Use a Kubernetes namespace, Service name and port number or name.');
    }
  }
  for (const key of ['clusterLabel', 'namespaceLabel', 'podLabel', 'containerLabel'] as const) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config[key])) throw new Error('Invalid Loki label name.');
  }
  if (
    new Set([config.clusterLabel, config.namespaceLabel, config.podLabel, config.containerLabel])
      .size !== 4
  ) {
    throw new Error('Each label mapping must be distinct.');
  }
  if (!config.clusterValue.trim())
    throw new Error('Configure the exact stored cluster label value.');
}

export function query(config: Datasource, search: Search): string {
  validateDatasource(config);
  if (!search.namespace.trim()) throw new Error('Enter an exact namespace.');
  const pairs = [
    [config.clusterLabel, config.clusterValue],
    [config.namespaceLabel, search.namespace],
  ];
  if (search.pod) pairs.push([config.podLabel, search.pod]);
  if (search.container) pairs.push([config.containerLabel, search.container]);
  return (
    '{' +
    pairs.map(([k, v]) => k + '=' + JSON.stringify(v)).join(',') +
    '}' +
    (search.text ? ' |= ' + JSON.stringify(search.text) : '')
  );
}

export function requestPath(cluster: string, config: Datasource, search: Search, limit: number) {
  if (!cluster) throw new Error('Select a cluster.');
  if (
    ![search.start, search.end].every(Number.isSafeInteger) ||
    search.end <= search.start ||
    search.end - search.start > MAX_RANGE_MS
  )
    throw new Error('Choose a valid time range of at most seven days.');
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
    throw new Error('Invalid result limit.');
  const params = new URLSearchParams({
    query: query(config, search),
    start: String(BigInt(search.start) * BigInt(1000000)),
    end: String(BigInt(search.end) * BigInt(1000000)),
    limit: String(limit),
    direction: 'backward',
  });
  return (
    '/clusters/' +
    encodeURIComponent(cluster) +
    '/api/v1/namespaces/' +
    config.namespace +
    '/services/http:' +
    config.service +
    ':' +
    config.port +
    '/proxy/loki/api/v1/query_range?' +
    params
  );
}

export function parseResponse(value: unknown, limit: number): Entry[] {
  const doc = value as { status?: string; data?: { resultType?: string; result?: unknown } };
  if (
    !doc ||
    doc.status !== 'success' ||
    doc.data?.resultType !== 'streams' ||
    !Array.isArray(doc.data.result)
  ) {
    throw new Error('Loki returned an invalid log response.');
  }
  const entries: Entry[] = [];
  for (const raw of doc.data.result) {
    const stream = raw as { stream?: Record<string, unknown>; values?: unknown[] };
    if (
      !stream ||
      !stream.stream ||
      typeof stream.stream !== 'object' ||
      Array.isArray(stream.stream) ||
      Object.values(stream.stream).some(v => typeof v !== 'string') ||
      !Array.isArray(stream.values)
    ) {
      throw new Error('Loki returned an invalid stream.');
    }
    for (const row of stream.values) {
      if (
        !Array.isArray(row) ||
        typeof row[0] !== 'string' ||
        !/^\d{1,30}$/.test(row[0]) ||
        typeof row[1] !== 'string'
      )
        throw new Error('Loki returned an invalid log entry.');
      entries.push({
        timestamp: row[0],
        line: row[1],
        labels: stream.stream as Record<string, string>,
      });
      if (entries.length > limit) throw new Error('Loki exceeded the requested entry limit.');
    }
  }
  // Never deduplicate: repeated identical lines at the same timestamp can be real.
  return entries.sort((a, b) =>
    BigInt(a.timestamp) > BigInt(b.timestamp)
      ? -1
      : BigInt(a.timestamp) < BigInt(b.timestamp)
      ? 1
      : 0
  );
}

export async function searchLogs(
  request: Request,
  cluster: string,
  config: Datasource,
  search: Search,
  limit: number,
  signal: AbortSignal
) {
  const path = requestPath(cluster, config, search, limit);
  const response = await request(path, signal);
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  return parseResponse(response, limit);
}

export function errorMessage(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 401 || status === 403)
    return 'Access denied. Check Kubernetes Service proxy permissions and gateway authorization.';
  if (status === 429) return 'Loki is rate limiting requests. Wait before retrying.';
  return error instanceof Error
    ? error.message
    : 'Historical logs are unavailable. Check the configured gateway.';
}

export function timestampLabel(ns: string) {
  const milliseconds = BigInt(ns) / BigInt(1000000);
  if (milliseconds > BigInt('8640000000000000')) return ns + ' ns';
  return new Date(Number(milliseconds)).toISOString() + ' (' + ns + ' ns)';
}
