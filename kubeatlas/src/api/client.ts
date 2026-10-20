/*
 * Copyright 2026 The KubeAtlas Authors
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
import {
  ConstraintAffectedResponse,
  GraphView,
  KubeAtlasService,
  OtelOverlayResponse,
  OtelTraceSummary,
  PolicyConstraint,
  ResourceNeighbors,
} from './types';

// serviceProxyPath builds the path to a KubeAtlas endpoint through
// the Kubernetes API server's service proxy
// (/api/v1/namespaces/{ns}/services/{name}:{port}/proxy/...).
//
// The plugin always goes through this proxy and never connects to a
// Service ClusterIP directly: Headlamp may be the desktop app,
// running outside the cluster, where a ClusterIP is unreachable. The
// API server is reachable either way.
export function serviceProxyPath(svc: KubeAtlasService, endpoint: string): string {
  const sub = endpoint.replace(/^\/+/, '');
  return (
    `/api/v1/namespaces/${encodeURIComponent(svc.namespace)}` +
    `/services/${encodeURIComponent(svc.name)}:${svc.port}/proxy/${sub}`
  );
}

// fetchClusterGraph retrieves the cluster-level dependency graph from
// a KubeAtlas Service. A non-2xx response (or an unreachable API
// server) rejects the promise; callers surface the message.
//
// `?level=cluster` is part of the path so the Kubernetes service
// proxy forwards it verbatim to KubeAtlas — request()'s queryParams
// argument only accepts known Kubernetes query keys.
export async function fetchClusterGraph(svc: KubeAtlasService): Promise<GraphView> {
  const path = `${serviceProxyPath(svc, 'api/v1/graph')}?level=cluster`;
  return ApiProxy.request(path, { isJSON: true });
}

// fetchNamespaceGraph retrieves a single namespace's view from a
// KubeAtlas Service. The same proxy convention as fetchClusterGraph;
// the level + namespace ride on the path so the Kubernetes service
// proxy forwards them verbatim.
export async function fetchNamespaceGraph(
  svc: KubeAtlasService,
  namespace: string
): Promise<GraphView> {
  const qs = `level=namespace&namespace=${encodeURIComponent(namespace)}`;
  const path = `${serviceProxyPath(svc, 'api/v1/graph')}?${qs}`;
  return ApiProxy.request(path, { isJSON: true });
}

// resourcePath builds the KubeAtlas resource-detail endpoint path for
// one resource. A cluster-scoped resource has no namespace; KubeAtlas
// expects the "_" sentinel there because an empty path segment is
// unaddressable.
export function resourcePath(namespace: string, kind: string, name: string): string {
  const ns = namespace || '_';
  return (
    `api/v1/resources/${encodeURIComponent(ns)}` +
    `/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`
  );
}

// fetchResourceNeighbors retrieves the one-hop incoming and outgoing
// edges of a single resource from a KubeAtlas Service.
export async function fetchResourceNeighbors(
  svc: KubeAtlasService,
  namespace: string,
  kind: string,
  name: string
): Promise<ResourceNeighbors> {
  const path = serviceProxyPath(svc, resourcePath(namespace, kind, name));
  const detail = await ApiProxy.request(path, { isJSON: true });
  return {
    incoming: Array.isArray(detail?.incoming) ? detail.incoming : [],
    outgoing: Array.isArray(detail?.outgoing) ? detail.outgoing : [],
  };
}

// fetchPolicyConstraints retrieves every Gatekeeper Constraint and
// Kyverno policy (with live violation counts) from a KubeAtlas Service.
// The response is a bare array. An optional engine filters the list.
export async function fetchPolicyConstraints(
  svc: KubeAtlasService,
  engine?: string
): Promise<PolicyConstraint[]> {
  const ep = engine
    ? `api/v1/policy/constraints?engine=${encodeURIComponent(engine)}`
    : 'api/v1/policy/constraints';
  const result = await ApiProxy.request(serviceProxyPath(svc, ep), { isJSON: true });
  return Array.isArray(result) ? result : [];
}

// fetchConstraintAffected retrieves the resources a named constraint
// enforces, each flagged with its violation status.
export async function fetchConstraintAffected(
  svc: KubeAtlasService,
  name: string
): Promise<ConstraintAffectedResponse> {
  const ep = `api/v1/policy/constraints/${encodeURIComponent(name)}/affected`;
  return ApiProxy.request(serviceProxyPath(svc, ep), { isJSON: true });
}

// --- OTel runtime overlay (F-204, KubeAtlas v1.5) -------------------

// otelOverlayPath builds the overlay endpoint path with its query
// string. Pure and exported so it can be unit-tested without a live
// server (the fetch wrappers below just proxy it).
export function otelOverlayPath(namespace: string, compare = false): string {
  const parts: string[] = [];
  if (namespace) parts.push(`namespace=${encodeURIComponent(namespace)}`);
  if (compare) parts.push('compare=true');
  return `api/v1/otel/overlay${parts.length ? `?${parts.join('&')}` : ''}`;
}

// otelTracesPath builds the traces endpoint path. An empty service
// matches every service.
export function otelTracesPath(service?: string): string {
  const qs = service ? `?service=${encodeURIComponent(service)}` : '';
  return `api/v1/otel/traces${qs}`;
}

// fetchOtelOverlay retrieves the observed CALLS_AT_RUNTIME edges for a
// namespace. The overlay is Tier 2 + otel.enabled only; a server with
// it off answers 503, which rejects the promise — callers surface it as
// "overlay not available".
export async function fetchOtelOverlay(
  svc: KubeAtlasService,
  namespace: string
): Promise<OtelOverlayResponse> {
  const path = serviceProxyPath(svc, otelOverlayPath(namespace));
  const r = await ApiProxy.request(path, { isJSON: true });
  return {
    namespace: typeof r?.namespace === 'string' ? r.namespace : namespace,
    edges: Array.isArray(r?.edges) ? r.edges : [],
    count: typeof r?.count === 'number' ? r.count : 0,
  };
}

// fetchOtelTraces retrieves recent trace summaries, optionally filtered
// to one service.
export async function fetchOtelTraces(
  svc: KubeAtlasService,
  service?: string
): Promise<OtelTraceSummary[]> {
  const path = serviceProxyPath(svc, otelTracesPath(service));
  const r = await ApiProxy.request(path, { isJSON: true });
  return Array.isArray(r?.traces) ? r.traces : [];
}
