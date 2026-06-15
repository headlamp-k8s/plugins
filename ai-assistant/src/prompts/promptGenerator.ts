import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalState } from '../pluginState';

/** Event shape used for prompt generation. */
export interface PromptEvent {
  resource?: { kind?: string; [key: string]: unknown };
  resources?: Array<{ kind?: string; [key: string]: unknown }>;
  objectEvent?: { events?: unknown[] };
}

/**
 * Generates context-aware prompt suggestions based on the current Kubernetes
 * resource or event being viewed. Returns up to 3 prompts: context-specific
 * prompts first (resource type, list, events), then generic base prompts.
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
    } else if (resource.kind === 'Service') {
      contextPrompts.push('How do I test this service?');
      contextPrompts.push('What endpoints does this service expose?');
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
      } else if (resourceType === 'Node') {
        contextPrompts.push('Which nodes might have issues?');
        contextPrompts.push('How is cluster capacity looking?');
      }
    }
  }

  if (event?.objectEvent?.events) {
    contextPrompts.push('Explain the recent events');
    contextPrompts.push('What do these warnings mean?');
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
export function useDynamicPrompts(): string[] {
  const location = useLocation();
  const pluginState = useGlobalState();
  const event = pluginState.event;

  return React.useMemo(() => {
    return generatePrompts(event as unknown as PromptEvent | null);
  }, [location.pathname, event]);
}
