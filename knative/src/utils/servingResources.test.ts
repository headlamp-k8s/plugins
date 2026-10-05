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

import { formatList, formatNanoseconds, formatTraffic } from './servingResources';

describe('Serving list formatters', () => {
  it('uses a dash for missing values', () => {
    expect(formatList(undefined)).toBe('-');
    expect(formatTraffic(undefined)).toBe('-');
    expect(formatNanoseconds(undefined)).toBe('-');
  });

  it('preserves zero values', () => {
    expect(formatNanoseconds(0)).toBe('0s');
  });

  it('formats Go time.Duration values serialized as nanoseconds', () => {
    expect(formatNanoseconds(60_000_000_000)).toBe('60s');
    expect(formatNanoseconds(1_500_000_000)).toBe('1.5s');
  });

  it('formats resolved and unresolved traffic targets', () => {
    expect(
      formatTraffic([
        { percent: 80, revisionName: 'checkout-00004' },
        { percent: 20, latestRevision: true },
        { percent: 10, latestRevision: true, tag: 'stable' },
        { percent: 0 },
        { revisionName: 'checkout-00005' },
      ])
    ).toBe(
      '80% checkout-00004, 20% latest revision, 10% latest revision (tag: stable), 0% unresolved target, 0% checkout-00005'
    );
  });
});
