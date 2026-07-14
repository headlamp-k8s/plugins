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

import type { ConversationMessage as Prompt } from '../../conversation/types';

/** A timestamped cache entry. */
export interface CacheEntry<T> {
  /** Cached response value. */
  value: T;
  /** Creation time in Unix milliseconds. */
  timestamp: number;
}

/**
 * Generates a deterministic string cache key from `history` (last 3 entries)
 * and `message`.
 *
 * Uses a djb2-style 32-bit hash so collisions are possible but rare for
 * typical chat inputs.
 *
 * @param history - Conversation history whose last three entries provide context.
 * @param message - Current user message included in the key.
 * @returns A deterministic key containing a signed hash and message length.
 */
export function generateCacheKey(history: Prompt[], message: string): string {
  const contextStr = history
    .slice(-3)
    .map(p => `${p.role}:${p.content?.substring(0, 100) ?? ''}`)
    .join('|');

  const fullStr = `${contextStr}|${message}`;
  let hash = 0;
  for (let i = 0; i < fullStr.length; i++) {
    const char = fullStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0; // force signed 32-bit (was `hash & hash` — same result but clearer)
  }
  return `msg_${hash}_${message.length}`;
}

/**
 * Removes all entries from `cache` whose `timestamp` is older than `ttlMs`
 * milliseconds relative to `now` (defaults to `Date.now()`).
 *
 * @param cache - Cache mutated by removing expired entries.
 * @param ttlMs - Maximum entry age in milliseconds; exact-boundary entries remain.
 * @param now - Reference time in Unix milliseconds.
 * @returns No value.
 */
export function evictExpired<T>(
  cache: Map<string, CacheEntry<T>>,
  ttlMs: number,
  now: number = Date.now()
): void {
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > ttlMs) cache.delete(key);
  }
}

/**
 * Trims `cache` to at most `maxSize` entries by evicting the oldest ones
 * (by `timestamp`). No-op when `cache.size <= maxSize`.
 *
 * @param cache - Cache mutated by removing its oldest entries.
 * @param maxSize - Maximum number of entries to retain.
 * @returns No value.
 */
export function evictOldestToFit<T>(cache: Map<string, CacheEntry<T>>, maxSize: number): void {
  if (cache.size <= maxSize) return;
  const sorted = Array.from(cache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp);
  const toRemove = sorted.slice(0, cache.size - maxSize);
  toRemove.forEach(([key]) => cache.delete(key));
}
