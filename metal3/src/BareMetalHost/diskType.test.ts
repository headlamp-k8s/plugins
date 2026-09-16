/*
 * Copyright 2026 The Kubernetes Authors
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
import { formatDiskType } from './diskType';

describe('formatDiskType', () => {
  it('uses the reported type, including NVME', () => {
    expect(formatDiskType({ type: 'HDD' })).toBe('HDD');
    expect(formatDiskType({ type: 'SSD' })).toBe('SSD');
    expect(formatDiskType({ type: 'NVME' })).toBe('NVME');
  });

  it('prefers type over the deprecated rotational flag', () => {
    // An NVMe drive is not rotational, but it is not an SSD either.
    expect(formatDiskType({ type: 'NVME', rotational: false })).toBe('NVME');
    expect(formatDiskType({ type: 'HDD', rotational: true })).toBe('HDD');
  });

  it('reports an unknown type as unknown rather than guessing SSD', () => {
    expect(formatDiskType({})).toBe('-');
    expect(formatDiskType(undefined)).toBe('-');
    expect(formatDiskType({ type: '' })).toBe('-');
    expect(formatDiskType({ type: '   ' })).toBe('-');
    // rotational is omitempty, so a false is indistinguishable from absent.
    expect(formatDiskType({ rotational: false })).toBe('-');
  });

  it('falls back to rotational only when it is true', () => {
    expect(formatDiskType({ rotational: true })).toBe('HDD');
  });

  it('normalises the enum case and passes unknown values through', () => {
    expect(formatDiskType({ type: 'nvme' })).toBe('NVME');
    expect(formatDiskType({ type: 'ssd' })).toBe('SSD');
    expect(formatDiskType({ type: 'Optane' })).toBe('Optane');
  });
});
