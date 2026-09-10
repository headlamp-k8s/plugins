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
import { phaseCellValue } from './phaseCell';

describe('phaseCellValue', () => {
  // Headlamp's table memoizes each cell on its column's getValue() output
  // (MemoCell in components/common/Table/Table.js compares
  // `a.cell.getValue() === b.cell.getValue()`), so anything the cell renders
  // but this value ignores can go stale on screen. The Phase cell renders the
  // phase *and* the operator's reason, so both have to be in here.
  it('gives every distinct rendered state a distinct value', () => {
    const values = [
      phaseCellValue('Failing over', undefined),
      phaseCellValue('Failing over', 'waiting for the new primary'),
      phaseCellValue('Failing over', 'instance-2 is not yet streaming'),
      phaseCellValue('Unknown', undefined),
      phaseCellValue('Unknown', 'waiting for the new primary'),
    ];

    expect(new Set(values).size).toBe(values.length);
  });

  // The bug this function exists to prevent: CloudNativePG holds a phase steady
  // while it rewrites the reason underneath, so keying on the phase alone left
  // the tooltip showing whatever reason happened to be there at first paint.
  it('changes when only the reason changes', () => {
    expect(phaseCellValue('Failing over', 'attempt 1 failed')).not.toBe(
      phaseCellValue('Failing over', 'attempt 2 failed')
    );
  });

  // The mirror of the rule above: a value that changes when the cell does not
  // would repaint for nothing. An absent reason and an empty one both render as
  // a bare label with no tooltip, so they are the same state.
  it('treats an absent and an empty reason as the same state', () => {
    expect(phaseCellValue('Failing over', '')).toBe(phaseCellValue('Failing over', undefined));
    expect(phaseCellValue('Failing over', null)).toBe(phaseCellValue('Failing over', undefined));
  });

  it('sorts by phase first, regardless of reason', () => {
    const applying = phaseCellValue('Applying configuration', 'zzz last alphabetically');
    const failing = phaseCellValue('Failing over', 'aaa first alphabetically');

    expect(applying < failing).toBe(true);
  });

  it('keeps the phase readable at the front of the value, for search and export', () => {
    expect(phaseCellValue('Failing over', 'attempt 1 failed').startsWith('Failing over')).toBe(
      true
    );
  });
});
