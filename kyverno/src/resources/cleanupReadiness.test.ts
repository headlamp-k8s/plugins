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
import { interpretCleanupReadiness } from './cleanupReadiness';
import { PolicyCondition } from './kyvernoPolicy';

describe('interpretCleanupReadiness', () => {
  test('is unknown, not a confirmed failure, when no Ready condition exists, found via Copilot review', () => {
    // Kyverno v1.16.4's cleanup controller never sets a Ready condition at all after a successful
    // execution, only status.lastExecutionTime, so a perfectly healthy cleanup policy has no Ready
    // condition either, exactly the same as a genuinely broken one would if this weren't handled.
    expect(interpretCleanupReadiness(undefined)).toEqual({ ready: false, readyUnknown: true });
    expect(interpretCleanupReadiness([])).toEqual({ ready: false, readyUnknown: true });

    const unrelatedConditions: PolicyCondition[] = [{ type: 'Succeeded', status: 'True' }];
    expect(interpretCleanupReadiness(unrelatedConditions)).toEqual({
      ready: false,
      readyUnknown: true,
    });
  });

  test('is confirmed ready once Kyverno sets an explicit True Ready condition', () => {
    const conditions: PolicyCondition[] = [{ type: 'Ready', status: 'True' }];
    expect(interpretCleanupReadiness(conditions)).toEqual({ ready: true, readyUnknown: false });
  });

  test('is confirmed not ready, not unknown, when Ready is explicitly False', () => {
    const conditions: PolicyCondition[] = [{ type: 'Ready', status: 'False' }];
    expect(interpretCleanupReadiness(conditions)).toEqual({ ready: false, readyUnknown: false });
  });
});
