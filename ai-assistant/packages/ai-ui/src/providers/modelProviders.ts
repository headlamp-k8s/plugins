import { getProviderById } from '@headlamp-k8s/ai-common/config/modelConfig';
import { StoredProviderConfig } from '@headlamp-k8s/ai-common/managers/ProviderConfigManager';

/** Converts lightweight markdown formatting into plain text for UI-friendly suggestion labels. */
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

/** Extracts inline prompt suggestions from a model response and returns the remaining content. */
export function parseSuggestionsFromResponse(content: string | any): {
  cleanContent: string;
  suggestions: string[];
} {
  // Ensure content is a string
  let processedContent: string;

  if (typeof content !== 'string') {
    console.warn('parseSuggestionsFromResponse: content is not a string', typeof content, content);
    // Try to extract text from non-string content
    if (Array.isArray(content)) {
      processedContent = content
        .filter((item: any) => item && typeof item === 'object' && item.type === 'text')
        .map((item: any) => item.text || '')
        .join('');
    } else if (content && typeof content === 'object' && (content as any).text) {
      processedContent = (content as any).text;
    } else {
      processedContent = String(content || '');
    }
  } else {
    processedContent = content;
  }

  const suggestionPattern = /SUGGESTIONS:\s*(.+?)(?:\n|$)/i;
  const match = processedContent.match(suggestionPattern);

  if (match) {
    const suggestionsText = match[1];
    const suggestions = suggestionsText
      .split('|')
      .map(s => markdownToPlainText(s.trim()))
      .filter(s => s.length > 0)
      .slice(0, 3); // Ensure max 3 suggestions

    // Remove the suggestions line from the content
    const cleanContent = processedContent.replace(suggestionPattern, '').trim();

    return { cleanContent, suggestions };
  }

  return { cleanContent: processedContent, suggestions: [] };
}

/** Returns the available models for a provider, including any custom model saved in config. */
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
  if (
    providerConfig.config &&
    providerConfig.config.model &&
    !models.includes(providerConfig.config.model)
  ) {
    models = [...models, providerConfig.config.model];
  }

  return models;
}

/** Returns chat-selectable models, respecting provider configs that pin chats to one model. */
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

/** Returns the label used to display a model name in the UI. */
export function getModelDisplayName(model: string): string {
  // Strip "provider/" prefix from Copilot model IDs (e.g. "openai/gpt-4o" → "gpt-4o")
  if (model.includes('/')) {
    return model.split('/').pop() ?? model;
  }
  return model;
}
