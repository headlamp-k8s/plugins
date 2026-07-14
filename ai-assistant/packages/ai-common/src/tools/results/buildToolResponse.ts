/**
 * Pure helpers for building tool-response payloads and formatting fallback
 * content when the model returns an empty answer after tool execution.
 */

// ---------------------------------------------------------------------------
// detectToolResponseError
// ---------------------------------------------------------------------------

/**
 * Inspects a raw tool-response content string to determine whether it
 * represents an error.
 *
 * Two strategies are tried in order:
 * 1. JSON parse → check for `{ error: true }`.
 * 2. Text heuristic → check whether the lower-cased string contains the
 *    words "error" or "failed".
 *
 * Returns `isError: false` when the content is a successful result.
 *
 * @param content - Raw tool-response content to inspect.
 * @returns Error classification and an optional extracted error message.
 */
export function detectToolResponseError(content: string): {
  /** Whether JSON or text heuristics classify the response as an error. */
  isError: boolean;
  /** Extracted error message, or `null` for a successful response. */
  errorMsg: string | null;
} {
  try {
    const parsed = JSON.parse(content);
    if (parsed.error === true) {
      return { isError: true, errorMsg: parsed.message ?? 'Unknown error' };
    }
    return { isError: false, errorMsg: null };
  } catch {
    const lower = content.toLowerCase();
    if (lower.includes('error') || lower.includes('failed')) {
      return { isError: true, errorMsg: content };
    }
    return { isError: false, errorMsg: null };
  }
}

// ---------------------------------------------------------------------------
// buildToolExecutionErrorJson
// ---------------------------------------------------------------------------

/**
 * Builds the JSON string stored in chat history when a tool call throws an
 * unexpected exception during execution.
 *
 * The result is suitable for pushing directly to `history` as a `role: 'tool'`
 * message.
 *
 * @param toolName     - Name of the tool that failed.
 * @param errorMessage - The error's `.message`, or a fallback string.
 * @param args         - Arguments that were passed to the tool (included for
 *                       debugging context).
 * @returns Serialized error details suitable for a tool history message.
 */
export function buildToolExecutionErrorJson(
  toolName: string,
  errorMessage: string,
  args: unknown
): string {
  return JSON.stringify({
    error: true,
    message: errorMessage,
    toolName,
    request: args,
    userFriendlyMessage: `Failed to execute ${toolName}: ${errorMessage}`,
  });
}

// ---------------------------------------------------------------------------
// buildConfirmationPlaceholderJson
// ---------------------------------------------------------------------------

/**
 * Builds the JSON string used as a `role: 'tool'` placeholder when a tool
 * requires user confirmation before it can be executed (e.g. PUT/PATCH/DELETE).
 *
 * This placeholder keeps `validateToolCallAlignment` happy without exposing
 * the pending confirmation state to the LLM or the UI.
 *
 * @param method - Optional HTTP method name (e.g. `"PUT"`) included in the
 *                 human-readable message.
 * @returns Serialized pending-confirmation placeholder content.
 */
export function buildConfirmationPlaceholderJson(method?: string): string {
  return JSON.stringify({
    status: 'pending_confirmation',
    shouldProcessFollowUp: false,
    message: method
      ? `${method} request requires user confirmation.`
      : 'Operation requires user confirmation.',
  });
}

// ---------------------------------------------------------------------------
// buildFailedOperationsFallback
// ---------------------------------------------------------------------------

/**
 * Builds the fallback system-message content used when the tool-failure prompt
 * template is unavailable or throws.
 *
 * The returned string is a plain-text system message that instructs the LLM to
 * clearly communicate the failures to the user.
 *
 * @param operations - Human-readable descriptions of each failed operation,
 *                     e.g. `["kubernetes_api_request: 404 not found"]`.
 * @returns System instructions that require prominent, actionable error reporting.
 */
export function buildFailedOperationsFallback(operations: string[]): string {
  return `CRITICAL: The following operations failed and must be reported to the user:

${operations.map(op => `- ${op}`).join('\n')}

You MUST:
1. Clearly inform the user that these operations failed
2. Explain what went wrong in simple terms  
3. Provide specific next steps or alternatives
4. Do not ignore or minimize these errors

Format your response to make the errors prominent and actionable.`;
}

// ---------------------------------------------------------------------------
// formatToolResponseContent
// ---------------------------------------------------------------------------

/**
 * Converts a raw tool-response content string into a display-friendly string.
 *
 * Priority order:
 * 1. `{ formatted: true, mcpOutput: … }` — returned as-is (pre-formatted).
 * 2. `{ error: true, message }` — prefixed with `"Error: "`.
 * 3. `{ userFriendlyMessage }` — returned directly.
 * 4. Any other JSON object — pretty-printed with `JSON.stringify(…, null, 2)`.
 * 5. Non-JSON text — trimmed and returned as-is.
 *
 * @param content - Raw serialized or plain-text tool response.
 * @returns Preformatted, user-friendly, pretty-printed, or trimmed response text.
 */
export function formatToolResponseContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (parsed.formatted && parsed.mcpOutput) {
      return content; // pre-formatted MCP output — pass through unchanged
    }
    if (parsed.error) {
      return `Error: ${parsed.message ?? 'Tool execution failed'}`;
    }
    if (parsed.userFriendlyMessage) {
      return parsed.userFriendlyMessage as string;
    }
    if (typeof parsed === 'object') {
      return JSON.stringify(parsed, null, 2);
    }
    return String(parsed);
  } catch {
    return content.toString().trim();
  }
}

// ---------------------------------------------------------------------------
// assembleFallbackResponseContent
// ---------------------------------------------------------------------------

/**
 * Assembles a readable fallback response string from one or more tool
 * responses.
 *
 * When there is exactly one response, only its content is returned (no tool
 * name prefix). When there are multiple responses each section is prefixed with
 * the tool name followed by a colon, and sections are separated by a blank line.
 *
 * Each response's content is run through `formatToolResponseContent` first.
 *
 * @param responses - Ordered list of tool-response objects from chat history.
 * @returns Empty text, one formatted response, or named response sections.
 */
export function assembleFallbackResponseContent(
  responses: Array<{
    /** Optional tool name used to label multi-response sections. */
    name?: string;
    /** Raw tool response content to format. */
    content: string;
  }>
): string {
  if (responses.length === 0) return '';

  const formatted = responses.map(r => ({
    name: r.name ?? 'tool',
    text: formatToolResponseContent(r.content),
  }));

  if (formatted.length === 1) {
    return formatted[0].text.trim();
  }

  return formatted
    .map(r => `${r.name}: ${r.text}`)
    .join('\n\n')
    .trim();
}
