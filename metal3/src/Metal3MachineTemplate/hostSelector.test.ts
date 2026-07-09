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
import { formatHostSelector } from './hostSelector';

describe('formatHostSelector', () => {
  it('returns "-" when the selector is absent', () => {
    expect(formatHostSelector(undefined)).toBe('-');
  });

  it('returns "-" for an empty selector', () => {
    expect(formatHostSelector({})).toBe('-');
  });

  it('formats matchLabels as key=value pairs', () => {
    expect(formatHostSelector({ matchLabels: { 'node-role': 'control-plane', zone: 'a' } })).toBe(
      'node-role=control-plane, zone=a'
    );
  });

  it('sorts matchLabels by key for stable output', () => {
    expect(formatHostSelector({ matchLabels: { zone: 'a', app: 'web' } })).toBe('app=web, zone=a');
  });

  it('formats matchExpressions that carry values with a bracketed list', () => {
    expect(
      formatHostSelector({
        matchExpressions: [{ key: 'disk', operator: 'In', values: ['ssd', 'nvme'] }],
      })
    ).toBe('disk In [ssd, nvme]');
  });

  it('omits the bracketed list for value-less operators (Exists/DoesNotExist)', () => {
    expect(formatHostSelector({ matchExpressions: [{ key: 'gpu', operator: 'Exists' }] })).toBe(
      'gpu Exists'
    );
  });

  it('keeps the bracketed list for value-taking operators even when values is empty', () => {
    expect(
      formatHostSelector({ matchExpressions: [{ key: 'disk', operator: 'In', values: [] }] })
    ).toBe('disk In []');
  });

  it('combines matchLabels and matchExpressions', () => {
    expect(
      formatHostSelector({
        matchLabels: { zone: 'a' },
        matchExpressions: [{ key: 'gpu', operator: 'DoesNotExist' }],
      })
    ).toBe('zone=a, gpu DoesNotExist');
  });
});
