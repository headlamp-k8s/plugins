import type { PromptSuggestion } from '@headlamp-k8s/ai-ui/components/assistant/PromptSuggestions';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalState } from '../pluginState';

/** Event shape used for prompt generation. */
export interface PromptEvent {
  resource?: {
    kind?: string;
    metadata?: {
      name?: string;
      namespace?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  resources?: Array<{
    kind?: string;
    metadata?: {
      name?: string;
      namespace?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  objectEvent?: { events?: unknown[] };
  project?: { id?: string; [key: string]: unknown };
  projects?: unknown[];
  projectTab?: string;
  pathname?: string;
}

/** Formats a natural target string for a Kubernetes resource instance. */
function formatTarget(kind?: string, name?: string, namespace?: string): string | undefined {
  if (!name) {
    return undefined;
  }
  const prefix = kind ? `${kind.toLowerCase()} ` : '';
  if (namespace) {
    return `${prefix}${name} in namespace ${namespace}`;
  }
  return `${prefix}${name}`;
}

/**
 * Translates a prompt template string using the provided translation function.
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
    case 'Is everything healthy in this project?':
      return t('Is everything healthy in this project?');
    case 'Summarize the resources in this project':
      return t('Summarize the resources in this project');
    case 'Which projects need my attention?':
      return t('Which projects need my attention?');
    case 'Summarize the status of these projects':
      return t('Summarize the status of these projects');
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

/**
 * Generates context-aware prompt suggestions with separate localized labels
 * and canonical prompt strings. Returns up to 3 suggestions: context-specific
 * suggestions first, then generic base prompts.
 *
 * @param event - The current event/resource context, or undefined/null.
 * @param t - Optional translation function for display labels.
 * @returns An array of at most 3 PromptSuggestion objects.
 */
export function generatePromptSuggestions(
  event: PromptEvent | null | undefined,
  t: (key: string) => string = (k: string) => k
): PromptSuggestion[] {
  // Base prompts that work in any context
  const basePrompts = [
    'What pods need my attention?',
    'Show me a simple pod YAML example',
    'How do I create a LoadBalancer service?',
    'What are the most common Kubernetes troubleshooting steps?',
  ];

  const contextSuggestions: PromptSuggestion[] = [];

  const addSuggestion = (label: string, prompt?: string) => {
    contextSuggestions.push({
      label: translatePrompt(t, label),
      prompt: prompt ?? label,
    });
  };

  if (event?.project) {
    addSuggestion('Is everything healthy in this project?');
    addSuggestion('Summarize the resources in this project');

    if (event.projectTab) {
      const tabPrompt = `What should I check in the ${event.projectTab} tab?`;
      addSuggestion(tabPrompt, tabPrompt);
    }
  }

  if (event?.projects && Array.isArray(event.projects)) {
    addSuggestion('Which projects need my attention?');
    addSuggestion('Summarize the status of these projects');
  }

  if (event?.resource) {
    const resource = event.resource;
    const kind = resource.kind;
    const metadata = resource.metadata as { name?: string; namespace?: string } | undefined;
    const target = formatTarget(kind, metadata?.name, metadata?.namespace);

    // Kind-specific suggestions prioritized first
    if (kind === 'Pod') {
      addSuggestion(
        'Why might this pod be failing?',
        target ? `Why might ${target} be failing?` : undefined
      );
      addSuggestion('How can I debug this pod?', target ? `How can I debug ${target}?` : undefined);
    } else if (kind === 'Deployment') {
      addSuggestion(
        'How can I scale this deployment?',
        target ? `How can I scale ${target}?` : undefined
      );
      addSuggestion('Is this deployment healthy?', target ? `Is ${target} healthy?` : undefined);
    } else if (kind === 'StatefulSet') {
      addSuggestion(
        'Check stateful replica order and PVCs',
        target ? `Check stateful replica order and PVCs for ${target}` : undefined
      );
      addSuggestion(
        'Is this StatefulSet rollout healthy?',
        target ? `Is ${target} rollout healthy?` : undefined
      );
    } else if (kind === 'DaemonSet') {
      addSuggestion(
        'Check daemon rollout across nodes',
        target ? `Check daemon rollout across nodes for ${target}` : undefined
      );
      addSuggestion(
        'Why are daemon pods not scheduling?',
        target ? `Why are pods for ${target} not scheduling?` : undefined
      );
    } else if (kind === 'Job') {
      addSuggestion(
        'Why did the last job execution fail?',
        target ? `Why did the execution for ${target} fail?` : undefined
      );
      addSuggestion(
        'How can I inspect active job pods?',
        target ? `How can I inspect active pods for ${target}?` : undefined
      );
    } else if (kind === 'CronJob') {
      addSuggestion(
        'Check cron schedule and completion history',
        target ? `Check cron schedule and completion history for ${target}` : undefined
      );
      addSuggestion(
        'Why is this CronJob not triggering?',
        target ? `Why is ${target} not triggering?` : undefined
      );
    } else if (kind === 'Service') {
      addSuggestion('How do I test this service?', target ? `How do I test ${target}?` : undefined);
      addSuggestion(
        'What endpoints does this service expose?',
        target ? `What endpoints does ${target} expose?` : undefined
      );
    } else if (kind === 'Ingress') {
      addSuggestion(
        'Explain backend routing rules and TLS certs',
        target ? `Explain backend routing rules and TLS certs for ${target}` : undefined
      );
      addSuggestion(
        'Are ingress paths configured correctly?',
        target ? `Are paths for ${target} configured correctly?` : undefined
      );
    } else if (kind === 'ConfigMap') {
      addSuggestion(
        'Show workloads consuming this ConfigMap',
        target ? `Show workloads consuming ${target}` : undefined
      );
      addSuggestion(
        'How to mount this ConfigMap in a workload safely',
        target ? `How to mount ${target} in a workload safely` : undefined
      );
    } else if (kind === 'Secret') {
      addSuggestion(
        'Show workloads consuming this Secret',
        target ? `Show workloads consuming ${target}` : undefined
      );
      addSuggestion(
        'How to mount this Secret safely without leaking data',
        target ? `How to mount ${target} safely without leaking data` : undefined
      );
    } else if (kind === 'PersistentVolumeClaim') {
      addSuggestion(
        'Why is this PVC pending or failing to bind?',
        target ? `Why is ${target} pending or failing to bind?` : undefined
      );
      addSuggestion(
        'Check storage class provisioner and capacity',
        target ? `Check storage class provisioner and capacity for ${target}` : undefined
      );
    } else if (kind === 'PersistentVolume') {
      addSuggestion(
        'Check persistent volume capacity and status',
        target ? `Check capacity and status for ${target}` : undefined
      );
      addSuggestion(
        'Show claims bound to this volume',
        target ? `Show claims bound to ${target}` : undefined
      );
    } else if (kind === 'Node') {
      addSuggestion(
        'Inspect node conditions, taints, and capacity',
        target ? `Inspect conditions, taints, and capacity for ${target}` : undefined
      );
      addSuggestion(
        'Show pods scheduled on this node',
        target ? `Show pods scheduled on ${target}` : undefined
      );
    } else if (kind === 'Namespace') {
      addSuggestion(
        'Summarize resources and quotas in this namespace',
        target ? `Summarize resources and quotas in ${target}` : undefined
      );
      addSuggestion(
        'Check namespace resource limits',
        target ? `Check resource limits for ${target}` : undefined
      );
    } else if (kind === 'NetworkPolicy') {
      addSuggestion(
        'Explain ingress and egress traffic rules',
        target ? `Explain ingress and egress traffic rules for ${target}` : undefined
      );
      addSuggestion(
        'Are pods blocked by this network policy?',
        target ? `Are pods blocked by ${target}?` : undefined
      );
    }

    // Generic resource prompts as fallbacks
    addSuggestion(
      'Anything to notice about this resource?',
      target ? `Anything to notice about ${target}?` : undefined
    );
    addSuggestion(
      'What could be improved here?',
      target ? `What could be improved for ${target}?` : undefined
    );
  }

  if (event?.resources && Array.isArray(event.resources)) {
    // Kind-specific list suggestions prioritized first
    if (event.resources.length > 0) {
      const resourceType = event.resources[0]?.kind;
      if (resourceType === 'Pod') {
        addSuggestion('Which pods are unhealthy?');
        addSuggestion('Show me pods with high resource usage');
      } else if (resourceType === 'Deployment') {
        addSuggestion('Which deployments have replica mismatches?');
        addSuggestion('Summarize deployment rollout statuses');
      } else if (resourceType === 'StatefulSet') {
        addSuggestion('Which statefulsets have unhealthy replicas?');
        addSuggestion('Summarize statefulset statuses');
      } else if (resourceType === 'DaemonSet') {
        addSuggestion('Which daemonsets have unavailable nodes?');
        addSuggestion('Check daemonset rollout across cluster');
      } else if (resourceType === 'Job') {
        addSuggestion('Which jobs failed recently?');
        addSuggestion('How can I inspect active job pods?');
      } else if (resourceType === 'CronJob') {
        addSuggestion('List active cron schedules');
        addSuggestion('Check cron schedule and completion history');
      } else if (resourceType === 'Ingress') {
        addSuggestion('Check ingress TLS certificates');
        addSuggestion('List all ingress hosts and backend paths');
      } else if (resourceType === 'Service') {
        addSuggestion('Check services without active endpoints');
        addSuggestion('Summarize service types and ports');
      } else if (resourceType === 'ConfigMap' || resourceType === 'Secret') {
        addSuggestion('Summarize config resources in this namespace');
        addSuggestion('Check recently modified configuration');
      } else if (resourceType === 'PersistentVolumeClaim') {
        addSuggestion('Which volume claims are unbound or failing?');
        addSuggestion('Summarize PVC storage capacity across namespaces');
      } else if (resourceType === 'Node') {
        addSuggestion('Which nodes might have issues?');
        addSuggestion('How is cluster capacity looking?');
      } else if (resourceType === 'Namespace') {
        addSuggestion('Summarize namespaces and their status');
        addSuggestion('Which namespaces have warning events?');
      }
    }

    // Generic list prompts as fallbacks
    addSuggestion('What in this list needs my attention?');
    addSuggestion('Summarize the status of these resources');
  }

  if (event?.objectEvent?.events) {
    addSuggestion('Explain the recent events');
    addSuggestion('What do these warnings mean?');
  }

  if (contextSuggestions.length === 0 && event?.pathname) {
    const pathname = event.pathname.toLowerCase();
    if (pathname.includes('/pods')) {
      addSuggestion('Which pods are unhealthy?');
      addSuggestion('Show me pods with high resource usage');
    } else if (pathname.includes('/deployments')) {
      addSuggestion('Which deployments have replica mismatches?');
      addSuggestion('Summarize deployment rollout statuses');
    } else if (pathname.includes('/statefulsets')) {
      addSuggestion('Which statefulsets have unhealthy replicas?');
      addSuggestion('Summarize statefulset statuses');
    } else if (pathname.includes('/daemonsets')) {
      addSuggestion('Which daemonsets have unavailable nodes?');
      addSuggestion('Check daemonset rollout across cluster');
    } else if (pathname.includes('/cronjobs')) {
      addSuggestion('List active cron schedules');
      addSuggestion('Check cron schedule and completion history');
    } else if (pathname.includes('/jobs')) {
      addSuggestion('Which jobs failed recently?');
      addSuggestion('How can I inspect active job pods?');
    } else if (pathname.includes('/ingresses')) {
      addSuggestion('Check ingress TLS certificates');
      addSuggestion('List all ingress hosts and backend paths');
    } else if (pathname.includes('/services')) {
      addSuggestion('Check services without active endpoints');
      addSuggestion('Summarize service types and ports');
    } else if (pathname.includes('/configmaps') || pathname.includes('/secrets')) {
      addSuggestion('Summarize config resources in this namespace');
      addSuggestion('Check recently modified configuration');
    } else if (pathname.includes('/persistentvolumeclaims')) {
      addSuggestion('Which volume claims are unbound or failing?');
      addSuggestion('Summarize PVC storage capacity across namespaces');
    } else if (pathname.includes('/nodes')) {
      addSuggestion('Which nodes might have issues?');
      addSuggestion('How is cluster capacity looking?');
    } else if (pathname.includes('/events')) {
      addSuggestion('Explain the recent events');
      addSuggestion('What do these warnings mean?');
    } else if (pathname.includes('/namespaces')) {
      addSuggestion('Summarize namespaces and their status');
      addSuggestion('Which namespaces have warning events?');
    }
  }

  const baseSuggestions: PromptSuggestion[] = basePrompts.map(prompt => ({
    label: translatePrompt(t, prompt),
    prompt,
  }));

  // Combine context-specific suggestions first, then base prompts
  return [...contextSuggestions, ...baseSuggestions].slice(0, 3);
}

/**
 * Generates context-aware prompt strings based on the current Kubernetes
 * resource or event being viewed. Returns up to 3 prompts: context-specific
 * prompts first (resource type, list, events, route fallback), then generic base prompts.
 *
 * @param event - The current event/resource context, or undefined/null.
 * @returns An array of at most 3 prompt strings.
 */
export function generatePrompts(event: PromptEvent | null | undefined): string[] {
  return generatePromptSuggestions(event).map(suggestion => suggestion.prompt);
}

/**
 * React hook that generates dynamic prompt suggestions based on the current
 * navigation context and plugin event state. Uses the current resource/event
 * from the plugin's global state to produce relevant prompt suggestions.
 *
 * @returns An array of up to 3 context-aware PromptSuggestion objects.
 */
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
    return generatePromptSuggestions(eventWithLocation, t);
  }, [location?.pathname, event, t]);
}
