import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';

/**
 * Context Generator - Creates human-readable context descriptions for the AI
 * This replaces the complex JSON context system with simple, natural language descriptions
 */

interface HeadlampEvent {
  type?: string;
  title?: string;
  resource?: any;
  items?: any[];
  errors?: any[];
  objectEvent?: {
    events?: any[];
  };
}

export function generateContextDescription(
  event: HeadlampEvent,
  currentCluster?: string,
  clusterWarnings?: Record<string, { warnings: Event[]; error?: Error | null }>
): string {
  const contextParts: string[] = [];

  // Add cluster context
  if (currentCluster) {
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

  if (Object.keys(clusterWarnings).length > 0) {
    contextParts.push('Cluster configured, with respective warnings and errors:');
  }

  // Add events context (warnings/errors)
  for (const clusterName in clusterWarnings) {
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
