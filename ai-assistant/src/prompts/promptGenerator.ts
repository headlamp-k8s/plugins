import type { PromptSuggestion } from '@headlamp-k8s/ai-ui/components/assistant/PromptSuggestions';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalState } from '../pluginState';

/** Event shape used for prompt generation. */
export interface PromptEvent {
  resource?: { kind?: string; [key: string]: unknown };
  resources?: Array<{ kind?: string; [key: string]: unknown }>;
  objectEvent?: { events?: unknown[] };
  project?: { id?: string; [key: string]: unknown };
  projects?: unknown[];
  projectTab?: string;
  pathname?: string;
}

/**
 * Generates context-aware prompt suggestions based on the current Kubernetes
 * resource or event being viewed. Returns up to 3 prompts: context-specific
 * prompts first (resource type, list, events, route fallback), then generic base prompts.
 *
 * @param event - The current event/resource context, or undefined/null.
 * @returns An array of at most 3 prompt strings.
 */
export function generatePrompts(event: PromptEvent | null | undefined): string[] {
  // Base prompts that work in any context
  const basePrompts = [
    'What pods need my attention?',
    'Show me a simple pod YAML example',
    'How do I create a LoadBalancer service?',
    'What are the most common Kubernetes troubleshooting steps?',
  ];

  // Context-specific prompts
  const contextPrompts: string[] = [];

  if (event?.project) {
    contextPrompts.push('Is everything healthy in this project?');
    contextPrompts.push('Summarize the resources in this project');

    if (event.projectTab) {
      contextPrompts.push(`What should I check in the ${event.projectTab} tab?`);
    }
  }

  if (event?.projects && Array.isArray(event.projects)) {
    contextPrompts.push('Which projects need my attention?');
    contextPrompts.push('Summarize the status of these projects');
  }

  if (event?.resource) {
    const resource = event.resource;
    contextPrompts.push('Anything to notice about this resource?');
    contextPrompts.push('What could be improved here?');

    if (resource.kind === 'Pod') {
      contextPrompts.push('Why might this pod be failing?');
      contextPrompts.push('How can I debug this pod?');
    } else if (resource.kind === 'Deployment') {
      contextPrompts.push('How can I scale this deployment?');
      contextPrompts.push('Is this deployment healthy?');
    } else if (resource.kind === 'StatefulSet') {
      contextPrompts.push('Check stateful replica order and PVCs');
      contextPrompts.push('Is this StatefulSet rollout healthy?');
    } else if (resource.kind === 'DaemonSet') {
      contextPrompts.push('Check daemon rollout across nodes');
      contextPrompts.push('Why are daemon pods not scheduling?');
    } else if (resource.kind === 'Job') {
      contextPrompts.push('Why did the last job execution fail?');
      contextPrompts.push('How can I inspect active job pods?');
    } else if (resource.kind === 'CronJob') {
      contextPrompts.push('Check cron schedule and completion history');
      contextPrompts.push('Why is this CronJob not triggering?');
    } else if (resource.kind === 'Service') {
      contextPrompts.push('How do I test this service?');
      contextPrompts.push('What endpoints does this service expose?');
    } else if (resource.kind === 'Ingress') {
      contextPrompts.push('Explain backend routing rules and TLS certs');
      contextPrompts.push('Are ingress paths configured correctly?');
    } else if (resource.kind === 'ConfigMap') {
      contextPrompts.push('Show workloads consuming this ConfigMap');
      contextPrompts.push('How to mount this ConfigMap in a workload safely');
    } else if (resource.kind === 'Secret') {
      contextPrompts.push('Show workloads consuming this Secret');
      contextPrompts.push('How to mount this Secret safely without leaking data');
    } else if (resource.kind === 'PersistentVolumeClaim') {
      contextPrompts.push('Why is this PVC pending or failing to bind?');
      contextPrompts.push('Check storage class provisioner and capacity');
    } else if (resource.kind === 'PersistentVolume') {
      contextPrompts.push('Check persistent volume capacity and status');
      contextPrompts.push('Show claims bound to this volume');
    } else if (resource.kind === 'Node') {
      contextPrompts.push('Inspect node conditions, taints, and capacity');
      contextPrompts.push('Show pods scheduled on this node');
    } else if (resource.kind === 'Namespace') {
      contextPrompts.push('Summarize resources and quotas in this namespace');
      contextPrompts.push('Check namespace resource limits');
    } else if (resource.kind === 'NetworkPolicy') {
      contextPrompts.push('Explain ingress and egress traffic rules');
      contextPrompts.push('Are pods blocked by this network policy?');
    }
  }

  if (event?.resources && Array.isArray(event.resources)) {
    contextPrompts.push('What in this list needs my attention?');
    contextPrompts.push('Summarize the status of these resources');

    if (event.resources.length > 0) {
      const resourceType = event.resources[0]?.kind;
      if (resourceType === 'Pod') {
        contextPrompts.push('Which pods are unhealthy?');
        contextPrompts.push('Show me pods with high resource usage');
      } else if (resourceType === 'Deployment') {
        contextPrompts.push('Which deployments have replica mismatches?');
        contextPrompts.push('Summarize deployment rollout statuses');
      } else if (resourceType === 'StatefulSet') {
        contextPrompts.push('Which statefulsets have unhealthy replicas?');
        contextPrompts.push('Summarize statefulset statuses');
      } else if (resourceType === 'DaemonSet') {
        contextPrompts.push('Which daemonsets have unavailable nodes?');
        contextPrompts.push('Check daemonset rollout across cluster');
      } else if (resourceType === 'Job' || resourceType === 'CronJob') {
        contextPrompts.push('Which jobs failed recently?');
        contextPrompts.push('List active cron schedules');
      } else if (resourceType === 'Ingress') {
        contextPrompts.push('Check ingress TLS certificates');
        contextPrompts.push('List all ingress hosts and backend paths');
      } else if (resourceType === 'Service') {
        contextPrompts.push('Check services without active endpoints');
        contextPrompts.push('Summarize service types and ports');
      } else if (resourceType === 'ConfigMap' || resourceType === 'Secret') {
        contextPrompts.push('Summarize config resources in this namespace');
        contextPrompts.push('Check recently modified configuration');
      } else if (resourceType === 'PersistentVolumeClaim') {
        contextPrompts.push('Which volume claims are unbound or failing?');
        contextPrompts.push('Summarize PVC storage capacity across namespaces');
      } else if (resourceType === 'Node') {
        contextPrompts.push('Which nodes might have issues?');
        contextPrompts.push('How is cluster capacity looking?');
      } else if (resourceType === 'Namespace') {
        contextPrompts.push('Summarize namespaces and their status');
        contextPrompts.push('Which namespaces have warning events?');
      }
    }
  }

  if (event?.objectEvent?.events) {
    contextPrompts.push('Explain the recent events');
    contextPrompts.push('What do these warnings mean?');
  }

  if (contextPrompts.length === 0 && event?.pathname) {
    const pathname = event.pathname.toLowerCase();
    if (pathname.includes('/pods')) {
      contextPrompts.push('Which pods are unhealthy?');
      contextPrompts.push('Show me pods with high resource usage');
    } else if (pathname.includes('/deployments')) {
      contextPrompts.push('Which deployments have replica mismatches?');
      contextPrompts.push('Summarize deployment rollout statuses');
    } else if (pathname.includes('/statefulsets')) {
      contextPrompts.push('Which statefulsets have unhealthy replicas?');
      contextPrompts.push('Summarize statefulset statuses');
    } else if (pathname.includes('/daemonsets')) {
      contextPrompts.push('Which daemonsets have unavailable nodes?');
      contextPrompts.push('Check daemonset rollout across cluster');
    } else if (pathname.includes('/cronjobs') || pathname.includes('/jobs')) {
      contextPrompts.push('Which jobs failed recently?');
      contextPrompts.push('List active cron schedules');
    } else if (pathname.includes('/ingresses')) {
      contextPrompts.push('Check ingress TLS certificates');
      contextPrompts.push('List all ingress hosts and backend paths');
    } else if (pathname.includes('/services')) {
      contextPrompts.push('Check services without active endpoints');
      contextPrompts.push('Summarize service types and ports');
    } else if (pathname.includes('/configmaps') || pathname.includes('/secrets')) {
      contextPrompts.push('Summarize config resources in this namespace');
      contextPrompts.push('Check recently modified configuration');
    } else if (pathname.includes('/persistentvolumeclaims') || pathname.includes('/storage')) {
      contextPrompts.push('Which volume claims are unbound or failing?');
      contextPrompts.push('Summarize PVC storage capacity across namespaces');
    } else if (pathname.includes('/nodes')) {
      contextPrompts.push('Which nodes might have issues?');
      contextPrompts.push('How is cluster capacity looking?');
    } else if (pathname.includes('/events')) {
      contextPrompts.push('Explain the recent events');
      contextPrompts.push('What do these warnings mean?');
    } else if (pathname.includes('/namespaces')) {
      contextPrompts.push('Summarize namespaces and their status');
      contextPrompts.push('Which namespaces have warning events?');
    }
  }

  // Combine context-specific prompts first, then base prompts
  return [...contextPrompts, ...basePrompts].slice(0, 3);
}

/**
 * React hook that generates dynamic prompt suggestions based on the current
 * navigation context and plugin event state. Uses the current resource/event
 * from the plugin's global state to produce relevant prompt suggestions.
 *
 * @returns An array of up to 3 context-aware prompt strings.
 */
function translatePrompt(t: (key: string) => string, prompt: string): string {
  switch (prompt) {
    case 'What pods need my attention?':
      return t('What pods need my attention?');
    case 'Show me a simple pod YAML example':
      return t('Show me a simple pod YAML example');
    case 'How do I create a LoadBalancer service?':
      return t('How do I create a LoadBalancer service?');
    case 'What are the most common Kubernetes troubleshooting steps?':
      return t('What are the most common Kubernetes troubleshooting steps?');
    case 'Anything to notice about this resource?':
      return t('Anything to notice about this resource?');
    case 'What could be improved here?':
      return t('What could be improved here?');
    case 'Why might this pod be failing?':
      return t('Why might this pod be failing?');
    case 'How can I debug this pod?':
      return t('How can I debug this pod?');
    case 'How can I scale this deployment?':
      return t('How can I scale this deployment?');
    case 'Is this deployment healthy?':
      return t('Is this deployment healthy?');
    case 'Check stateful replica order and PVCs':
      return t('Check stateful replica order and PVCs');
    case 'Is this StatefulSet rollout healthy?':
      return t('Is this StatefulSet rollout healthy?');
    case 'Check daemon rollout across nodes':
      return t('Check daemon rollout across nodes');
    case 'Why are daemon pods not scheduling?':
      return t('Why are daemon pods not scheduling?');
    case 'Why did the last job execution fail?':
      return t('Why did the last job execution fail?');
    case 'How can I inspect active job pods?':
      return t('How can I inspect active job pods?');
    case 'Check cron schedule and completion history':
      return t('Check cron schedule and completion history');
    case 'Why is this CronJob not triggering?':
      return t('Why is this CronJob not triggering?');
    case 'How do I test this service?':
      return t('How do I test this service?');
    case 'What endpoints does this service expose?':
      return t('What endpoints does this service expose?');
    case 'Explain backend routing rules and TLS certs':
      return t('Explain backend routing rules and TLS certs');
    case 'Are ingress paths configured correctly?':
      return t('Are ingress paths configured correctly?');
    case 'Show workloads consuming this ConfigMap':
      return t('Show workloads consuming this ConfigMap');
    case 'How to mount this ConfigMap in a workload safely':
      return t('How to mount this ConfigMap in a workload safely');
    case 'Show workloads consuming this Secret':
      return t('Show workloads consuming this Secret');
    case 'How to mount this Secret safely without leaking data':
      return t('How to mount this Secret safely without leaking data');
    case 'Why is this PVC pending or failing to bind?':
      return t('Why is this PVC pending or failing to bind?');
    case 'Check storage class provisioner and capacity':
      return t('Check storage class provisioner and capacity');
    case 'Check persistent volume capacity and status':
      return t('Check persistent volume capacity and status');
    case 'Show claims bound to this volume':
      return t('Show claims bound to this volume');
    case 'Inspect node conditions, taints, and capacity':
      return t('Inspect node conditions, taints, and capacity');
    case 'Show pods scheduled on this node':
      return t('Show pods scheduled on this node');
    case 'Summarize resources and quotas in this namespace':
      return t('Summarize resources and quotas in this namespace');
    case 'Check namespace resource limits':
      return t('Check namespace resource limits');
    case 'Explain ingress and egress traffic rules':
      return t('Explain ingress and egress traffic rules');
    case 'Are pods blocked by this network policy?':
      return t('Are pods blocked by this network policy?');
    case 'What in this list needs my attention?':
      return t('What in this list needs my attention?');
    case 'Summarize the status of these resources':
      return t('Summarize the status of these resources');
    case 'Which pods are unhealthy?':
      return t('Which pods are unhealthy?');
    case 'Show me pods with high resource usage':
      return t('Show me pods with high resource usage');
    case 'Which deployments have replica mismatches?':
      return t('Which deployments have replica mismatches?');
    case 'Summarize deployment rollout statuses':
      return t('Summarize deployment rollout statuses');
    case 'Which statefulsets have unhealthy replicas?':
      return t('Which statefulsets have unhealthy replicas?');
    case 'Summarize statefulset statuses':
      return t('Summarize statefulset statuses');
    case 'Which daemonsets have unavailable nodes?':
      return t('Which daemonsets have unavailable nodes?');
    case 'Check daemonset rollout across cluster':
      return t('Check daemonset rollout across cluster');
    case 'Which jobs failed recently?':
      return t('Which jobs failed recently?');
    case 'List active cron schedules':
      return t('List active cron schedules');
    case 'Check ingress TLS certificates':
      return t('Check ingress TLS certificates');
    case 'List all ingress hosts and backend paths':
      return t('List all ingress hosts and backend paths');
    case 'Check services without active endpoints':
      return t('Check services without active endpoints');
    case 'Summarize service types and ports':
      return t('Summarize service types and ports');
    case 'Summarize config resources in this namespace':
      return t('Summarize config resources in this namespace');
    case 'Check recently modified configuration':
      return t('Check recently modified configuration');
    case 'Which volume claims are unbound or failing?':
      return t('Which volume claims are unbound or failing?');
    case 'Summarize PVC storage capacity across namespaces':
      return t('Summarize PVC storage capacity across namespaces');
    case 'Which nodes might have issues?':
      return t('Which nodes might have issues?');
    case 'How is cluster capacity looking?':
      return t('How is cluster capacity looking?');
    case 'Summarize namespaces and their status':
      return t('Summarize namespaces and their status');
    case 'Which namespaces have warning events?':
      return t('Which namespaces have warning events?');
    case 'Explain the recent events':
      return t('Explain the recent events');
    case 'What do these warnings mean?':
      return t('What do these warnings mean?');
    default:
      return prompt;
  }
}

export function useDynamicPrompts(): PromptSuggestion[] {
  const location = useLocation();
  const pluginState = useGlobalState();
  const event = pluginState.event;
  const { t } = useTranslation();

  return React.useMemo(() => {
    const eventWithLocation: PromptEvent = {
      ...(event as unknown as PromptEvent | null),
      pathname: location?.pathname,
    };
    return generatePrompts(eventWithLocation).map(prompt => ({
      label: translatePrompt(t, prompt),
      prompt,
    }));
  }, [location?.pathname, event, t]);
}
