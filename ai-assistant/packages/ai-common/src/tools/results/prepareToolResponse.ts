/**
 * Pure helpers used when preparing the message list and argument defaults
 * for tool-response processing.
 */

import type { ConversationMessage as Prompt } from '../../conversation/types';
import type { UserContext } from '../../mcp/tools/types';
import { getIntelligentDefault } from '../../prompts/buildToolArgumentPrompt';

// ---------------------------------------------------------------------------
// isRegularConversationMessage
// ---------------------------------------------------------------------------

/**
 * Returns `true` when a history prompt should be included in the message list
 * sent to the LLM during tool-response processing.
 *
 * The following are **excluded** from the LLM context:
 * - `system` messages (the system prompt is injected separately)
 * - Display-only messages (confirmation dialogs, UI state)
 * - `tool` messages (collected and aggregated separately)
 * - `assistant` messages that declare tool calls, keeping analysis context free
 *   of incomplete tool-call sequences
 *
 * @param prompt - Conversation message to test for inclusion in LLM context.
 * @returns Whether the message should be included as regular conversation history.
 */
export function isRegularConversationMessage(prompt: Prompt): boolean {
  if (prompt.role === 'system') return false;
  if (prompt.isDisplayOnly) return false;
  if (prompt.role === 'tool') return false;
  if (prompt.role === 'assistant' && prompt.toolCalls?.length) return false;
  return true;
}

// ---------------------------------------------------------------------------
// buildToolDataAnalysisRequest
// ---------------------------------------------------------------------------

/**
 * Builds the `HumanMessage` text that asks the LLM to analyse tool results
 * and answer the user's original question.
 *
 * The returned string is ready to be passed to `new HumanMessage(…)`.
 * @param toolData - The aggregated, size-limited tool-response text produced by
 *                   the `processToolContent` loop.
 * @returns A user message that asks the model to analyze the supplied tool data.
 */
export function buildToolDataAnalysisRequest(toolData: string): string {
  return `Here is the data retrieved from the Kubernetes API:\n\n${toolData}\n\nPlease analyze this data and provide a helpful, descriptive answer to my original question. Focus on any issues, anomalies, or relevant information. Follow all response formatting guidelines from the system prompt including resource links and suggestions.`;
}

// ---------------------------------------------------------------------------
// fillMissingRequiredFields
// ---------------------------------------------------------------------------

/**
 * Fills in required fields that are still missing or empty after argument
 * enhancement, using `getIntelligentDefault` for each.
 *
 * Only fields listed in `inputSchema.required` that currently have
 * `undefined`, `null`, or `""` as their value are touched; optional and
 * already-populated fields are left unchanged.
 * @param args        - Argument map to copy before filling missing required fields.
 * @param inputSchema - The tool's JSON schema (`inputSchema` property of the
 *                      MCP tool schema object).
 * @param userContext - Conversation context used by `getIntelligentDefault` to
 *                      derive namespace, container-name, etc.
 * @returns A shallow copy with defaults for missing required fields.
 */
export function fillMissingRequiredFields(
  args: Record<string, unknown>,
  inputSchema: {
    /** JSON Schema definitions keyed by argument name. */
    properties?: Record<string, unknown>;
    /** Argument names that must receive values. */
    required?: string[];
  },
  userContext: UserContext
): Record<string, unknown> {
  const result = { ...args };
  const properties = inputSchema.properties ?? {};
  const required = inputSchema.required ?? [];

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    if (!required.includes(fieldName)) continue;
    const current = result[fieldName];
    if (current !== undefined && current !== null && current !== '') continue;
    const typedSchema = fieldSchema as Parameters<typeof getIntelligentDefault>[1];
    result[fieldName] = getIntelligentDefault(fieldName, typedSchema, userContext);
  }

  return result;
}
