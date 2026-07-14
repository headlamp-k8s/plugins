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

import { HumanMessage } from '@langchain/core/messages';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import {
  createFixtureChatModel,
  fillTemplate,
  getBuiltinFixtures,
  listAvailableSequences,
  matchFixtures,
  matchTemplate,
  parseTemplate,
} from './FixtureChatModel';

describe('MockTestingModel module boundaries', () => {
  it('does not depend on later chat-history modules', () => {
    const source = readFileSync(resolve(__dirname, 'FixtureChatModel.ts'), 'utf8');
    expect(source).not.toContain('../langchain/chatHistory');
  });
});

// ─── parseTemplate ──────────────────────────────────────────────────────────

describe('parseTemplate', () => {
  it('returns the whole string as one part when no variables', () => {
    const { parts, varNames } = parseTemplate('Hello world');
    expect(parts).toEqual(['Hello world']);
    expect(varNames).toEqual([]);
  });

  it('splits around a single variable', () => {
    const { parts, varNames } = parseTemplate('What is a <<resource>>?');
    expect(parts).toEqual(['What is a ', '?']);
    expect(varNames).toEqual(['resource']);
  });

  it('handles multiple variables', () => {
    const { parts, varNames } = parseTemplate('Delete <<resource>> <<name>> in <<ns>>');
    expect(parts).toEqual(['Delete ', ' ', ' in ']);
    expect(varNames).toEqual(['resource', 'name', 'ns']);
  });

  it('handles a template that starts with a variable', () => {
    const { parts, varNames } = parseTemplate('<<greeting>> friend');
    expect(parts).toEqual(['', ' friend']);
    expect(varNames).toEqual(['greeting']);
  });

  it('handles a template that ends with a variable', () => {
    const { parts, varNames } = parseTemplate('Show me <<thing>>');
    expect(parts).toEqual(['Show me ']);
    expect(varNames).toEqual(['thing']);
  });
});

// ─── matchTemplate ──────────────────────────────────────────────────────────

describe('matchTemplate', () => {
  it('exact match with no variables', () => {
    expect(matchTemplate('Hello', 'Hello')).toEqual({});
  });

  it('case-insensitive exact match', () => {
    expect(matchTemplate('hello', 'Hello')).toEqual({});
  });

  it('returns undefined on mismatch with no variables', () => {
    expect(matchTemplate('Goodbye', 'Hello')).toBeUndefined();
  });

  it('captures a single variable', () => {
    expect(matchTemplate('What is a Pod?', 'What is a <<resource>>?')).toEqual({
      resource: 'Pod',
    });
  });

  it('captures multiple variables', () => {
    expect(
      matchTemplate('Delete service my-svc in production', 'Delete <<resource>> <<name>> in <<ns>>')
    ).toEqual({ resource: 'service', name: 'my-svc', ns: 'production' });
  });

  it('is case-insensitive for literal parts', () => {
    expect(matchTemplate('WHAT IS A Deployment?', 'What is a <<resource>>?')).toEqual({
      resource: 'Deployment',
    });
  });

  it('returns undefined when a literal part is missing', () => {
    expect(matchTemplate('Tell me about a Pod', 'What is a <<resource>>?')).toBeUndefined();
  });

  it('returns undefined when variable would be empty', () => {
    expect(matchTemplate('What is a ?', 'What is a <<resource>>?')).toBeUndefined();
  });

  it('captures variable at the end (no trailing literal)', () => {
    expect(matchTemplate('Show me the pods', 'Show me <<thing>>')).toEqual({
      thing: 'the pods',
    });
  });

  it('captures variable at the start (no leading literal)', () => {
    expect(matchTemplate('Hey friend', '<<greeting>> friend')).toEqual({
      greeting: 'Hey',
    });
  });
});

// ─── fillTemplate ───────────────────────────────────────────────────────────

describe('fillTemplate', () => {
  it('substitutes a single variable', () => {
    expect(fillTemplate('A <<resource>> is cool', { resource: 'Pod' })).toBe('A Pod is cool');
  });

  it('substitutes multiple occurrences of the same variable', () => {
    expect(fillTemplate('<<x>> and <<x>> again', { x: 'hello' })).toBe('hello and hello again');
  });

  it('substitutes multiple different variables', () => {
    expect(fillTemplate('<<a>> meets <<b>>', { a: 'Alice', b: 'Bob' })).toBe('Alice meets Bob');
  });

  it('leaves unknown variables unchanged', () => {
    expect(fillTemplate('<<known>> and <<unknown>>', { known: 'yes' })).toBe('yes and <<unknown>>');
  });
});

// ─── matchFixtures ──────────────────────────────────────────────────────────

describe('matchFixtures', () => {
  const fixtures = [
    { prompt: 'Hello', response: 'Hi there!' },
    {
      prompt: 'What is a <<resource>>?',
      response: 'A <<resource>> is a K8s resource.',
    },
    {
      prompt: 'Scale <<name>> to <<count>> replicas',
      response: 'Scaling <<name>> to <<count>>.',
    },
  ];

  it('matches a literal fixture', () => {
    expect(matchFixtures('Hello', fixtures)).toBe('Hi there!');
  });

  it('matches a template fixture and substitutes variables', () => {
    expect(matchFixtures('What is a Service?', fixtures)).toBe('A Service is a K8s resource.');
  });

  it('matches multiple variables', () => {
    expect(matchFixtures('Scale nginx to 5 replicas', fixtures)).toBe('Scaling nginx to 5.');
  });

  it('returns undefined when nothing matches', () => {
    expect(matchFixtures('Something random', fixtures)).toBeUndefined();
  });

  it('trims whitespace from input', () => {
    expect(matchFixtures('  Hello  ', fixtures)).toBe('Hi there!');
  });
});

// ─── Built-in fixtures ──────────────────────────────────────────────────────

describe('getBuiltinFixtures', () => {
  it('loads entries and sequences from the fixtures directory', () => {
    const { entries, sequences } = getBuiltinFixtures();
    expect(entries.length).toBeGreaterThan(0);
    expect(sequences.length).toBeGreaterThan(0);
  });

  it('entries have prompt and response fields', () => {
    const { entries } = getBuiltinFixtures();
    for (const entry of entries) {
      expect(entry).toHaveProperty('prompt');
      expect(entry).toHaveProperty('response');
      expect(typeof entry.prompt).toBe('string');
      expect(typeof entry.response).toBe('string');
    }
  });

  it('sequences have name and sequence fields', () => {
    const { sequences } = getBuiltinFixtures();
    for (const seq of sequences) {
      expect(seq).toHaveProperty('name');
      expect(seq).toHaveProperty('sequence');
      expect(Array.isArray(seq.sequence)).toBe(true);
      expect(seq.sequence.length).toBeGreaterThan(0);
    }
  });
});

// ─── listAvailableSequences ─────────────────────────────────────────────────

describe('listAvailableSequences', () => {
  it('returns at least the built-in demo sequence', () => {
    const seqs = listAvailableSequences();
    expect(seqs.length).toBeGreaterThan(0);

    const demo = seqs.find(s => s.name === 'cluster-exploration-demo');
    expect(demo).toBeDefined();
    expect(demo!.turns).toBeGreaterThan(0);
  });
});

// ─── createFixtureChatModel ─────────────────────────────────────────────────

describe('createFixtureChatModel', () => {
  it('returns a model that matches built-in fixtures', async () => {
    const model = createFixtureChatModel();
    const result = await model.invoke([new HumanMessage('Hello')]);
    expect(typeof result.content).toBe('string');
    expect((result.content as string).length).toBeGreaterThan(0);
    expect(result.content).toContain('Headlamp AI assistant');
  });

  it('substitutes template variables in responses', async () => {
    const model = createFixtureChatModel();
    const result = await model.invoke([new HumanMessage('What is a ConfigMap?')]);
    expect(result.content).toContain('ConfigMap');
  });

  it('returns fallback for unmatched prompts', async () => {
    const model = createFixtureChatModel({
      fallbackResponse: 'No match found.',
    });
    const result = await model.invoke([new HumanMessage('Tell me about quantum computing')]);
    expect(result.content).toBe('No match found.');
  });

  it('uses extraFixtures before built-ins', async () => {
    const model = createFixtureChatModel({
      extraFixtures: [{ prompt: 'Hello', response: 'Custom hello!' }],
    });
    const result = await model.invoke([new HumanMessage('Hello')]);
    expect(result.content).toBe('Custom hello!');
  });

  it('plays back a sequence in order', async () => {
    const model = createFixtureChatModel({
      sequenceName: 'cluster-exploration-demo',
    });

    const r1 = await model.invoke([new HumanMessage('anything')]);
    expect(r1.content).toContain('Headlamp AI assistant');

    const r2 = await model.invoke([new HumanMessage('still anything')]);
    expect(r2.content).toContain('node');
  });

  it('wraps around after the last sequence turn', async () => {
    const model = createFixtureChatModel({
      extraSequences: [
        {
          name: 'tiny',
          sequence: [
            { prompt: 'a', response: 'first' },
            { prompt: 'b', response: 'second' },
          ],
        },
      ],
      sequenceName: 'tiny',
    });

    const r1 = await model.invoke([new HumanMessage('x')]);
    expect(r1.content).toBe('first');

    const r2 = await model.invoke([new HumanMessage('x')]);
    expect(r2.content).toBe('second');

    // Wrap around
    const r3 = await model.invoke([new HumanMessage('x')]);
    expect(r3.content).toBe('first');
  });
});
