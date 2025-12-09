import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import type { HeadlampEventPayload } from '../utils';
/**
 * Context Generator - Creates human-readable context descriptions for the AI
 * This replaces the complex JSON context system with simple, natural language descriptions
 *
 * Supports multiple resource sources:
 * - event.resource: Single resource
 * - event.items: Array of resources (e.g., list views)
 * - event.resources: Array of full resource objects (automatically minimized)
 * - event.resourceKind: Type of resources in event.resources
 */

/**
 * Minimizes resource data to only include essential fields
 */
function minimizeResourceData(resource: any) {
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
 * Preprocesses and minimizes an array of resources
 */
export function minimizeResourceList(resources: any[]): any[] {
  if (!Array.isArray(resources)) return [];

  return resources.map(minimizeResourceData).filter(Boolean);
}

export function generateContextDescription(
  event: HeadlampEventPayload | null,
  currentCluster?: string,
  clusterWarnings?: Record<string, { warnings: Event[]; error?: Error | null }>,
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
          const ready = resource.status.containerStatuses.filter(c => c.ready).length;
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
    const clusterCount = Object.keys(clusterWarnings).length;
    if (clusterCount === 1) {
      contextParts.push('Cluster status and warnings:');
    } else {
      contextParts.push(`Status and warnings for ${clusterCount} selected clusters:`);
    }
  }

  // Add events context (warnings/errors) - only for selected/current clusters
  for (const clusterName in clusterWarnings || {}) {
    const warnings = clusterWarnings[clusterName]?.warnings;
    const error = clusterWarnings[clusterName]?.error;

    if (warnings.length > 0) {
      contextParts.push(`⚠️ ${clusterName} warnings:`);
      warnings.forEach(warning => {
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

  // Add resources from clusterWarnings if possible (best effort, since warnings may not have full resource info)
  for (const clusterName in clusterWarnings || {}) {
    const warnings = clusterWarnings[clusterName]?.warnings;
    if (Array.isArray(warnings)) {
      for (const warning of warnings) {
        // Try to extract resource info from warning.involvedObject if present
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

export function generateResourceSummary(resource: any): string {
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
      parts.push(`Age: <1h`);
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
