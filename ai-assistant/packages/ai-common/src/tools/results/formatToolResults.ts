/**
 * Pure functions for formatting tool execution results into Markdown strings
 * suitable for display or as LLM context.
 */

import { redactSecrets, redactSecretsInValue } from '../../security/redactSecrets';

export interface ToolResult {
  /** Truthy when the tool failed. */
  error?: boolean | string;
  /** Alternative error flag used by some tool adapters. */
  isError?: boolean;
  /** Human-readable error message. */
  message?: string;
  /** Structured payload on success. */
  data?: unknown;
  /** Plain-text content returned directly by some tools. */
  content?: string;
  /** General-purpose success flag. */
  success?: boolean;
  /** Additional tool-specific result fields included in raw output. */
  [key: string]: unknown;
}

/**
 * Produce a concise Markdown summary of a map of tool results.
 *
 * This is the minimal representation used when a short status report is
 * sufficient — for example when surfacing results inline in a message.
 *
 * @param results - Map from tool name → result payload.
 * @returns Markdown string with one section per tool.
 */
export function aggregateToolResults(results: Record<string, ToolResult>): string {
  let aggregation = '## Tool Execution Results\n\n';

  for (const [toolName, result] of Object.entries(results)) {
    aggregation += `### ${toolName}\n`;

    if (result.error) {
      aggregation += `**Error**: ${result.message}\n\n`;
    } else if (result.success) {
      aggregation += '**Status**: Successfully executed\n';
      aggregation += `**Data**:\n\`\`\`json\n${JSON.stringify(
        redactSecretsInValue(result.data),
        null,
        2
      )}\n\`\`\`\n\n`;
    } else {
      aggregation += `**Result**:\n\`\`\`json\n${JSON.stringify(
        redactSecretsInValue(result),
        null,
        2
      )}\n\`\`\`\n\n`;
    }
  }

  // Redact secret material (e.g. Kubernetes Secret values) before this text is
  // shown in the UI or sent to the LLM provider.
  return redactSecrets(aggregation);
}

/**
 * Produce a rich Markdown representation of a map of tool results, including
 * emoji status indicators and smart branching between `data`, `content`, and
 * raw JSON payloads.
 *
 * This is the fuller format injected into the LLM context when asking it to
 * synthesise a response from multiple tool outputs.
 *
 * @param results - Map from tool name → result payload.
 * @returns Markdown string with one section per tool.
 */
export function formatToolResultsForLLM(results: Record<string, ToolResult>): string {
  let formatted = '## Tool Execution Results\n\n';

  for (const [toolName, result] of Object.entries(results)) {
    formatted += `### ${toolName}\n`;

    if (result.error || result.isError) {
      formatted += '**Status**: ❌ Error\n';
      formatted += `**Error Message**: ${result.message ?? 'Unknown error'}\n\n`;
    } else {
      formatted += '**Status**: ✅ Success\n';

      if (result.data !== undefined) {
        formatted += '**Data**:\n';
        formatted += '```json\n';
        formatted += JSON.stringify(redactSecretsInValue(result.data), null, 2);
        formatted += '\n```\n\n';
      } else if (result.content !== undefined) {
        formatted += `**Data**:\n${result.content}\n\n`;
      } else {
        formatted += '**Result**:\n';
        formatted += '```json\n';
        formatted += JSON.stringify(redactSecretsInValue(result), null, 2);
        formatted += '\n```\n\n';
      }
    }
  }

  // Redact secret material before this text is sent to the LLM provider.
  return redactSecrets(formatted);
}
