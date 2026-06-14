import { getProviderById } from '@headlamp-k8s/ai-common/providers/catalog';
import type { StoredProviderConfig } from '@headlamp-k8s/ai-common/providers/savedConfigs';

/**
 * Converts lightweight markdown formatting into plain text.
 *
 * @param markdown - Markdown suggestion label.
 * @returns Plain-text label suitable for compact UI controls.
 */
export function markdownToPlainText(markdown: string): string {
  return (
    markdown
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove fenced code blocks but keep their content
      .replace(/```(?:[\w-]+)?\n?([\s\S]*?)```/g, '$1')
      // Remove bold/italic
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')
      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove blockquotes
      .replace(/^\s*>+\s+/gm, '')
      // Remove horizontal rules
      .replace(/^-{3,}\s*$/gm, '')
      // Remove surrounding square brackets
      .replace(/^\[|\]$/g, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Converts a supported primitive response value to text.
 *
 * @param value - Untrusted response value.
 * @returns Text for strings and primitives, or an empty string for unsupported values.
 */
function responseValueToText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (['string', 'number', 'boolean', 'bigint', 'symbol'].includes(typeof value)) {
    return String(value);
  }
  return '';
}

/**
 * Checks whether an untrusted value is a non-null object record.
 *
 * @param value - Value to inspect.
 * @returns Whether the value can be safely accessed by string keys.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extracts at most three non-empty labels without splitting an unbounded response.
 *
 * @param suggestionsText - Pipe-delimited suggestion payload.
 * @returns Up to three plain-text suggestion labels.
 */
function parseSuggestionLabels(suggestionsText: string): string[] {
  const suggestions: string[] = [];
  let start = 0;

  while (suggestions.length < 3 && start <= suggestionsText.length) {
    const separator = suggestionsText.indexOf('|', start);
    const end = separator === -1 ? suggestionsText.length : separator;
    const suggestion = markdownToPlainText(suggestionsText.slice(start, end).trim());
    if (suggestion) suggestions.push(suggestion);
    if (separator === -1) break;
    start = separator + 1;
  }

  return suggestions;
}

/**
 * Extracts inline prompt suggestions from an untrusted model response.
 *
 * @param content - String, text block, text-block array, or primitive model response.
 * @returns Remaining response content and up to three plain-text suggestions.
 */
export function parseSuggestionsFromResponse(content: unknown): {
  cleanContent: string;
  suggestions: string[];
} {
  let processedContent: string;

  if (typeof content === 'string') {
    processedContent = content;
  } else {
    console.warn('parseSuggestionsFromResponse: content is not a string', typeof content, content);
    if (Array.isArray(content)) {
      processedContent = content
        .filter(item => isRecord(item) && item.type === 'text')
        .map(item => responseValueToText(item.text))
        .join('');
    } else if (isRecord(content) && 'text' in content) {
      processedContent = responseValueToText(content.text);
    } else {
      processedContent = responseValueToText(content);
    }
  }

  const suggestionPattern = /SUGGESTIONS:\s*(.+?)(?:\n|$)/i;
  const match = processedContent.match(suggestionPattern);

  if (match) {
    const suggestionsText = match[1];
    const suggestions = parseSuggestionLabels(suggestionsText);

    // Remove the suggestions line from the content
    const cleanContent = processedContent.replace(suggestionPattern, '').trim();

    return { cleanContent, suggestions };
  }

  return { cleanContent: processedContent, suggestions: [] };
}

/**
 * Returns all available models for a provider.
 *
 * @param providerConfig - Saved provider configuration and optional custom model.
 * @returns Catalog models plus a distinct configured custom model, or `default`.
 */
export function getProviderModels(providerConfig: StoredProviderConfig): string[] {
  const providerInfo = getProviderById(providerConfig.providerId);

  // First try to use the models field, then fall back to options from the model field
  let models: string[] = [];
  if (providerInfo?.models && providerInfo.models.length > 0) {
    models = providerInfo.models;
  } else {
    const modelField = providerInfo?.fields?.find(field => field.name === 'model');
    if (modelField?.options && modelField.options.length > 0) {
      models = modelField.options;
    } else {
      models = ['default'];
    }
  }

  // Add custom model from config if not already present
  if (providerConfig.config.model && !models.includes(providerConfig.config.model)) {
    models = [...models, providerConfig.config.model];
  }

  return models;
}

/**
 * Returns chat-selectable models, respecting provider-level model pinning.
 *
 * @param providerConfig - Provider configuration being used for the chat.
 * @param allConfigs - All saved configurations that may restrict this provider.
 * @returns The pinned model or all available provider models.
 */
export function getProviderModelsForChat(
  providerConfig: StoredProviderConfig,
  allConfigs: StoredProviderConfig[]
): string[] {
  // Check if any config for this provider has showOnlyThisModel enabled
  const configsForProvider = allConfigs.filter(c => c.providerId === providerConfig.providerId);
  const restrictedConfig = configsForProvider.find(c => c.config?.showOnlyThisModel);

  if (restrictedConfig) {
    // If there's a config with showOnlyThisModel enabled, only return that model
    return restrictedConfig.config?.model ? [restrictedConfig.config.model] : ['default'];
  }

  // Otherwise, return all models for this provider
  return getProviderModels(providerConfig);
}

/**
 * Returns the short label used to display a model name.
 *
 * @param model - Full or provider-prefixed model identifier.
 * @returns Final slash-delimited segment, or the original identifier.
 */
export function getModelDisplayName(model: string): string {
  // Strip "provider/" prefix from Copilot model IDs (e.g. "openai/gpt-4o" → "gpt-4o")
  if (model.includes('/')) {
    return model.slice(model.lastIndexOf('/') + 1) || model;
  }
  return model;
}
