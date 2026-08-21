import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import type { DotnetMonitorPluginConfig } from '../configDefaults';
import { getMonitorBasePath } from '../detection/monitorDetection';

export interface DotnetMonitorProcess {
  pid: number;
  uid?: string;
  name?: string;
  commandLine?: string;
  operatingSystem?: string | null;
  processArchitecture?: string | null;
  managedEntryPointAssemblyName?: string | null;
}

export interface DotnetMonitorInfo {
  Version?: string;
  RuntimeVersion?: string;
  DiagnosticPortMode?: string;
  DiagnosticPortName?: string;
  Capabilities?: Array<{ name: string; enabled?: boolean }>;
}

export interface DotnetMonitorPodContext {
  clusterName: string;
  namespace: string;
  podName: string;
  containerName: string;
  port: number;
}

export interface DotnetMonitorRequestOptions {
  config?: DotnetMonitorPluginConfig;
  apiKey?: string;
  timeoutMs?: number;
  accept?: string;
}

export interface DotnetMonitorDumpOptions {
  pid?: number;
  uid?: string;
  name?: string;
  type: 'Mini' | 'Full' | 'WithHeap';
}

export interface DotnetMonitorTraceOptions {
  pid?: number;
  uid?: string;
  name?: string;
  durationSeconds?: number;
  profiles?: string[];
}

export interface DotnetMonitorLogsOptions {
  pid?: number;
  uid?: string;
  name?: string;
  level?: string;
  durationSeconds?: number;
}

export interface DotnetMonitorListResponse<T> {
  items: T[];
}

function joinPath(base: string, route: string): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${cleanBase}${cleanRoute}`;
}

function toQueryString(params: Record<string, string | number | undefined | null | string[]>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length > 0) {
        search.set(key, value.join(','));
      }
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function buildHeaders(options: DotnetMonitorRequestOptions = {}): HeadersInit {
  const headers: Record<string, string> = {};
  if (options.accept) {
    headers.Accept = options.accept;
  }
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }
  return headers;
}

function buildMonitorProxyPath(ctx: DotnetMonitorPodContext, route: string): string {
  // ApiProxy.request() already targets the active cluster, so we only pass the
  // Kubernetes pod-proxy path here.
  return joinPath(getMonitorBasePath(ctx.namespace, ctx.podName, ctx.port), route);
}

async function readProblemDetails(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const problem = (await response.json()) as {
        kind?: string;
        apiVersion?: string;
        title?: string;
        detail?: string;
        status?: number;
        message?: string;
        reason?: string;
        code?: number;
        errors?: Record<string, string[]>;
      };
      const parts = [
        problem.message,
        problem.title,
        problem.detail,
        problem.reason,
        problem.code ? `HTTP ${problem.code}` : undefined,
        problem.status ? `HTTP ${problem.status}` : undefined,
      ].filter(Boolean) as string[];
      if (problem.errors) {
        const errors = Object.entries(problem.errors)
          .map(([key, values]) => `${key}: ${values.join('; ')}`)
          .join(' | ');
        if (errors) {
          parts.push(errors);
        }
      }
      if (parts.length > 0) {
        return parts.join(' - ');
      }
      return parts.join(' - ') || response.statusText || `HTTP ${response.status}`;
    } catch {
      return response.statusText || `HTTP ${response.status}`;
    }
  }

  const body = await response.text().catch(() => '');
  return body.trim() || response.statusText || `HTTP ${response.status}`;
}

async function fetchMonitorResponse(
  ctx: DotnetMonitorPodContext,
  route: string,
  init: RequestInit,
  options: DotnetMonitorRequestOptions = {},
): Promise<Response> {
  if (!ctx.clusterName) {
    throw new Error('No active Headlamp cluster is selected.');
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? 120000);

  try {
    const headers = new Headers(init.headers);
    const builtHeaders = buildHeaders(options);
    for (const [key, value] of Object.entries(builtHeaders)) {
      headers.set(key, value);
    }

    return (await clusterRequest(buildMonitorProxyPath(ctx, route), {
      ...init,
      headers,
      signal: controller.signal,
      isJSON: false,
      cluster: ctx.clusterName,
    })) as Response;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function fetchJson<T>(
  ctx: DotnetMonitorPodContext,
  route: string,
  init: RequestInit = {},
  options: DotnetMonitorRequestOptions = {},
): Promise<T> {
  const response = await fetchMonitorResponse(ctx, route, init, options);
  if (!response.ok) {
    throw new Error(await readProblemDetails(response));
  }
  return (await response.json()) as T;
}

async function fetchText(
  ctx: DotnetMonitorPodContext,
  route: string,
  init: RequestInit = {},
  options: DotnetMonitorRequestOptions = {},
): Promise<string> {
  const response = await fetchMonitorResponse(ctx, route, init, options);
  if (!response.ok) {
    throw new Error(await readProblemDetails(response));
  }
  return await response.text();
}

export async function getProcesses(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions = {},
): Promise<DotnetMonitorProcess[]> {
  return await fetchJson<DotnetMonitorProcess[]>(ctx, '/processes', { method: 'GET' }, options);
}

export async function getProcessInfo(
  ctx: DotnetMonitorPodContext,
  pid: number,
  options: DotnetMonitorRequestOptions = {},
): Promise<DotnetMonitorProcess | null> {
  const response = await fetchMonitorResponse(ctx, `/processes/${pid}`, { method: 'GET' }, options);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await readProblemDetails(response));
  }
  return (await response.json()) as DotnetMonitorProcess;
}

export async function getProcessEnvironment(
  ctx: DotnetMonitorPodContext,
  pid: number,
  options: DotnetMonitorRequestOptions = {},
): Promise<Record<string, string>> {
  return await fetchJson<Record<string, string>>(ctx, `/env${toQueryString({ pid })}`, { method: 'GET' }, options);
}

export async function getInfo(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions = {},
): Promise<DotnetMonitorInfo> {
  return await fetchJson<DotnetMonitorInfo>(ctx, '/info', { method: 'GET' }, options);
}

export async function getMetrics(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions = {},
): Promise<string> {
  return await fetchText(ctx, '/metrics', { method: 'GET' }, options);
}

export async function getStacks(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions & { pid?: number; uid?: string; name?: string } = {},
): Promise<string> {
  return await fetchText(
    ctx,
    `/stacks${toQueryString({ pid: options.pid, uid: options.uid, name: options.name })}`,
    { method: 'GET', headers: { Accept: 'text/plain' } },
    options,
  );
}

export async function getExceptions(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions & { pid?: number; uid?: string; name?: string } = {},
): Promise<string> {
  return await fetchText(
    ctx,
    `/exceptions${toQueryString({ pid: options.pid, uid: options.uid, name: options.name })}`,
    { method: 'GET', headers: { Accept: 'text/plain' } },
    options,
  );
}

export async function getLogs(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions & DotnetMonitorLogsOptions = {},
): Promise<string> {
  return await fetchText(
    ctx,
    `/logs${toQueryString({
      pid: options.pid,
      uid: options.uid,
      name: options.name,
      level: options.level,
      durationSeconds: options.durationSeconds,
    })}`,
    { method: 'GET', headers: { Accept: 'application/x-ndjson, text/plain' } },
    options,
  );
}

export async function startDump(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions & DotnetMonitorDumpOptions,
): Promise<Response> {
  return await fetchMonitorResponse(
    ctx,
    `/dump${toQueryString({ pid: options.pid, uid: options.uid, name: options.name, type: options.type })}`,
    { method: 'GET' },
    options,
  );
}

export async function startGcdump(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions & { pid?: number; uid?: string; name?: string },
): Promise<Response> {
  return await fetchMonitorResponse(
    ctx,
    `/gcdump${toQueryString({ pid: options.pid, uid: options.uid, name: options.name })}`,
    { method: 'GET' },
    options,
  );
}

export async function startTrace(
  ctx: DotnetMonitorPodContext,
  options: DotnetMonitorRequestOptions & DotnetMonitorTraceOptions,
): Promise<Response> {
  return await fetchMonitorResponse(
    ctx,
    `/trace${toQueryString({
      pid: options.pid,
      uid: options.uid,
      name: options.name,
      profile: options.profiles,
      durationSeconds: options.durationSeconds,
    })}`,
    { method: 'GET' },
    options,
  );
}

export async function readResponseTextOrBlob(response: Response): Promise<string | Blob> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.startsWith('text/') || contentType.includes('json')) {
    return await response.text();
  }
  return await response.blob();
}

export async function assertOkResponse(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  throw new Error(await readProblemDetails(response));
}

export function defaultFileName(podName: string, containerName: string, pid: number, suffix: string): string {
  return `${sanitizeFileName(podName)}-${sanitizeFileName(containerName)}-${pid}-${suffix}`;
}

export function gcdumpFileName(podName: string, containerName: string, pid: number): string {
  return `${sanitizeFileName(podName)}-${sanitizeFileName(containerName)}-${pid}.gcdump`;
}

export function traceFileName(podName: string, containerName: string, pid: number): string {
  return `${sanitizeFileName(podName)}-${sanitizeFileName(containerName)}-${pid}.nettrace`;
}

export function dumpFileName(
  podName: string,
  containerName: string,
  pid: number,
  type: 'Mini' | 'Full' | 'WithHeap',
): string {
  const suffix = type === 'Full' ? 'full' : type === 'WithHeap' ? 'heap' : 'mini';
  return `${sanitizeFileName(podName)}-${sanitizeFileName(containerName)}-${pid}-${suffix}.dmp`;
}

export function sanitizeFileName(input: string): string {
  return input
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export async function downloadResponseAsFile(response: Response, fileName: string): Promise<void> {
  await assertOkResponse(response);

  const blob = await response.blob();
  const anchor = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
