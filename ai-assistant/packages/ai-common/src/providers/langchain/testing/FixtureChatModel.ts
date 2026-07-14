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

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { DEMO_CLUSTER_EXPLORATION, DIAGNOSIS_FIXTURES, GENERAL_FIXTURES } from './modelFixtures.js';

/**
 * Extracts text from the message content forms used by test chat models.
 *
 * @param content - String or structured content blocks from a model message.
 * @returns Concatenated text blocks, or an empty string for unsupported content.
 */
function extractMessageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (
          item
        ): item is {
          /** Content-block discriminator. */
          type: 'text';
          /** Optional text payload. */
          text?: unknown;
        } => typeof item === 'object' && item !== null && 'type' in item && item.type === 'text'
      )
      .map(item => (typeof item.text === 'string' ? item.text : ''))
      .join('');
  }
  return '';
}

// The variable delimiters used in prompt/response templates.
// `<<varName>>` was chosen because `{{…}}` conflicts with Mustache/Handlebars/
// Go/Jinja templates that commonly appear in Kubernetes YAML or code snippets.
// Double angle brackets are extremely unlikely in natural language, bash, YAML,
// or typical code samples.
const VAR_OPEN = '<<';
const VAR_CLOSE = '>>';

/**
 * A single prompt/response pair.  Both fields support `<<variable>>`
 * placeholders for template matching and substitution.
 */
export interface FixtureEntry {
  /** Prompt template to match against user input. */
  prompt: string;
  /** Response template returned when the prompt matches. */
  response: string;
}

/**
 * An ordered conversation sequence for demo playback.
 *
 * When the model is in sequence mode it walks through each turn in order,
 * ignoring template matching — every prompt gets the next response in line.
 * This is useful for scripted demos and automated walkthroughs.
 *
 * Example:
 * ```json
 * {
 *   "name": "pod-troubleshooting-demo",
 *   "description": "Walk through diagnosing a failing Pod",
 *   "sequence": [
 *     { "prompt": "Hello", "response": "Hi! How can I help?" },
 *     { "prompt": "My pod is failing", "response": "Let me check…" },
 *     { "prompt": "What should I do?", "response": "Try restarting it." }
 *   ]
 * }
 * ```
 */
export interface FixtureSequence {
  /** Short identifier for the sequence (e.g. "pod-troubleshooting-demo"). */
  name: string;
  /** Human-readable description of what the demo covers. */
  description?: string;
  /** Ordered list of prompt/response turns to play back. */
  sequence: FixtureEntry[];
}

/**
 * A fixture file can be either:
 * - A JSON array of `FixtureEntry` (individual prompt/response pairs), or
 * - A `FixtureSequence` object (ordered conversation for demo playback).
 */
export type FixtureFile = FixtureEntry[] | FixtureSequence;

const DEFAULT_RESPONSE =
  "I'm the mock testing model. I don't have a canned response for that prompt. " +
  'Try one of the prompts from the fixtures directory.';

/**
 * Splits a fixture template into literal parts and placeholder names.
 *
 * @param template - Template containing zero or more `<<name>>` placeholders.
 * @returns Ordered literal parts and placeholder names.
 */
function parseTemplate(template: string): {
  /** Literal text segments between placeholders. */
  parts: string[];
  /** Placeholder names in template order. */
  varNames: string[];
} {
  const parts: string[] = [];
  const varNames: string[] = [];
  let remaining = template;

  while (remaining.length > 0) {
    const start = remaining.indexOf(VAR_OPEN);
    if (start === -1) {
      parts.push(remaining);
      break;
    }
    const end = remaining.indexOf(VAR_CLOSE, start + VAR_OPEN.length);
    if (end === -1) {
      parts.push(remaining);
      break;
    }
    parts.push(remaining.slice(0, start));
    varNames.push(remaining.slice(start + VAR_OPEN.length, end));
    remaining = remaining.slice(end + VAR_CLOSE.length);
  }

  return { parts, varNames };
}

/**
 * Matches `input` against a template by splitting on the literal parts and
 * extracting whatever text falls between them as variable values.
 *
 * No regex is used — just case-insensitive `indexOf` on each literal segment.
 *
 * @param input - Candidate input to match from start to end.
 * @param template - Fixture template containing optional placeholders.
 * @returns Extracted placeholder values, or `undefined` when matching fails.
 */
function matchTemplate(input: string, template: string): Record<string, string> | undefined {
  const { parts, varNames } = parseTemplate(template);

  // No variables — just do a case-insensitive exact comparison.
  if (varNames.length === 0) {
    return input.toLowerCase() === template.toLowerCase() ? {} : undefined;
  }

  const lowerInput = input.toLowerCase();
  const vars: Record<string, string> = {};
  let cursor = 0;

  for (let i = 0; i < parts.length; i++) {
    const literal = parts[i];
    if (literal.length > 0) {
      const idx = lowerInput.indexOf(literal.toLowerCase(), cursor);
      if (idx === -1) return undefined;

      // If this isn't the first part, the text between the previous cursor
      // and this literal is the value for the preceding variable.
      if (i > 0) {
        const value = input.slice(cursor, idx).trim();
        if (value.length === 0) return undefined;
        vars[varNames[i - 1]] = value;
      } else if (idx !== 0) {
        // First literal must appear at the start.
        return undefined;
      }

      cursor = idx + literal.length;
    }
  }

  // If the template ends with a variable (no trailing literal), capture
  // everything remaining.
  if (varNames.length >= parts.length) {
    const value = input.slice(cursor).trim();
    if (value.length === 0) return undefined;
    vars[varNames[varNames.length - 1]] = value;
  } else if (cursor !== input.length) {
    // Trailing text after the last literal — no match.
    return undefined;
  }

  return vars;
}

/**
 * Replaces all known `<<varName>>` tokens in a template.
 *
 * @param template - Response or prompt template containing placeholders.
 * @param vars - Replacement values keyed by placeholder name.
 * @returns Template text with known placeholders replaced and unknown ones retained.
 */
function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const token = `${VAR_OPEN}${key}${VAR_CLOSE}`;
    while (result.includes(token)) {
      result = result.replace(token, value);
    }
  }
  return result;
}

/**
 * Tries each fixture's prompt pattern against `input`.  Returns the first
 * matching response with variables substituted, or `undefined` if nothing matches.
 *
 * First attempts an exact match (the input, after trimming, must match the
 * template from start to end).  If no exact match is found, tries to find a
 * fixture whose template appears as a substring of the input — this handles
 * cases where the LLM pipeline prepends/appends system context to the user
 * message.
 *
 * @param input - User or composed prompt text to match.
 * @param fixtures - Ordered fixture entries to test in two passes.
 * @returns The first substituted response, or `undefined` when no fixture matches.
 */
function matchFixtures(input: string, fixtures: FixtureEntry[]): string | undefined {
  const trimmed = input.trim();

  // Pass 1: exact match.
  for (const entry of fixtures) {
    const vars = matchTemplate(trimmed, entry.prompt);
    if (vars) {
      return fillTemplate(entry.response, vars);
    }
  }

  // Pass 2: substring match — try to find the template pattern anywhere
  // inside the input (useful when system prompts surround the user query).
  for (const entry of fixtures) {
    const { parts } = parseTemplate(entry.prompt);
    // Only attempt substring matching for templates with at least one
    // non-empty literal part to anchor on.
    const firstLiteral = parts.find(p => p.length > 0);
    if (!firstLiteral) continue;

    const idx = trimmed.toLowerCase().indexOf(firstLiteral.toLowerCase());
    if (idx === -1) continue;

    // Extract the portion of input starting from just before the first literal
    // and try matching that substring.
    const candidate = trimmed.slice(idx);
    const vars = matchTemplate(candidate, entry.prompt);
    if (vars) {
      return fillTemplate(entry.response, vars);
    }
  }

  return undefined;
}

/**
 * Checks whether parsed JSON contains a sequence array.
 *
 * @param data - Parsed fixture-file value to inspect.
 * @returns Whether the value is a fixture sequence.
 */
function isFixtureSequence(data: unknown): data is FixtureSequence {
  return (
    typeof data === 'object' &&
    data !== null &&
    'sequence' in data &&
    Array.isArray((data as FixtureSequence).sequence)
  );
}

/**
 * Loads all `.json` fixture files from a directory (Node.js only).
 *
 * Each file may be either:
 * - A JSON array of `{ prompt, response }` objects (individual patterns), or
 * - A `{ name, sequence: [...] }` object (conversation sequence).
 *
 * Returns the individual entries and named sequences separately.
 *
 * This function requires Node.js (`fs` and `path`).  In browser contexts
 * use `getBuiltinFixtures()` or pass `extraFixtures` / `extraSequences` instead.
 *
 * @param dir - Directory containing JSON fixture files.
 * @returns Individual entries and named sequences; both arrays are empty when absent.
 */
export function loadFixturesFromDirectory(dir: string): {
  /** Prompt/response entries loaded from array files. */
  entries: FixtureEntry[];
  /** Named conversation sequences loaded from object files. */
  sequences: FixtureSequence[];
} {
  // Lazy-require fs and path so this module can be imported in browsers
  // without crashing — the function simply won't work if called there.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path');

  const entries: FixtureEntry[] = [];
  const sequences: FixtureSequence[] = [];

  if (!fs.existsSync(dir)) {
    return { entries, sequences };
  }

  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.json')) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    if (isFixtureSequence(parsed)) {
      sequences.push(parsed);
    } else if (Array.isArray(parsed)) {
      entries.push(...(parsed as FixtureEntry[]));
    }
  }

  return { entries, sequences };
}

/**
 * Returns the built-in fixtures shipped with the library.
 * Works in both Node.js and browser environments (fixtures are statically embedded).
 *
 * @returns Embedded prompt/response entries and named sequences.
 */
export function getBuiltinFixtures(): {
  /** General and diagnosis prompt/response entries. */
  entries: FixtureEntry[];
  /** Embedded named conversation sequences. */
  sequences: FixtureSequence[];
} {
  return {
    entries: [...GENERAL_FIXTURES, ...DIAGNOSIS_FIXTURES],
    sequences: [DEMO_CLUSTER_EXPLORATION],
  };
}

/**
 * Options for creating a mock testing model.
 */
export interface FixtureChatModelOptions {
  /** Extra fixture entries to match against (checked *before* built-in fixtures). */
  extraFixtures?: FixtureEntry[];
  /**
   * Path to a directory of additional `.json` fixture files.
   * Checked after `extraFixtures` but before built-in fixtures.
   */
  fixturesDir?: string;
  /** Response returned when no fixture matches.  Defaults to a generic message. */
  fallbackResponse?: string;
  /**
   * Name of a conversation sequence to play back.  When set, the model
   * ignores template matching and returns each response in the named
   * sequence in order.  After the last turn it wraps around to the start.
   *
   * Sequences can come from built-in fixtures, `fixturesDir`, or
   * `extraSequences`.
   */
  sequenceName?: string;
  /** Extra named sequences available for playback. */
  extraSequences?: FixtureSequence[];
}

/**
 * Creates a `BaseChatModel` that returns canned responses from fixture files.
 *
 * ### Template matching mode (default)
 *
 * Prompt patterns support `<<variable>>` placeholders that capture parts of
 * the user input and substitute them into the response template:
 *
 * ```
 * Fixture:  { "prompt": "What is a <<resource>>?",
 *             "response": "A **<<resource>>** is …" }
 * Input:    "What is a Pod?"
 * Output:   "A **Pod** is …"
 * ```
 *
 * Fixture search order:
 * 1. `extraFixtures` (if provided)
 * 2. Files from `fixturesDir` (if provided)
 * 3. Statically embedded built-in fixtures
 *
 * If nothing matches, `fallbackResponse` (or a default message) is returned.
 *
 * ### Sequence playback mode
 *
 * When `sequenceName` is set, the model plays back a named conversation
 * sequence in order — each call returns the next response regardless of
 * what prompt was sent.  This is useful for scripted demos:
 *
 * ```json
 * { "name": "intro-demo",
 *   "description": "Quick intro walkthrough",
 *   "sequence": [
 *     { "prompt": "Hello",           "response": "Hi! …" },
 *     { "prompt": "What is a Pod?",  "response": "A Pod is …" }
 *   ] }
 * ```
 *
 * The sequence wraps around after the last turn.
 *
 * @param options - Extra fixtures, fixture directory, fallback, and sequence settings.
 * @returns A LangChain-compatible model using template matching or sequence playback.
 */
export function createFixtureChatModel(options: FixtureChatModelOptions = {}): BaseChatModel {
  const builtin = getBuiltinFixtures();
  const extra = options.fixturesDir
    ? loadFixturesFromDirectory(options.fixturesDir)
    : { entries: [], sequences: [] };

  const allFixtures: FixtureEntry[] = [
    ...(options.extraFixtures ?? []),
    ...extra.entries,
    ...builtin.entries,
  ];

  const allSequences: FixtureSequence[] = [
    ...(options.extraSequences ?? []),
    ...extra.sequences,
    ...builtin.sequences,
  ];

  const fallback = options.fallbackResponse ?? DEFAULT_RESPONSE;

  // If a sequence is requested, find it and set up ordered playback.
  let sequenceTurns: FixtureEntry[] | undefined;
  let sequenceIndex = 0;
  if (options.sequenceName) {
    const seq = allSequences.find(s => s.name === options.sequenceName);
    if (seq && seq.sequence.length > 0) {
      sequenceTurns = seq.sequence;
    }
  }

  // We subclass FakeListChatModel to override _generate with fixture matching.
  // This is necessary because FakeListChatModel.bindTools() creates a NEW
  // FakeListChatModel instance (losing monkey-patched overrides), but it
  // copies `responses` and `i` from the original — so we update those
  // *inside* _generate before delegating.
  //
  // However, since bindTools creates a plain FakeListChatModel (not our
  // subclass), we must instead directly patch the responses list on each
  // call.  The trick: we store the matching logic in a closure, override
  // `_generate` on the instance, and also override `bindTools` to carry
  // the override forward to the new instance.
  const model = new FakeListChatModel({ responses: [fallback] });

  /**
   * Installs fixture matching while preserving fake-model method contracts.
   *
   * The model is modified in place, and bound child models receive the same
   * matching patch.
   *
   * @param patchedModel - Fake model instance to patch.
   * @returns No value.
   */
  function patchGenerate(patchedModel: FakeListChatModel): void {
    const prototype = Object.getPrototypeOf(patchedModel) as FakeListChatModel;
    const superGenerate = prototype._generate.bind(patchedModel);
    patchedModel._generate = async function (messages, options, runManager) {
      let matched: string;

      if (sequenceTurns) {
        matched = sequenceTurns[sequenceIndex % sequenceTurns.length].response;
        sequenceIndex++;
      } else {
        const lastHuman = [...messages].reverse().find(message => message._getType() === 'human');
        const input = extractMessageText(lastHuman?.content);

        matched = matchFixtures(input, allFixtures) ?? fallback;
      }

      patchedModel.responses = [matched];
      patchedModel.i = 0;

      return superGenerate(messages, options, runManager);
    };

    // Override bindTools so the patch survives tool-binding.
    const origBindTools = patchedModel.bindTools.bind(patchedModel);
    patchedModel.bindTools = function (...args) {
      const result = origBindTools(...args);
      // result is a RunnableBinding wrapping a new FakeListChatModel.
      // Patch the inner model (result.bound).
      if (
        typeof result === 'object' &&
        result !== null &&
        'bound' in result &&
        result.bound instanceof FakeListChatModel
      ) {
        patchGenerate(result.bound);
      }
      return result;
    };
  }

  patchGenerate(model);

  return model as BaseChatModel;
}

/**
 * Lists available conversation sequences from built-in and custom fixtures.
 * Useful for CLI/UI to let users pick a demo to play back.
 *
 * @param fixturesDir - Optional directory containing fixture sequence files.
 * @param extraSequences - Optional sequences listed before directory and built-ins.
 * @returns Sequence names, optional descriptions, and turn counts in priority order.
 */
export function listAvailableSequences(
  fixturesDir?: string,
  extraSequences?: FixtureSequence[]
): Array<{
  /** Stable sequence identifier. */
  name: string;
  /** Optional sequence summary. */
  description?: string;
  /** Number of turns in the sequence. */
  turns: number;
}> {
  const builtin = getBuiltinFixtures();
  const extra = fixturesDir
    ? loadFixturesFromDirectory(fixturesDir)
    : { entries: [], sequences: [] };

  const all = [...(extraSequences ?? []), ...extra.sequences, ...builtin.sequences];

  return all.map(s => ({
    name: s.name,
    description: s.description,
    turns: s.sequence.length,
  }));
}

// Re-export helpers for testing convenience.
export { matchFixtures, matchTemplate, parseTemplate, fillTemplate };
