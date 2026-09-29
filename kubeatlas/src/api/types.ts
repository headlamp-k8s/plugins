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

// Wire types for the KubeAtlas REST API. They mirror the field names
// the server emits (snake_case for the count fields) — the plugin is
// a client, so these must match the server, but the code is the
// plugin's own and shares nothing with the KubeAtlas frontend.

// KubeAtlasService identifies a KubeAtlas Service the plugin talks to
// through the Kubernetes API server's service proxy.
export interface KubeAtlasService {
  namespace: string;
  name: string;
  port: number;
}

// GraphNode is one node of an aggregated view. The server fills the
// same shape regardless of level; not every field is populated at
// every level (e.g. `kind`/`namespace`/`name` are only set for
// non-aggregated rows, cluster-level rows live with just `id` +
// `label` + `children_count`).
export interface GraphNode {
  id: string;
  type?: 'aggregated' | 'resource';
  label?: string;
  kind?: string;
  namespace?: string;
  name?: string;
  children_count?: number;
  children_summary?: Record<string, number>;
  edge_count_in?: number;
  edge_count_out?: number;
  // FederatedView nodes carry this; single-cluster views leave it
  // empty. The cartography stylesheet uses it to paint a per-cluster
  // border tint when present.
  clusterId?: string;
}

// GraphEdge is one aggregated edge between two nodes.
export interface GraphEdge {
  from: string;
  to: string;
  type?: string;
  count?: number;
}

// GraphView is the body of GET /api/v1/graph.
export interface GraphView {
  level: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Edge is one dependency edge between two resources. `from` and `to`
// are KubeAtlas resource ids of the form "namespace/Kind/name".
export interface Edge {
  from: string;
  to: string;
  type: string;
}

// ResourceNeighbors is the one-hop edge set around a single resource:
// incoming edges point at it, outgoing edges point away from it.
export interface ResourceNeighbors {
  incoming: Edge[];
  outgoing: Edge[];
}

// KubeAtlasResource is the subset of a graph resource the policy view
// renders (the /affected endpoint embeds full resource objects).
export interface KubeAtlasResource {
  kind: string;
  name: string;
  namespace: string;
}

// PolicyConstraint summarises one admission-policy constraint. The body
// of GET /api/v1/policy/constraints is a bare array of these.
export interface PolicyConstraint {
  name: string;
  kind: string;
  engine: string;
  violations: number;
}

// AffectedResource is one resource a constraint enforces, with its
// current violation status.
export interface AffectedResource {
  resource: KubeAtlasResource;
  violated: boolean;
  message?: string;
}

// ConstraintAffectedResponse is the body of
// GET /api/v1/policy/constraints/{name}/affected.
export interface ConstraintAffectedResponse {
  constraint: string;
  resources: AffectedResource[];
  count: number;
}

// --- OTel runtime overlay (F-204, KubeAtlas v1.5) -------------------

// OtelOverlayEdge is one observed runtime call. It is a graph.Edge with
// type "CALLS_AT_RUNTIME"; the observed service names and call count
// ride on its attributes (string-valued, as the server emits them).
export interface OtelOverlayEdge {
  from: string;
  to: string;
  type: string;
  attributes?: {
    from_service?: string;
    to_service?: string;
    call_count?: string;
  };
}

// OtelOverlayResponse is the body of GET /api/v1/otel/overlay — the
// observed runtime call edges for a namespace, layered over (never
// merged into) the declarative graph.
export interface OtelOverlayResponse {
  namespace: string;
  edges: OtelOverlayEdge[];
  count: number;
}

// OtelTraceSummary is one trace condensed to a topology summary
// (services touched, span count, wall-clock duration). KubeAtlas is not
// a trace viewer — deep inspection lives in Jaeger/Tempo.
export interface OtelTraceSummary {
  traceId: string;
  services: string[];
  spanCount: number;
  start: string;
  durationNs: number;
}

// OtelTracesResponse is the body of GET /api/v1/otel/traces.
export interface OtelTracesResponse {
  traces: OtelTraceSummary[];
  count: number;
}
