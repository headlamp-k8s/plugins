/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Maps raw JavaScript/API errors to concise, user-facing messages.
 *
 * Pattern-matches against the error message string; falls back to stripping
 * standard prefixes (Error:, TypeError:, …) from the original message.
 */

interface ErrorMapping {
  /** Pattern matched against the raw error message. */
  pattern: RegExp;
  /** User-facing message returned when the pattern matches. */
  message: string;
}

const ERROR_MAPPINGS: ErrorMapping[] = [
  {
    pattern: /network.*error|fetch.*failed|connection.*refused/i,
    message: 'Network connection error. Please check your internet connection and try again.',
  },
  {
    pattern: /timeout|timed out/i,
    message: 'Request timed out. The operation took too long to complete.',
  },
  { pattern: /unauthorized|401/i, message: 'Authentication error. Please check your credentials.' },
  {
    pattern: /forbidden|403/i,
    message: 'Access denied. You may not have permission for this operation.',
  },
  { pattern: /not found|404/i, message: 'The requested resource was not found.' },
  { pattern: /rate limit|429/i, message: 'Too many requests. Please wait a moment and try again.' },
  { pattern: /internal server error|500/i, message: 'Server error. Please try again later.' },
  { pattern: /bad gateway|502/i, message: 'Gateway error. The server is temporarily unavailable.' },
  {
    pattern: /service unavailable|503/i,
    message: 'Service temporarily unavailable. Please try again later.',
  },
  {
    pattern: /gateway timeout|504/i,
    message: 'Gateway timeout. The request took too long to process.',
  },
  {
    pattern: /parse|json/i,
    message: 'Data format error. The response was not in the expected format.',
  },
  { pattern: /abort|cancel/i, message: 'Operation was cancelled.' },
];

/**
 * Converts a raw `Error` (or any thrown value) to a short, human-readable
 * string suitable for display in the chat UI.
 *
 * Order of resolution:
 * 1. Null / undefined → generic fallback.
 * 2. Pattern match against `ERROR_MAPPINGS`.
 * 3. Strip common exception-type prefixes from `error.message`.
 * 4. Generic fallback if the message is empty after stripping.
 *
 * @param error - Error object or other thrown value to make safe for display.
 * @returns A mapped, cleaned, or fallback user-facing error message.
 */
export function toUserFriendlyError(error: unknown): string {
  if (!error) return 'Unknown error occurred';

  const errorMessage = error instanceof Error ? error.message : String(error);

  for (const { pattern, message } of ERROR_MAPPINGS) {
    if (pattern.test(errorMessage)) return message;
  }

  const clean = errorMessage
    .replace(/^(?:Error|TypeError|ReferenceError|SyntaxError):\s*/i, '')
    .trim();

  return clean || 'An unexpected error occurred. Please try again.';
}

/**
 * Returns `true` when an error's message suggests it originated from a network
 * or API call (as opposed to a logic / validation error).
 *
 * Used by `LangChainAssistantSession.handleUserSendError` to decide whether to invoke
 * the specialised API-error prompt template or fall back to the generic handler.
 *
 * Accepts any thrown value — `null`/`undefined` returns `false`.
 *
 * @param error - Error object, string, or other thrown value to classify.
 * @returns Whether the error message contains a known API or network keyword.
 */
export function isApiRelatedError(error: unknown): boolean {
  const message: string =
    error instanceof Error ? error.message ?? '' : typeof error === 'string' ? error : '';

  const lower = message.toLowerCase();
  return (
    lower.includes('api') ||
    lower.includes('request') ||
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout')
  );
}
