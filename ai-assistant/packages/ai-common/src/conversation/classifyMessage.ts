/**
 * Pure functions that classify user messages to drive routing decisions,
 * e.g. whether to skip expensive tool-orchestration for trivial messages.
 */

/**
 * Patterns that identify messages where the user is simply making small-talk
 * or asking about the assistant itself — not requesting Kubernetes data.
 *
 * These are tested against the trimmed message and anchored only at the start.
 * A longer request beginning with a recognized greeting still matches and
 * skips orchestration.
 */
const CONVERSATIONAL_PATTERNS: RegExp[] = [
  /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure|great|cool|bye|goodbye)\b/i,
  /^(what can you do|who are you|help me)\b/i,
];

/**
 * Returns `true` when a user message is conversational / trivial and tool
 * orchestration should be skipped.
 *
 * Two conditions qualify as "conversational":
 * 1. The message is very short (< 10 characters after trimming) — e.g. "ok",
 *    "hi", "yes".
 * 2. The message starts with a recognised greeting, acknowledgement, or
 *    meta-question pattern.
 *
 * @param message - The raw user-typed message.
 * @returns Whether the message should skip tool orchestration as conversational.
 */
export function isConversationalMessage(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 10) return true;
  return CONVERSATIONAL_PATTERNS.some(p => p.test(trimmed));
}
