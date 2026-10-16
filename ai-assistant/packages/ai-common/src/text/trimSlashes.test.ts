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
import { trimSlashes, trimTrailingSlashes } from './trimSlashes';

describe('trimTrailingSlashes', () => {
  it.each([
    ['https://x.openai.azure.com', 'https://x.openai.azure.com'],
    ['https://x.openai.azure.com/', 'https://x.openai.azure.com'],
    ['https://x.openai.azure.com///', 'https://x.openai.azure.com'],
    ['http://localhost:8000/v1/', 'http://localhost:8000/v1'],
    ['/', ''],
    ['', ''],
  ])('trims %j to %j', (input, expected) => {
    expect(trimTrailingSlashes(input)).toBe(expected);
  });

  it('keeps slashes that are not at the end', () => {
    expect(trimTrailingSlashes('https://x.com//path//x')).toBe('https://x.com//path//x');
  });

  it('handles long runs of slashes in linear time', () => {
    const input = `https://x.openai.azure.com${'/'.repeat(100_000)}x`;
    const start = performance.now();
    expect(trimTrailingSlashes(input)).toBe(input);
    expect(performance.now() - start).toBeLessThan(100);
  });
});

describe('trimSlashes', () => {
  it.each([
    ['/skills/k8s/', 'skills/k8s'],
    ['///skills//k8s///', 'skills//k8s'],
    ['skills', 'skills'],
    ['///', ''],
    ['', ''],
  ])('trims %j to %j', (input, expected) => {
    expect(trimSlashes(input)).toBe(expected);
  });

  it('handles long runs of slashes in linear time', () => {
    const input = `a${'/'.repeat(100_000)}a`;
    const start = performance.now();
    expect(trimSlashes(input)).toBe(input);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
