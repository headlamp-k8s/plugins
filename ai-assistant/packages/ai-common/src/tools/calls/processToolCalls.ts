/**
 * Pure helpers for normalising, filtering, and routing model tool calls.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** LLM tool-call after normalisation to the standard function-call shape. */
export interface NormalizedToolCall {
  /** Stored tool-call discriminator. */
  type: 'function';
  /** Model-generated call identifier, possibly empty when omitted. */
  id: string;
  /** Normalized model function payload. */
  function: {
    /** Registered tool name requested by the model. */
    name: string;
    /** JSON-serialised argument object. */
    arguments: string;
  };
}

/** Minimal prompt shape needed by the follow-up decision helper. */
export interface ToolResponsePrompt {
  /** Conversation role, expected to be `tool` at call sites. */
  role: string;
  /** Raw tool response content inspected for follow-up policy. */
  content: string;
  /** Identifier linking the response to its model tool call. */
  toolCallId?: string;
}

/** Minimal tool-call shape accepted from LangChain model responses. */
interface RawToolCall {
  /** Model-supplied call identifier; absent IDs normalize to an empty string. */
  id?: string;
  /** Registered tool name requested by the model. */
  name: string;
  /** Unvalidated arguments supplied by the model. */
  args?: unknown;
}

// ---------------------------------------------------------------------------
// normalizeLLMToolCalls
// ---------------------------------------------------------------------------

/**
 * Converts the raw tool-call objects returned by the LangChain model into the
 * canonical `{ type, id, function: { name, arguments } }` format used
 * throughout the codebase.
 *
 * `tc.args` (object) is JSON-serialised; an absent `tc.args` is treated as an
 * empty object.
 *
 * @param toolCalls - Raw tool-call entries from the model response.
 * @returns Valid calls normalized for conversation history, preserving order.
 */
export function normalizeLLMToolCalls(toolCalls: unknown[]): NormalizedToolCall[] {
  return toolCalls.flatMap(toolCall => {
    if (
      typeof toolCall !== 'object' ||
      toolCall === null ||
      !('name' in toolCall) ||
      typeof toolCall.name !== 'string'
    ) {
      return [];
    }
    const raw = toolCall as RawToolCall;
    return [
      {
        type: 'function' as const,
        id: raw.id ?? '',
        function: {
          name: raw.name,
          arguments: JSON.stringify(raw.args || {}),
        },
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// filterToolCallsByEnabled
// ---------------------------------------------------------------------------

/**
 * Splits a list of normalised tool calls into enabled and disabled buckets.
 *
 * @param allToolCalls  - All tool calls from the model response.
 * @param enabledIds    - Tool names that are currently turned on.
 * @returns `{ enabled, disabled }` — both arrays preserve original order.
 */
export function filterToolCallsByEnabled(
  allToolCalls: NormalizedToolCall[],
  enabledIds: string[]
): {
  /** Calls whose function names appear in the enabled identifier list. */
  enabled: NormalizedToolCall[];
  /** Calls whose function names do not appear in the enabled identifier list. */
  disabled: NormalizedToolCall[];
} {
  const enabled = allToolCalls.filter(tc => enabledIds.includes(tc.function.name));
  const disabled = allToolCalls.filter(tc => !enabledIds.includes(tc.function.name));
  return { enabled, disabled };
}

// ---------------------------------------------------------------------------
// buildDisabledToolsMessage
// ---------------------------------------------------------------------------

/**
 * Builds the user-facing explanation shown when every tool call in a model
 * response targets a tool that is currently disabled in settings.
 *
 * Returns a ready-to-display markdown string.
 *
 * @param toolNames - Display names of the disabled tools (already joined or
 *                    an array — both are accepted).
 * @returns Markdown instructions for enabling the required tool or tools.
 */
export function buildDisabledToolsMessage(toolNames: string | string[]): string {
  const nameStr = Array.isArray(toolNames) ? toolNames.join(', ') : toolNames;
  const isSingle = !Array.isArray(toolNames) || toolNames.length <= 1;
  const toolWord = isSingle ? 'tool' : 'tools';
  return `I understand you're asking for cluster data, but I cannot access live Kubernetes information because the required tools (${nameStr}) are currently disabled in your settings.

To get real-time cluster data, you'll need to:
1. Go to AI Assistant settings
2. Enable the "${nameStr}" ${toolWord}
3. Ask your question again

Without access to the Kubernetes API, I cannot fetch current pod, deployment, service, or other resource information from your cluster.`;
}

// ---------------------------------------------------------------------------
// shouldProcessToolFollowUp
// ---------------------------------------------------------------------------

/**
 * Determines whether the assistant should trigger a follow-up model call after
 * tool execution completes.
 *
 * Rules:
 * - Returns `false` when there are no tool responses (empty `.every()` would
 *   be `true`, which is the bug this guard prevents).
 * - Returns `false` when any tool response's JSON payload explicitly sets
 *   `shouldProcessFollowUp: false` (e.g. confirmation-pending operations).
 * - Returns `true` otherwise (at least one response with no explicit opt-out).
 *
 * @param toolResponses - History entries whose `role === 'tool'` and whose
 *                        `toolCallId` matches one of the executed calls.
 * @returns Whether at least one response exists and none explicitly opts out.
 */
export function shouldProcessToolFollowUp(toolResponses: ToolResponsePrompt[]): boolean {
  if (toolResponses.length === 0) return false;
  return toolResponses.every(response => {
    try {
      const parsed = JSON.parse(response.content);
      return parsed.shouldProcessFollowUp !== false;
    } catch {
      return true; // Non-JSON content → default to processing follow-up
    }
  });
}

// ---------------------------------------------------------------------------
// mergeApprovedArguments
// ---------------------------------------------------------------------------

/**
 * Applies the processed / approved arguments from the approval flow back into
 * the original normalised tool calls.
 *
 * When approval data is found for a call (matched by `id`), the
 * `function.arguments` string is replaced with the serialised approved args.
 * Calls without a matching approval entry are returned unchanged.
 *
 * @param toolCalls    - Enabled tool calls to update.
 * @param approvalData - Approval records keyed to calls by `id`.
 * @param approvedIds  - IDs of calls the user approved.
 * @returns Approved calls with processed arguments applied when available.
 */
export function mergeApprovedArguments(
  toolCalls: NormalizedToolCall[],
  approvalData: Array<{
    /** Tool-call identifier associated with the approval record. */
    id: string;
    /** Processed arguments approved for execution. */
    arguments: Record<string, unknown>;
  }>,
  approvedIds: string[]
): NormalizedToolCall[] {
  return toolCalls
    .filter(tc => approvedIds.includes(tc.id))
    .map(tc => {
      const approval = approvalData.find(a => a.id === tc.id);
      if (!approval) return tc;
      return {
        ...tc,
        function: {
          ...tc.function,
          arguments: JSON.stringify(approval.arguments),
        },
      };
    });
}
