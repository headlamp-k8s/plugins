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
import { isScaledToZero } from './status';

describe('isScaledToZero', () => {
  it('returns false for null or undefined items', () => {
    expect(isScaledToZero(null)).toBe(false);
    expect(isScaledToZero(undefined)).toBe(false);
  });

  it('returns false when Ready condition is False or missing', () => {
    const itemNotReady = {
      status: {
        conditions: [
          { type: 'Ready', status: 'False', reason: 'RevisionFailed' },
          { type: 'Active', status: 'False', reason: 'NoTraffic' },
        ],
      },
    } as any;
    expect(isScaledToZero(itemNotReady)).toBe(false);
  });

  it('returns true when Ready is True and Active is False (idle NoTraffic)', () => {
    const idleItem = {
      status: {
        conditions: [
          { type: 'Ready', status: 'True' },
          { type: 'Active', status: 'False', reason: 'NoTraffic' },
        ],
      },
    } as any;
    expect(isScaledToZero(idleItem)).toBe(true);
  });

  it('returns true when Ready is True and actualReplicas is 0', () => {
    const zeroReplicasItem = {
      status: {
        conditions: [{ type: 'Ready', status: 'True' }],
        actualReplicas: 0,
      },
    } as any;
    expect(isScaledToZero(zeroReplicasItem)).toBe(true);
  });

  it('returns false when Ready is True and active pods are running (actualReplicas > 0)', () => {
    const activeItem = {
      status: {
        conditions: [
          { type: 'Ready', status: 'True' },
          { type: 'Active', status: 'True' },
        ],
        actualReplicas: 1,
      },
    } as any;
    expect(isScaledToZero(activeItem)).toBe(false);
  });
});
