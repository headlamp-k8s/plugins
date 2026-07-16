/**
 * Pure helpers for tool orchestration, approval filtering, caching, and error
 * responses.
 */

import type { ConversationMessage as Prompt } from '../../conversation/types';
import type { RecommendedTool } from '../langchain/ToolPlanner';

// ---------------------------------------------------------------------------
// shouldCacheResponse
// ---------------------------------------------------------------------------

/**
 * Returns `true` when a completed assistant response should be written to the
 * in-memory response cache.
 *
 * Responses that contain tool calls are never cached because they depend on
 * live cluster state and must be re-fetched on every request.
 *
 * @param response - Completed assistant response to inspect.
 * @returns Whether the response is independent of live tool execution.
 */
export function shouldCacheResponse(response: Prompt): boolean {
  return !response.toolCalls || response.toolCalls.length === 0;
}

// ---------------------------------------------------------------------------
// filterApprovedOrchestrationTools
// ---------------------------------------------------------------------------

/** Shape of a prepared orchestration tool entry (before approval). */
export interface PreparedOrchestrationTool {
  /** Orchestration identifier used by approval responses. */
  id: string;
  /** Tool identifier recommended for execution. */
  name: string;
  /** Optional arguments prepared for the tool. */
  arguments?: Record<string, unknown>;
  /** Additional planner metadata retained through approval. */
  [key: string]: unknown;
}

/**
 * Filters `recommendedTools` to only those whose orchestration ID was included
 * in `approvedIds`.
 *
 * Orchestration IDs have the form `orchestrated-<toolName>-<timestamp>`, so
 * the match uses `id.startsWith('orchestrated-<toolName>-')` as well as an
 * exact `id === toolName` fallback for built-in tools that were auto-approved
 * by name.
 *
 * @param recommendedTools   - The full list of recommended tools from the orchestrator.
 * @param approvedIds        - IDs (or tool names) that the user approved.
 * @returns Recommended tools whose name or orchestration prefix was approved.
 */
export function filterApprovedOrchestrationTools(
  recommendedTools: RecommendedTool[],
  approvedIds: string[]
): RecommendedTool[] {
  return recommendedTools.filter(tool => {
    const prefix = `orchestrated-${tool.name}-`;
    return approvedIds.some(id => id === tool.name || id.startsWith(prefix));
  });
}

// ---------------------------------------------------------------------------
// buildOrchestrationToolError
// ---------------------------------------------------------------------------

/**
 * Builds the error-result object stored in `toolResults` when a single tool
 * in an orchestrated execution batch throws.
 *
 * The returned object is stored under the tool name key and later passed to
 * `formatToolResultsForLLM` / `generateResponseFromToolResults`.
 *
 * @param toolName - Name of the tool that failed.
 * @param error    - The caught error (may be `null`/`undefined` in some JS runtimes).
 * @returns A structured failed-result payload for the tool.
 */
export function buildOrchestrationToolError(
  toolName: string,
  error: Error | null | undefined
): {
  /** Constant error flag consumed by result formatting. */
  error: true;
  /** Human-readable tool failure message. */
  message: string;
} {
  return {
    error: true,
    message: `Failed to execute ${toolName}: ${error?.message ?? 'Unknown error'}`,
  };
}

// ---------------------------------------------------------------------------
// buildMultiToolErrorPrompt
// ---------------------------------------------------------------------------

/**
 * Builds the fallback assistant message returned when multi-tool coordination
 * throws an unexpected error.
 *
 * @param error - The caught error.
 * @returns An assistant error message that asks the user to retry or simplify.
 */
export function buildMultiToolErrorPrompt(error: Error | null | undefined): Prompt {
  return {
    role: 'assistant',
    content: `I encountered an error coordinating multiple tools: ${
      error?.message ?? 'Unknown error'
    }.\n\nPlease try your request again or ask a simpler question.`,
    error: true,
  };
}
