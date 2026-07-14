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

/** Loose Kubernetes resource shape shared by context and approval workflows. */
export interface KubernetesContextResource {
  /** Kubernetes resource kind, such as Pod or Deployment. */
  kind?: string;
  /** Identifying and lifecycle metadata. */
  metadata?: {
    /** Resource name within its namespace. */
    name?: string;
    /** Namespace containing the resource, when namespaced. */
    namespace?: string;
    /** RFC 3339 timestamp indicating when the resource was created. */
    creationTimestamp?: string;
  };
  /** Runtime status fields used by context summaries. */
  status?: {
    /** High-level lifecycle phase reported by the resource. */
    phase?: string;
    /** Number of replicas currently reporting ready. */
    readyReplicas?: number;
    /** Total replica count reported in resource status. */
    replicas?: number;
    /** Readiness state for containers reported by the resource. */
    containerStatuses?: Array<{
      /** Whether the container is currently ready. */
      ready?: boolean;
    }>;
    /** Additional resource-specific status fields. */
    [key: string]: unknown;
  };
  /** Desired-state fields used by context summaries. */
  spec?: {
    /** Container definitions included in the resource specification. */
    containers?: unknown[];
    /** Additional resource-specific desired-state fields. */
    [key: string]: unknown;
  };
  /** Raw representation exposed by Headlamp model wrappers. */
  jsonData?: KubernetesContextResource;
  /** Cluster that supplied the resource. */
  _clusterName?: string;
}

/** Kubernetes context exposed to assistant and approval workflows. */
export interface KubernetesAssistantContext {
  /** Clusters currently selected for tool execution. */
  selectedClusters?: string[];
  /** Active Kubernetes namespace, when the host tracks one. */
  namespace?: string;
  /** Kubernetes resource currently in focus, when one is available. */
  currentResource?: KubernetesContextResource;
}
