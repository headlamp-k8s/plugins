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
import type { ConversationMessage as Prompt } from '../../conversation/types';
import { evictExpired, evictOldestToFit, generateCacheKey } from './responseCache';

// ---------------------------------------------------------------------------
// generateCacheKey
// ---------------------------------------------------------------------------
describe('generateCacheKey', () => {
  it('returns a string starting with "msg_"', () => {
    expect(generateCacheKey([], 'hello')).toMatch(/^msg_/);
  });

  it('is deterministic — same inputs produce the same key', () => {
    const history: Prompt[] = [{ role: 'user', content: 'prior' }];
    const k1 = generateCacheKey(history, 'message');
    const k2 = generateCacheKey(history, 'message');
    expect(k1).toBe(k2);
  });

  it('changes when message changes', () => {
    const k1 = generateCacheKey([], 'hello');
    const k2 = generateCacheKey([], 'world');
    expect(k1).not.toBe(k2);
  });

  it('changes when history changes', () => {
    const k1 = generateCacheKey([], 'hi');
    const k2 = generateCacheKey([{ role: 'user', content: 'context' }], 'hi');
    expect(k1).not.toBe(k2);
  });

  it('only uses the last 3 history entries', () => {
    const long: Prompt[] = [
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
      { role: 'user', content: 'c' },
      { role: 'assistant', content: 'd' },
    ];
    const short: Prompt[] = [
      { role: 'assistant', content: 'b' },
      { role: 'user', content: 'c' },
      { role: 'assistant', content: 'd' },
    ];
    // Both use the same last-3 entries, so keys should be equal
    expect(generateCacheKey(long, 'msg')).toBe(generateCacheKey(short, 'msg'));
  });

  it('encodes message length in the key suffix', () => {
    const k = generateCacheKey([], 'hi');
    expect(k.endsWith('_2')).toBe(true);
  });

  it('handles prompts with undefined content without throwing', () => {
    const history = [{ role: 'user', content: undefined }] as unknown as Prompt[];
    expect(() => generateCacheKey(history, 'test')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// evictExpired
// ---------------------------------------------------------------------------
describe('evictExpired', () => {
  it('removes entries older than ttlMs', () => {
    const cache = new Map([
      ['old', { value: 1, timestamp: 100 }],
      ['new', { value: 2, timestamp: 9900 }],
    ]);
    evictExpired(cache, 1000, 10000); // now=10000, ttl=1000
    // old: 10000-100=9900 > 1000 → evict
    // new: 10000-9900=100 ≤ 1000 → keep
    expect(cache.has('old')).toBe(false);
    expect(cache.has('new')).toBe(true);
  });

  it('keeps all entries when none are expired', () => {
    const cache = new Map([
      ['a', { value: 1, timestamp: 9500 }],
      ['b', { value: 2, timestamp: 9800 }],
    ]);
    evictExpired(cache, 1000, 10000);
    expect(cache.size).toBe(2);
  });

  it('clears all entries when all are expired', () => {
    const cache = new Map([
      ['a', { value: 1, timestamp: 0 }],
      ['b', { value: 2, timestamp: 1 }],
    ]);
    evictExpired(cache, 1000, 10000);
    expect(cache.size).toBe(0);
  });

  it('TTL boundary: entry at exactly ttlMs age is NOT evicted (strict > semantics)', () => {
    // The check is `now - timestamp > ttlMs` (strict), so an entry that is
    // exactly ttlMs old survives. This is a minor off-by-one relative to the
    // intuitive "expire entries that have reached or exceeded TTL" semantic.
    const cache = new Map([['boundary', { value: 1, timestamp: 9000 }]]);
    evictExpired(cache, 1000, 10000); // age = 10000 - 9000 = 1000 === ttlMs
    expect(cache.has('boundary')).toBe(true); // documents > not >=
  });

  it('entry one millisecond past TTL IS evicted', () => {
    const cache = new Map([['stale', { value: 1, timestamp: 8999 }]]);
    evictExpired(cache, 1000, 10000); // age = 1001 > 1000
    expect(cache.has('stale')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// evictOldestToFit
// ---------------------------------------------------------------------------
describe('evictOldestToFit', () => {
  it('does nothing when size is within limit', () => {
    const cache = new Map([
      ['a', { value: 1, timestamp: 100 }],
      ['b', { value: 2, timestamp: 200 }],
    ]);
    evictOldestToFit(cache, 5);
    expect(cache.size).toBe(2);
  });

  it('removes oldest entries to fit within maxSize', () => {
    const cache = new Map([
      ['oldest', { value: 1, timestamp: 100 }],
      ['middle', { value: 2, timestamp: 200 }],
      ['newest', { value: 3, timestamp: 300 }],
    ]);
    evictOldestToFit(cache, 2);
    expect(cache.size).toBe(2);
    expect(cache.has('oldest')).toBe(false);
    expect(cache.has('newest')).toBe(true);
    expect(cache.has('middle')).toBe(true);
  });

  it('handles maxSize=0 by clearing all entries', () => {
    const cache = new Map([['a', { value: 1, timestamp: 1 }]]);
    evictOldestToFit(cache, 0);
    expect(cache.size).toBe(0);
  });
});
