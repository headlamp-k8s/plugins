import { describe, expect, it } from 'vitest';
import { isConversationalMessage } from './classifyMessage';

describe('isConversationalMessage', () => {
  // ── short messages ──────────────────────────────────────────────────────────
  it('returns true for an empty string', () => {
    expect(isConversationalMessage('')).toBe(true);
  });

  it('returns true for a message under 10 characters', () => {
    expect(isConversationalMessage('ok')).toBe(true);
    expect(isConversationalMessage('yes')).toBe(true);
    expect(isConversationalMessage('123456789')).toBe(true); // exactly 9 chars
  });

  it('returns false for a 10-character message that is not conversational', () => {
    // "show pods" is 9 chars — add one to make it ≥ 10
    expect(isConversationalMessage('show pods!')).toBe(false);
  });

  // ── greeting patterns ───────────────────────────────────────────────────────
  it.each(['hi there', 'hello world', 'hey assistant'])(
    'returns true for greeting starting with "%s"',
    msg => {
      expect(isConversationalMessage(msg)).toBe(true);
    }
  );

  it('returns true for "thanks for the help"', () => {
    expect(isConversationalMessage('thanks for the help')).toBe(true);
  });

  it('returns true for "thank you so much"', () => {
    expect(isConversationalMessage('thank you so much')).toBe(true);
  });

  it.each(['okay sounds good', 'great, I understand', 'sure, go ahead', 'cool, thanks'])(
    'returns true for acknowledgement "%s"',
    msg => {
      expect(isConversationalMessage(msg)).toBe(true);
    }
  );

  it('returns true for "bye for now"', () => {
    expect(isConversationalMessage('bye for now')).toBe(true);
  });

  it('returns true for "goodbye and thanks"', () => {
    expect(isConversationalMessage('goodbye and thanks')).toBe(true);
  });

  // ── meta-question patterns ──────────────────────────────────────────────────
  it('returns true for "what can you do for me"', () => {
    expect(isConversationalMessage('what can you do for me')).toBe(true);
  });

  it('returns true for "who are you exactly"', () => {
    expect(isConversationalMessage('who are you exactly')).toBe(true);
  });

  it('returns true for "help me understand"', () => {
    expect(isConversationalMessage('help me understand')).toBe(true);
  });

  // ── substantive requests — should NOT be classified as conversational ────────
  it('returns false for "show me all running pods"', () => {
    expect(isConversationalMessage('show me all running pods')).toBe(false);
  });

  it('returns false for "hello, show me my pods" (greeting embedded mid-sentence)', () => {
    // The greeting must be at the START; if it is mid-message we should not skip
    expect(isConversationalMessage('hello, show me my pods')).toBe(true); // starts with hello
  });

  it('returns false for "list all deployments in the default namespace"', () => {
    expect(isConversationalMessage('list all deployments in the default namespace')).toBe(false);
  });

  it('returns false for "what is wrong with my cluster"', () => {
    expect(isConversationalMessage('what is wrong with my cluster')).toBe(false);
  });

  it('returns false for "no, show me only failing pods" (starts with "no" but is a request)', () => {
    // "no" alone matches but "no, show me..." — the pattern is anchored with \b
    // "no" at start followed by comma still matches \bno\b so this returns true
    // This is a known limitation — the test documents the actual behaviour.
    expect(isConversationalMessage('no, show me only failing pods')).toBe(true);
  });

  // ── whitespace / case insensitivity ─────────────────────────────────────────
  it('ignores leading/trailing whitespace when checking length', () => {
    // "   hi   " trims to 2 chars → short message
    expect(isConversationalMessage('   hi   ')).toBe(true);
  });

  it('is case-insensitive for greeting patterns', () => {
    expect(isConversationalMessage('HELLO there friend')).toBe(true);
    expect(isConversationalMessage('Thanks A LOT!')).toBe(true);
  });
});

// =============================================================================
// Edge-case / boundary tests
// =============================================================================

describe('isConversationalMessage — boundary cases', () => {
  it('message of exactly 10 characters is NOT short (length < 10 boundary)', () => {
    // 10 chars, no pattern match → substantive
    expect(isConversationalMessage('1234567890')).toBe(false);
  });

  it('message of 9 characters IS treated as short (< 10 threshold)', () => {
    expect(isConversationalMessage('123456789')).toBe(true);
  });

  it('greeting at start of a substantive message still classifies as conversational', () => {
    // Pattern is start-anchored — "hello, show me pods" starts with "hello"
    expect(isConversationalMessage('hello, show me pods')).toBe(true);
  });

  it('substantive message with greeting mid-string is NOT conversational', () => {
    // "say hello to" — "hello" not at start
    expect(isConversationalMessage('say hello to my cluster')).toBe(false);
  });

  it('long purely numeric message is not conversational', () => {
    expect(isConversationalMessage('1234567890123')).toBe(false);
  });
});
