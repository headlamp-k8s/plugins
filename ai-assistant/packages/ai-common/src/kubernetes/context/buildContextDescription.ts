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

import type { KubernetesContextResource } from '../types';

/**
 * Context Generator - Creates human-readable context descriptions for the AI
 *
 * Supports multiple resource sources:
 * - event.resource: Single resource
 * - event.items: Array of resources (e.g., list views)
 * - event.resources: Array of full resource objects (automatically minimized)
 * - event.resourceKind: Type of resources in event.resources
 */

/** Minimal K8s event warning structure used for context generation. */
export interface ClusterWarningEvent {
  /** Warning message text emitted by Kubernetes. */
  message?: string;
  /** Resource referenced by the warning event, when available. */
  involvedObject?: {
    /** Kind of the resource involved in the warning. */
    kind?: string;
    /** Name of the resource involved in the warning. */
    name?: string;
    /** Namespace of the involved resource, if one exists. */
    namespace?: string;
  };
}

/** Cluster warnings map: cluster name → warnings + optional error. */
export type ClusterWarnings = Record<
  string,
  {
    /** Warning events reported for the cluster. */
    warnings: ClusterWarningEvent[];
    /** Error encountered while loading warnings, when applicable. */
    error?: Error | null;
  }
>;

/** Resource fields retained when minimizing context sent to the model. */
type MinimizedResource = Pick<
  KubernetesContextResource,
  'kind' | 'metadata' | 'status' | '_clusterName'
>;

/** Event payload structure for context generation (platform-agnostic). */
export interface ContextEventPayload {
  /** Event type or view identifier. */
  type?: string;
  /** Human-readable title for the current view. */
  title?: string;
  /** Resource list items shown in the current view. */
  items?: KubernetesContextResource[];
  /** Primary resource currently in focus. */
  resource?: KubernetesContextResource;
  /** Additional resources available in the current context. */
  resources?: KubernetesContextResource[];
  /** Resource kind shared by the resources collection. */
  resourceKind?: string;
}

/**
 * Minimizes resource data to only include essential fields.
 *
 * @param resource - Kubernetes resource or Headlamp wrapper to minimize.
 * @returns Essential resource fields, or `null` when no resource is supplied.
 */
function minimizeResourceData(resource: KubernetesContextResource): MinimizedResource | null {
  if (!resource) return null;

  return {
    kind: resource.kind || resource.jsonData?.kind,
    metadata: {
      name: resource.metadata?.name || resource.jsonData?.metadata?.name,
      namespace: resource.metadata?.namespace || resource.jsonData?.metadata?.namespace,
    },
    status: resource.status || resource.jsonData?.status,
    _clusterName: resource._clusterName,
  };
}

/**
 * Preprocesses and minimizes an array of resources.
 *
 * @param resources - Value to validate as a Kubernetes resource array.
 * @returns Minimized entries for object resources, or an empty array for other values.
 */
export function minimizeResourceList(resources: unknown): MinimizedResource[] {
  if (!Array.isArray(resources)) return [];

  return resources
    .filter(
      (resource): resource is KubernetesContextResource =>
        typeof resource === 'object' && resource !== null
    )
    .map(minimizeResourceData)
    .filter((resource): resource is MinimizedResource => resource !== null);
}

/**
 * Builds a human-readable context summary from the current view and cluster state.
 *
 * @param event - Current view and resource payload, or `null` when no view is available.
 * @param currentCluster - Cluster currently displayed by the host.
 * @param clusterWarnings - Warning and loading-error details keyed by cluster.
 * @param selectedClusters - Clusters explicitly selected for the current request.
 * @returns A multiline description the assistant can use as prompt context.
 */
export function generateContextDescription(
  event: ContextEventPayload | null,
  currentCluster?: string,
  clusterWarnings?: ClusterWarnings,
  selectedClusters?: string[]
): string {
  const contextParts: string[] = [];
  // Add cluster context - be clear about what clusters are in scope
  if (selectedClusters && selectedClusters.length > 0) {
    if (selectedClusters.length === 1) {
      contextParts.push(`You are viewing cluster: ${selectedClusters[0]}`);
    } else {
      contextParts.push(`You are viewing selected clusters: ${selectedClusters.join(', ')}`);
    }
  } else if (currentCluster) {
    contextParts.push(`You are viewing cluster: ${currentCluster}`);
  }

  // Add current view context
  if (event?.title || event?.type) {
    const viewName = event.title || event.type;
    contextParts.push(`Current view: ${viewName}`);
  }

  // Add resource details context
  if (event?.resource) {
    const resource = event.resource;
    if (resource.kind && resource.metadata?.name) {
      contextParts.push(
        `Viewing ${resource.kind}: ${resource.metadata.name}${
          resource.metadata.namespace ? ` in namespace ${resource.metadata.namespace}` : ''
        }`
      );

      // Add resource status if available
      if (resource.status?.phase) {
        contextParts.push(`Resource status: ${resource.status.phase}`);
      }

      // Add important resource info
      if (resource.kind === 'Pod') {
        const containers = resource.spec?.containers?.length || 0;
        contextParts.push(`Pod has ${containers} container(s)`);

        if (resource.status?.containerStatuses) {
          const ready = resource.status.containerStatuses.filter(
            container => container.ready
          ).length;
          const total = resource.status.containerStatuses.length;
          contextParts.push(`${ready}/${total} containers ready`);
        }
      }
    }
  }

  // Add resource list context
  if (event?.items && Array.isArray(event.items)) {
    const itemCount = event.items.length;
    if (itemCount > 0) {
      const resourceType = event.items[0]?.kind || 'resources';
      contextParts.push(
        `Showing ${itemCount} ${resourceType.toLowerCase()}${itemCount !== 1 ? 's' : ''}`
      );

      // Analyze list for common issues
      if (resourceType === 'Pod') {
        const unhealthyPods = event.items.filter(pod => {
          const phase = pod.status?.phase;
          return phase !== 'Running' && phase !== 'Succeeded';
        });

        if (unhealthyPods.length > 0) {
          contextParts.push(`⚠️ ${unhealthyPods.length} pod(s) may need attention`);
        }
      }
    }
  }

  // Add event.resources context (minimized data)
  if (event?.resources && Array.isArray(event.resources)) {
    const resourceCount = event.resources.length;
    if (resourceCount > 0) {
      const resourceType =
        event.resourceKind ||
        event.resources[0]?.kind ||
        event.resources[0]?.jsonData?.kind ||
        'resources';
      contextParts.push(
        `Showing ${resourceCount} ${resourceType.toLowerCase()}${resourceCount !== 1 ? 's' : ''}`
      );

      // Analyze resources for common issues
      if (resourceType === 'Pod') {
        const unhealthyPods = event.resources.filter(resource => {
          const phase = resource.status?.phase || resource.jsonData?.status?.phase;
          return phase !== 'Running' && phase !== 'Succeeded';
        });

        if (unhealthyPods.length > 0) {
          contextParts.push(`⚠️ ${unhealthyPods.length} pod(s) may need attention`);
        }
      } else if (resourceType === 'Deployment') {
        const unhealthyDeployments = event.resources.filter(resource => {
          const status = resource.status || resource.jsonData?.status;
          const ready = status?.readyReplicas || 0;
          const desired = status?.replicas || 0;
          return ready < desired;
        });

        if (unhealthyDeployments.length > 0) {
          contextParts.push(`⚠️ ${unhealthyDeployments.length} deployment(s) may need attention`);
        }
      }
    }
  }

  if (Object.keys(clusterWarnings || {}).length > 0) {
    const clusterCount = Object.keys(clusterWarnings!).length;
    if (clusterCount === 1) {
      contextParts.push('Cluster status and warnings:');
    } else {
      contextParts.push(`Status and warnings for ${clusterCount} selected clusters:`);
    }
  }

  // Add events context (warnings/errors) - only for selected/current clusters
  for (const clusterName in clusterWarnings || {}) {
    const warnings = clusterWarnings![clusterName]?.warnings;
    const error = clusterWarnings![clusterName]?.error;

    if (warnings.length > 0) {
      contextParts.push(`⚠️ ${clusterName} warnings:`);
      warnings.forEach((warning: ClusterWarningEvent) => {
        contextParts.push(`- ${warning.message || 'Unknown warning'}`);
      });
    } else if (!!error) {
      contextParts.push(`❗${clusterName} errors: ${error.message}`);
    } else {
      contextParts.push(`${clusterName} is healthy!`);
    }
  }

  // --- Structured resource list for AI link accuracy ---
  const structuredResources: string[] = [];

  // Add main resource if present
  if (event?.resource && event.resource.kind && event.resource.metadata?.name) {
    structuredResources.push(
      `- kind: ${event.resource.kind}, name: ${event.resource.metadata.name}, namespace: ${
        event.resource.metadata.namespace || 'default'
      }, cluster: ${currentCluster || '[unknown]'}`
    );
  }

  // Add items if present (e.g., list views)
  if (event?.items && Array.isArray(event.items)) {
    for (const item of event.items) {
      if (item.kind && item.metadata?.name) {
        structuredResources.push(
          `- kind: ${item.kind}, name: ${item.metadata.name}, namespace: ${
            item.metadata.namespace || 'default'
          }, cluster: ${currentCluster || '[unknown]'}`
        );
      }
    }
  }

  // Add minimized resources from event.resources
  if (event?.resources && Array.isArray(event.resources)) {
    for (const resource of event.resources) {
      const minimized = minimizeResourceData(resource);
      if (minimized && minimized.kind && minimized.metadata?.name) {
        const clusterName = minimized._clusterName || currentCluster || '[unknown]';
        structuredResources.push(
          `- kind: ${minimized.kind}, name: ${minimized.metadata.name}, namespace: ${
            minimized.metadata.namespace || 'default'
          }, cluster: ${clusterName}`
        );
      }
    }
  }

  // Add resources from clusterWarnings if possible
  for (const clusterName in clusterWarnings || {}) {
    const warnings = clusterWarnings![clusterName]?.warnings;
    if (Array.isArray(warnings)) {
      for (const warning of warnings) {
        const obj = warning.involvedObject;
        if (obj && obj.kind && obj.name) {
          structuredResources.push(
            `- kind: ${obj.kind}, name: ${obj.name}, namespace: ${
              obj.namespace || 'default'
            }, cluster: ${clusterName}`
          );
        }
      }
    }
  }

  if (structuredResources.length > 0) {
    contextParts.push('\nRESOURCES IN CONTEXT (use the resource name as the markdown link text):');
    contextParts.push(...structuredResources);
  }

  return contextParts.join('\n');
}

/**
 * Creates a short summary string for a Kubernetes resource.
 *
 * @param resource - Kubernetes resource to summarize, or `null` for no resource.
 * @returns A comma-separated summary of the resource state.
 */
export function generateResourceSummary(resource: KubernetesContextResource | null): string {
  if (!resource) return '';

  const parts: string[] = [];

  // Basic info
  if (resource.kind && resource.metadata?.name) {
    parts.push(`${resource.kind}: ${resource.metadata.name}`);
  }

  // Namespace
  if (resource.metadata?.namespace) {
    parts.push(`Namespace: ${resource.metadata.namespace}`);
  }

  // Age
  if (resource.metadata?.creationTimestamp) {
    const created = new Date(resource.metadata.creationTimestamp);
    const now = new Date();
    const ageMs = now.getTime() - created.getTime();
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    const ageDays = Math.floor(ageHours / 24);

    if (ageDays > 0) {
      parts.push(`Age: ${ageDays}d`);
    } else if (ageHours > 0) {
      parts.push(`Age: ${ageHours}h`);
    } else {
      parts.push('Age: <1h');
    }
  }

  // Resource-specific details
  switch (resource.kind) {
    case 'Pod':
      if (resource.status?.phase) {
        parts.push(`Status: ${resource.status.phase}`);
      }
      break;
    case 'Deployment':
      if (resource.status?.replicas !== undefined) {
        const ready = resource.status.readyReplicas || 0;
        const desired = resource.status.replicas || 0;
        parts.push(`Replicas: ${ready}/${desired}`);
      }
      break;
    case 'Service':
      if (resource.spec?.type) {
        parts.push(`Type: ${resource.spec.type}`);
      }
      break;
  }

  return parts.join(', ');
}
