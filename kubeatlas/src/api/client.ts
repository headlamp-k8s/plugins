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
import { GraphView, KubeAtlasService, ResourceNeighbors } from './types';

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
  namespace: string,
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
