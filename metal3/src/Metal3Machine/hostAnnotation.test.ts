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
import { parseHostAnnotation } from './hostAnnotation';

describe('parseHostAnnotation', () => {
  it('returns null when the value is absent', () => {
    expect(parseHostAnnotation(undefined)).toBeNull();
    expect(parseHostAnnotation('')).toBeNull();
  });

  it('parses a namespace/name pair', () => {
    expect(parseHostAnnotation('metal3/host-03-degraded')).toEqual({
      namespace: 'metal3',
      name: 'host-03-degraded',
    });
  });

  it('returns null when the namespace or name is missing', () => {
    expect(parseHostAnnotation('host-03-degraded')).toBeNull();
    expect(parseHostAnnotation('metal3/')).toBeNull();
    expect(parseHostAnnotation('/host-03-degraded')).toBeNull();
  });

  it('returns null when there are extra path segments', () => {
    expect(parseHostAnnotation('a/b/c')).toBeNull();
  });
});
