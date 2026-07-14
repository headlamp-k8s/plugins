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
    name?: string;
    namespace?: string;
    creationTimestamp?: string;
  };
  /** Runtime status fields used by context summaries. */
  status?: {
    phase?: string;
    readyReplicas?: number;
    replicas?: number;
    containerStatuses?: Array<{ ready?: boolean }>;
    [key: string]: unknown;
  };
  /** Desired-state fields used by context summaries. */
  spec?: {
    containers?: unknown[];
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
