/**
 * Utility to optimize performance of AI interactions
 */
export class PerformanceOptimizer {
  // Truncate context if it's too large
  static truncateContext(context: any, maxTokens: number = 4000): any {
    if (!context) return context;

    // Convert to string to measure size
    const contextString = JSON.stringify(context);

    // Rough estimate: 1 token ~= 4 characters
    const estimatedTokens = contextString.length / 4;

    if (estimatedTokens <= maxTokens) {
      return context;
    }

    console.log(`Context too large (est. ${estimatedTokens} tokens), truncating...`);

    // For arrays, truncate items
    if (Array.isArray(context)) {
      const reductionFactor = maxTokens / estimatedTokens;
      const newLength = Math.max(1, Math.floor(context.length * reductionFactor));
      return context.slice(0, newLength);
    }

    // For objects, simplify
    if (typeof context === 'object' && context !== null) {
      const result = { ...context };

      // Remove less important fields
      const lowPriorityFields = ['annotations', 'managedFields', 'status'];
      lowPriorityFields.forEach(field => {
        if (field in result) {
          delete result[field];
        }
      });

      // If still too large, simplify further
      const updatedString = JSON.stringify(result);
      const updatedTokens = updatedString.length / 4;

      if (updatedTokens > maxTokens) {
        // Keep only the most important fields for identification
        return {
          kind: result.kind,
          apiVersion: result.apiVersion,
          metadata: {
            name: result.metadata?.name,
            namespace: result.metadata?.namespace,
          },
          _truncated: true,
        };
      }

      return result;
    }

    // For strings, truncate directly
    if (typeof context === 'string') {
      const targetLength = maxTokens * 4;
      if (context.length > targetLength) {
        return context.substring(0, targetLength) + ' [truncated...]';
      }
    }

    return context;
  }

  // Compress history to avoid token limits
  static compressHistory(history: any[], maxEntries: number = 10): any[] {
    if (history.length <= maxEntries) {
      return history;
    }

    // Keep the first system message
    const systemMessages = history.filter(msg => msg.role === 'system');

    // Keep recent messages
    const recentMessages = history.slice(-maxEntries);

    // Summarize older messages
    const olderMessages = history.slice(systemMessages.length, -maxEntries);
    if (olderMessages.length > 0) {
      const summary = {
        role: 'system',
        content: `[${olderMessages.length} previous messages summarized]`,
        isSummary: true,
      };

      return [...systemMessages, summary, ...recentMessages];
    }

    return [...systemMessages, ...recentMessages];
  }
}

export default PerformanceOptimizer;
