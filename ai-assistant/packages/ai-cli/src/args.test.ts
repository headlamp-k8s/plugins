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

import { describe, expect, it } from 'vitest';
import { parseArgs } from './args.js';

const base = ['node', 'headlamp-ai'];

describe('parseArgs', () => {
  it('defaults to no query and no flags', () => {
    const result = parseArgs([...base]);
    expect(result.query).toBe('');
    expect(result.interactive).toBe(false);
    expect(result.autoDetect).toBe(false);
    expect(result.allowMutations).toBe(false);
    expect(result.help).toBe(false);
    expect(result.skillSources).toEqual([]);
  });

  it('captures positional words as the query', () => {
    const result = parseArgs([...base, 'list', 'pods']);
    expect(result.query).toBe('list pods');
  });

  it('parses --provider and --model', () => {
    const result = parseArgs([...base, '--provider', 'openai', '--model', 'gpt-4o']);
    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o');
  });

  it('parses --api-key', () => {
    const result = parseArgs([...base, '--api-key', 'sk-test']);
    expect(result.apiKey).toBe('sk-test');
  });

  it('parses --interactive and -i', () => {
    expect(parseArgs([...base, '--interactive']).interactive).toBe(true);
    expect(parseArgs([...base, '-i']).interactive).toBe(true);
  });

  it('parses --auto-detect and --autodetect', () => {
    expect(parseArgs([...base, '--auto-detect']).autoDetect).toBe(true);
    expect(parseArgs([...base, '--autodetect']).autoDetect).toBe(true);
  });

  it('parses --allow-mutations', () => {
    expect(parseArgs([...base, '--allow-mutations']).allowMutations).toBe(true);
  });

  it('parses --help and -h', () => {
    expect(parseArgs([...base, '--help']).help).toBe(true);
    expect(parseArgs([...base, '-h']).help).toBe(true);
  });

  it('parses --skill-source (repeatable)', () => {
    const result = parseArgs([
      ...base,
      '--skill-source',
      'https://github.com/org/repo1',
      '--skill-source',
      'https://github.com/org/repo2',
    ]);
    expect(result.skillSources).toEqual([
      'https://github.com/org/repo1',
      'https://github.com/org/repo2',
    ]);
  });

  it('parses --config', () => {
    expect(parseArgs([...base, '--config', './my-config.json']).configPath).toBe(
      './my-config.json'
    );
  });

  it('parses --system-prompt', () => {
    expect(parseArgs([...base, '--system-prompt', 'You are helpful.']).systemPrompt).toBe(
      'You are helpful.'
    );
  });

  it('captures positional words after unknown flags as query', () => {
    // Unknown flags are skipped but their value (non-flag word) is captured as query
    const result = parseArgs([...base, '--unknown-flag', 'value', 'real query']);
    expect(result.query).toBe('value real query');
  });
});
