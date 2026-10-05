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
    case 'How do I test this service?':
      return t('How do I test this service?');
    case 'What endpoints does this service expose?':
      return t('What endpoints does this service expose?');
    case 'What in this list needs my attention?':
      return t('What in this list needs my attention?');
    case 'Summarize the status of these resources':
      return t('Summarize the status of these resources');
    case 'Which pods are unhealthy?':
      return t('Which pods are unhealthy?');
    case 'Show me pods with high resource usage':
      return t('Show me pods with high resource usage');
    case 'Which nodes might have issues?':
      return t('Which nodes might have issues?');
    case 'How is cluster capacity looking?':
      return t('How is cluster capacity looking?');
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
    return generatePrompts(event as unknown as PromptEvent | null).map(prompt => ({
      label: translatePrompt(t, prompt),
      prompt,
    }));
  }, [location.pathname, event, t]);
}
