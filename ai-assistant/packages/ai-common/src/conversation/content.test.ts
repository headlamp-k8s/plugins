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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeContent } from './content';

describe('sanitizeContent without DOMParser', () => {
  beforeEach(() => vi.stubGlobal('DOMParser', undefined));
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ['<b>bold</b> &amp; text', 'bold & text'],
    ['a < b and c > d', 'a  d'],
    ['unclosed <tag', 'unclosed <tag'],
    ['<<b>>', '>'],
    ['&amp;lt;b&amp;gt; &lt;i&gt; &quot;x&quot; &#39;y&#39;', '&lt;b&gt; <i> "x" \'y\''],
  ])('converts %j to %j', (input, expected) => {
    expect(sanitizeContent(input)).toBe(expected);
  });

  it('strips tags in linear time', () => {
    const input = '<'.repeat(100_000);
    const start = performance.now();
    expect(sanitizeContent(input)).toBe(input);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
