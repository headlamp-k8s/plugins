/**
 * Pure helpers for merging tool calls and text content across multiple LLM
 * response generations.
 *
 * Background: The GitHub Copilot API can split a single logical response into
 * multiple "choices" / generations:
 *
 *   - Generation 0: text content, `tool_calls: []`
 *   - Generation 1+: `tool_calls` with the actual function calls
 *
 * `BaseChatModel.invoke()` only returns the first generation, so without this
 * fix tool calls would be silently lost for Copilot-backed models.
 *
 * The LangChain `handleLLMEnd` callback fires with the *full* result before
 * `invoke()` returns, giving access to all generations.
 *
 * Extracted from the duplicated logic in
 * `LangChainManager.handleDirectToolCallingRequest` and
 * `LangChainManager.handleToolEnabledRequest`.
 */

// ---------------------------------------------------------------------------
// createLLMResultCapture
// ---------------------------------------------------------------------------

/** Return type of {@link createLLMResultCapture}. */
export interface LLMResultCapture {
  /** LangChain callback object — pass in the `callbacks` option of `model.invoke`. */
  callback: { handleLLMEnd(output: unknown): void };
  /** Returns the captured `LLMResult`, or `null` if the model hasn't responded yet. */
  getResult(): unknown;
}

/**
 * Creates a lightweight LangChain callback that records the full `LLMResult`
 * emitted by `handleLLMEnd`, along with a getter to read it after `invoke`.
 *
 * Usage:
 * ```ts
 * const capture = createLLMResultCapture();
 * const response = await model.invoke(messages, { callbacks: [capture.callback] });
 * const fullResult = capture.getResult();
 * ```
 *
 * Extracted from the inline `let fullLLMResult / captureCallback` pattern that
 * was duplicated in both `handleDirectToolCallingRequest` and
 * `handleToolEnabledRequest`.
 */
export function createLLMResultCapture(): LLMResultCapture {
  let captured: unknown = null;
  return {
    callback: {
      handleLLMEnd(output: unknown) {
        captured = output;
      },
    },
    getResult() {
      return captured;
    },
  };
}

// ---------------------------------------------------------------------------
// mergeToolCallsAcrossGenerations
// ---------------------------------------------------------------------------

/**
 * Returns a (possibly extended) array of tool calls that includes entries
 * found in secondary LLM response generations.
 *
 * When `initialToolCalls` is already non-empty, or when `fullLLMResult` has no
 * multi-generation data, the original array is returned unchanged.
 *
 * Extracted from the duplicated `if (allToolCalls.length === 0 && …)` blocks.
 *
 * @param initialToolCalls - Tool calls from the primary `invoke()` response.
 * @param fullLLMResult    - The full `LLMResult` captured via `handleLLMEnd`.
 */
export function mergeToolCallsAcrossGenerations(
  initialToolCalls: unknown[],
  fullLLMResult: unknown
): unknown[] {
  if (initialToolCalls.length > 0) return initialToolCalls;

  const result = fullLLMResult as Record<string, unknown> | null | undefined;
  const generations = (result?.generations as unknown[][])?.[0];
  if (!generations?.length) return initialToolCalls;

  const merged = [...initialToolCalls];
  for (const gen of generations) {
    if (typeof gen !== 'object' || gen === null || !('message' in gen)) continue;
    const message = gen.message;
    if (
      typeof message === 'object' &&
      message !== null &&
      'tool_calls' in message &&
      Array.isArray(message.tool_calls) &&
      message.tool_calls.length > 0
    ) {
      merged.push(...message.tool_calls);
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// mergeContentAcrossGenerations
// ---------------------------------------------------------------------------

/**
 * Returns the first non-empty text content found across all LLM response
 * generations, falling back to `initialContent` when nothing better is found.
 *
 * Used to capture text that the model placed in a secondary generation while
 * the primary generation held only tool calls.
 *
 * Extracted from the content-merging loop inside
 * `handleDirectToolCallingRequest`.
 *
 * @param initialContent - Text extracted from the primary `invoke()` response.
 * @param fullLLMResult  - The full `LLMResult` captured via `handleLLMEnd`.
 * @param extractText    - The existing `extractTextContent` helper.
 */
export function mergeContentAcrossGenerations(
  initialContent: string,
  fullLLMResult: unknown,
  extractText: (content: unknown) => string
): string {
  if (initialContent) return initialContent;

  const result = fullLLMResult as Record<string, unknown> | null | undefined;
  const generations = (result?.generations as unknown[][])?.[0];
  if (!generations?.length) return initialContent;

  for (const gen of generations) {
    if (typeof gen !== 'object' || gen === null || !('message' in gen)) continue;
    const message = gen.message;
    if (
      typeof message === 'object' &&
      message !== null &&
      'content' in message &&
      message.content
    ) {
      const text = extractText(message.content);
      if (text) return text;
    }
  }
  return initialContent;
}
