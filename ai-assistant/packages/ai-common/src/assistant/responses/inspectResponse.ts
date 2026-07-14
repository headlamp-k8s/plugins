/**
 * Pure helpers for processing and classifying model responses after tool
 * execution.
 */

import type { ConversationMessage as Prompt } from '../../conversation/types';

// ---------------------------------------------------------------------------
// isEmptyLLMContent
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the text extracted from an LLM response is absent or
 * consists entirely of whitespace.
 *
 * Used to detect the case where the model returned tool calls but no
 * explanatory text, indicating it wants to make further tool calls rather than
 * summarising the results.
 *
 * @param content - Extracted model text to inspect.
 * @returns Whether the content is absent, empty, or whitespace-only.
 */
export function isEmptyLLMContent(content: string | undefined | null): boolean {
  if (!content) return true;
  return content.trim().length === 0;
}

// ---------------------------------------------------------------------------
// isMCPFormattedOutput
// ---------------------------------------------------------------------------

/**
 * Returns `true` when a tool-response content string contains a pre-formatted
 * MCP output payload (`{ formatted: true, mcpOutput: … }`).
 *
 * Pre-formatted MCP payloads should be returned to the UI as-is rather than
 * being re-processed or prefixed with a tool-name label.
 *
 * Returns `false` for any non-JSON content or JSON that lacks the required
 * shape.
 *
 * @param content - Serialized tool response to inspect.
 * @returns Whether the JSON contains truthy `formatted` and `mcpOutput` fields.
 */
export function isMCPFormattedOutput(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return Boolean(parsed && parsed.formatted && parsed.mcpOutput);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// getRecentToolResponses
// ---------------------------------------------------------------------------

/**
 * Returns the most recent actionable tool-response entries from a chat-history
 * array, in chronological order.
 *
 * "Actionable" means the message has `role === 'tool'` **and** a non-empty
 * `toolCallId` (display-only placeholders that lack a `toolCallId` are
 * excluded by the `toolCallId` truthiness check).
 *
 * The result is a plain-object array suitable for passing to
 * `assembleFallbackResponseContent` or `isMCPFormattedOutput`.
 *
 * @param history  - Full chat history.
 * @param maxCount - Maximum number of recent responses to return (default 3).
 * @returns Recent actionable tool responses in chronological order.
 */
export function getRecentToolResponses(
  history: Prompt[],
  maxCount = 3
): Array<{
  /** Optional tool name copied from conversation history. */
  name?: string;
  /** Raw tool response content. */
  content: string;
}> {
  return history
    .filter(p => p.role === 'tool' && p.toolCallId)
    .slice(-maxCount)
    .map(p => ({ name: p.name, content: p.content }));
}

// ---------------------------------------------------------------------------
// mapCorrectedResponseToolCalls
// ---------------------------------------------------------------------------

/**
 * Maps the raw tool-call objects from a (possibly kubectl-corrected) LLM
 * response into the normalised `{ id, type, function }` shape stored in
 * `Prompt.toolCalls`.
 *
 * Differences from `normalizeLLMToolCalls`:
 * - `name` falls back to `'kubernetes_api_request'` (not `undefined`) when
 *   the model omits the tool name — this happens when the corrected response
 *   inherits a partially-formed tool call.
 * - `tc.args` is still serialised with `JSON.stringify`; absent `args`
 *   defaults to `{}`.
 *
 * @param toolCalls - Raw tool-call array from the corrected model response.
 * @returns Valid object entries normalized for conversation history.
 */
export function mapCorrectedResponseToolCalls(toolCalls: unknown[]): Array<{
  /** Model-generated call identifier, or an empty string when absent. */
  id: string;
  /** Stored tool-call discriminator. */
  type: 'function';
  /** Normalized function payload. */
  function: {
    /** Function name, defaulting to the Kubernetes API tool. */
    name: string;
    /** JSON-serialized arguments, defaulting to an empty object. */
    arguments: string;
  };
}> {
  return toolCalls.flatMap(toolCall => {
    if (typeof toolCall !== 'object' || toolCall === null) return [];
    const id = 'id' in toolCall && typeof toolCall.id === 'string' ? toolCall.id : '';
    const name =
      'name' in toolCall && typeof toolCall.name === 'string' && toolCall.name
        ? toolCall.name
        : 'kubernetes_api_request';
    const args = 'args' in toolCall ? toolCall.args : {};
    return [
      {
        id,
        type: 'function' as const,
        function: { name, arguments: JSON.stringify(args ?? {}) },
      },
    ];
  });
}
