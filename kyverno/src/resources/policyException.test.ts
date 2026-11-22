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

import { describe, expect, test } from 'vitest';
import { PolicyException } from './policyException';

function makePolicyException(spec: Record<string, unknown>) {
  return new PolicyException({
    kind: 'PolicyException',
    apiVersion: 'kyverno.io/v2',
    metadata: {
      name: 'test-exception',
      namespace: 'default',
      uid: 'abc-123',
    },
    spec,
  } as any);
}

describe('PolicyException', () => {
  test('exceptions returns the list from spec', () => {
    const pe = makePolicyException({
      match: {},
      exceptions: [
        { policyName: 'restrict-images', ruleNames: ['check-tag'] },
        { policyName: 'require-labels', ruleNames: ['check-team-label'] },
      ],
    });

    expect(pe.exceptions).toHaveLength(2);
    expect(pe.exceptions[0]).toEqual({
      policyName: 'restrict-images',
      ruleNames: ['check-tag'],
    });
  });

  test('exceptions returns an empty array when spec.exceptions is missing', () => {
    const pe = makePolicyException({ match: {} });
    expect(pe.exceptions).toEqual([]);
  });

  test('policyNames maps exceptions to their policy names', () => {
    const pe = makePolicyException({
      match: {},
      exceptions: [
        { policyName: 'restrict-images', ruleNames: ['check-tag'] },
        { policyName: 'require-labels', ruleNames: ['check-team-label'] },
      ],
    });

    expect(pe.policyNames).toEqual(['restrict-images', 'require-labels']);
  });

  test('policyNames is empty when there are no exceptions', () => {
    const pe = makePolicyException({ match: {} });
    expect(pe.policyNames).toEqual([]);
  });

  test('background defaults to true when not set in spec', () => {
    const pe = makePolicyException({ match: {}, exceptions: [] });
    expect(pe.background).toBe(true);
  });

  test('background reflects an explicit false value', () => {
    const pe = makePolicyException({ match: {}, exceptions: [], background: false });
    expect(pe.background).toBe(false);
  });

  test('background reflects an explicit true value', () => {
    const pe = makePolicyException({ match: {}, exceptions: [], background: true });
    expect(pe.background).toBe(true);
  });
});
